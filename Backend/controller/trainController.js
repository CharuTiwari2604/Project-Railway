const axios = require('axios')
const Train = require('../models/trainmodel')
const Station = require('../models/stationmodel')
const Schedule = require('../models/schedulemodel')

exports.getTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { forceSync } = req.query;

        let mySchedule = await Schedule.findOne({ trainNumber: trainNumber.toString().trim() });

        let myTrain = await Train.findOne({ trainNumber });
        if (!myTrain) return res.status(404).json({ message: "Train tracking record not initialized yet. Run sync first." });
        
       if (!mySchedule) {
            mySchedule = {
                trainNumber,
                trainName: myTrain.name !== "Initializing..." ? myTrain.name : `Train ${trainNumber}`,
                trainType: "express",
                stations: [
                    { stationCode: myTrain.currentStationCode, stationName: myTrain.currentStationName, distance: myTrain.currentKM },
                    { stationCode: "NEXT_STN", stationName: myTrain.nextStationName, distance: myTrain.nextStationDistance || (myTrain.currentKM + 50) }
                ]
            };
        }

        const priorityMap = { "rajdhani": 1, "shatabdi": 1, "duronto": 1, "superfast": 2, "express": 3, "passenger": 4 };
        const myPriority = priorityMap[mySchedule.trainType?.toLowerCase()] || 3;

        const currentStnIndex = mySchedule.stations.findIndex(s => s.stationCode === myTrain.currentStationCode);

        let nextInMap;
        if (currentStnIndex !== -1 && currentStnIndex < mySchedule.stations.length - 1) {
            nextInMap = mySchedule.stations[currentStnIndex + 1];
        } else {
            nextInMap = mySchedule.stations.find(s => Number(s.distance) > Number(myTrain.currentKM)) || mySchedule.stations[mySchedule.stations.length - 1];
        }

        let distToNext =  Number(myTrain.nextStationDistance || 0);

        let finalReason = {
            code: "ON_TIME",
            severity: "normal",
            message: myTrain.liveStatusMessage || "Running on Schedule"
        };
        
        const isArrivedState = distToNext === 0;

       if (myTrain.totalDelay > 0 && !isArrivedState) {
            finalReason.message = `Delayed by ${myTrain.totalDelay} minutes. ${myTrain.liveStatusMessage}`;
            finalReason.severity = "medium";
        } else if (isArrivedState) {
            finalReason = { 
                code: "ARRIVED", 
                severity: "success", 
                message: myTrain.liveStatusMessage || `Arrived at ${myTrain.nextStationName}.` 
            };
        }

        let sectionTrains = [];
        if (forceSync === "true") {
            try {                                           //getTrainsBetween
                const trafficRes = await axios.get(`https://rail-info-api-india1.p.rapidapi.com/v1/trains/between?from=${myTrain.currentStationCode}&to=${myTrain.nextStationName}`, {
                    headers: { 'X-RapidAPI-Key': process.env.RAPID_API_KEY }
                });
                sectionTrains = trafficRes.data.data || [];
            } catch (e) { console.log("Traffic API failed, using fallback."); }
        } 
        else{
            sectionTrains=[];
        }

const targetPlatform = nextInMap?.platform || "1";
        if (distToNext === 0) {
           finalReason = { code: "ARRIVED", severity: "success", message: `Arrived at ${myTrain.nextStationName}.` };
        } else {                                         
            const stalker = sectionTrains.find(t => (priorityMap[t.train_type?.toLowerCase()] || 3) < myPriority);

            const isTrainStalled = myTrain.totalDelay > 0 || myTrain.liveStatusMessage.toLowerCase().includes("stopped")
            if (isTrainStalled && distToNext >= 15) {
                if (stalker) {
                    finalReason = {
                        code: "OVERTAKE",
                        severity: "high",
                        message: `Waiting on loop track for higher priority ${stalker.train_name} to pass.`
                    };
                } else {
                    finalReason = {
                        code: "TECHNICAL",
                        severity: "medium",
                        message: "Section Traffic Congestion: Blocked by train traffic directly ahead."
                    };
                }
            }

            else if (isTrainStalled && distToNext <= 5) {
                const targetPlatform = nextInMap?.platform || "1";
                const isOccupied = sectionTrains.some(t => t.platform === targetPlatform && t.status === "Arrived");

                if (isOccupied) {
                    finalReason = {
                        code: "PLATFORM_FULL",
                        severity: "medium",
                        message: `Outer Signal Halt: Platform ${targetPlatform} at ${myTrain.nextStationName} is full. Waiting for clearance.`
                    };
                } else {
                    finalReason = {
                        code: "HALT",
                        severity: "normal",
                        message: `Approaching Station: Clear to enter ${myTrain.nextStationName} on Platform ${targetPlatform}.`
                    };
                }
            }
        }

        if (myTrain.statusReason?.code !== finalReason.code) {
            myTrain.statusReason = finalReason;
            myTrain.history.push({ message: finalReason.message, timestamp: new Date() });
            if (myTrain.history.length > 8) myTrain.history.shift();
            await myTrain.save();
        }


        res.json({
            trainNumber: myTrain?.trainNumber,
            name: myTrain?.name,
            totalDelay: myTrain?.totalDelay || 0, 
            currentKM: myTrain?.currentKM || 0,
            currentStationName: isArrivedState ? myTrain.currentStationName : myTrain.currentStationName, 
            nextStationName: isArrivedState ? (nextInMap?.stationName || "Terminus") : myTrain.nextStationName,
            distToNext: parseFloat(distToNext.toFixed(1)) || 0, 
            mergedStatus: finalReason?.message || "Syncing dynamic telemetry...",
            expectedPlatform: nextInMap?.platform || "1",
            finalReason: finalReason
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getAllTrains = async (req, res) => {
    try {
        const allTrains = await Train.find().populate('currentStationCode')
        res.json(allTrains)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.syncWithApi = async (req, res) => {
    try {
        let { trainNumber } = req.params;
        trainNumber = trainNumber.toString().trim();
        const { startDay } = req.query;
        const targetDay = startDay || "0";
        let apiData = null;

        try {
            const response = await axios({
                method: 'GET',
                url: `https://irctc-api2.p.rapidapi.com/liveTrain`,
                params: {
                    trainNumber: trainNumber,
                    startDay: targetDay
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPID_API_KEY,
                    'X-RapidAPI-Host': 'irctc-api2.p.rapidapi.com',
                    'Content-Type': 'application/json'
                },
                timeout: 8000
            });

            apiData = response.data?.data || response.data;
        } catch (apiErr) {
            apiData = {
                train_number: trainNumber,
                train_name: `Express (${trainNumber})`,
                delay: 0,
                next_stoppage: "DESTINATION",
                current_station_name: "TRACK_OUTER",
                distance_from_source: 100,
                current_location_info: [
                    { type: 1, message: "Crossed Baseline Anchor Station" },
                    { type: 2, message: "10 kms to DESTINATION" }
                ]
            };
        }

        let schedule = await Schedule.findOne({ trainNumber });
        let train = await Train.findOne({ trainNumber });

        if (!schedule) {
            console.log("New train requested. Making default template...")

            if (!train) {
                 const extractedTrainName = apiData?.train_name || `Express (${trainNumber})`;
                
                train = new Train({
                    trainNumber,
                    name: extractedTrainName,
                    priority: 3,
                    currentKM: 0,
                    liveStatusMessage: "Initializing Khabri Tracking Framework..."
                });
            }

            train = parseLiveApiData(train, apiData);
            train.history.push({
                message: `Live Sync (Fallback): Confirmed at ${train.currentStationCode} (Delay: ${train.totalDelay} min)`,
                timestamp: new Date()
            });
            if (train.history.length > 5) train.history.shift();
            await train.save();
            return res.json({ message: "Sync Sucessfull (using fallback template).", train });

        }



        if (!train) {
            const priorityMap = { "rajdhani": 1, "shatabdi": 1, "duronto": 1, "vande bharat": 1, "superfast": 2, "express": 3, "passenger": 4 };
            const trainPriority = priorityMap[schedule.trainType?.toLowerCase()] || 3;
            train = new Train({
                trainNumber,
                name: schedule.trainName,
                priority: trainPriority,
                history: []
            });
        }
        train = parseLiveApiData(train, apiData);
        train.history.push({
            message: `Live Sync: Confirmed at ${train.currentStationName} ((Delay: ${train.totalDelay} min)`,
            timestamp: new Date()
        });

        if (train.history.length > 5) train.history.shift();

        await train.save();
        return res.json({ message: "Sync Successful", train });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", detail: err.message });
    }
};



function parseLiveApiData(train, apiData) { 

    const innerData = apiData?.data || apiData;
    const locationList = innerData?.current_location_info || [];

    train.name = innerData?.train_name || train.name;
    train.totalDelay = typeof innerData?.delay === 'number' ? innerData.delay : 0;

    const disItem = locationList.find(l => l.message?.toLowerCase().includes("kms to"));
    let extractedDistance = 0;
    if (disItem) {
        const match = disItem.message.match(/^(\d+)/);
        if (match) extractedDistance = Number(match[1]);
    }
    train.nextStationDistance = extractedDistance;

    const statusHeaderItem = locationList.find(l => l.type === 1) || locationList[0];
    const liveStatusText = statusHeaderItem?.message || "In Transit";
    train.liveStatusMessage = liveStatusText;

    const nextStoppageRaw = innerData?.next_stoppage_info?.next_stoppage || innerData?.next_stoppage || "Next Station";
    const cleanNextStopName = nextStoppageRaw.replace('~', '').trim();
    const hasArrived = liveStatusText.toLowerCase().includes("arrived") || extractedDistance === 0;

    if (hasArrived) {
        train.currentStationName = cleanNextStopName; 
        train.currentStationCode = cleanNextStopName;
       train.nextStationName = cleanNextStopName;
       train.liveStatusMessage = `Arrived at ${cleanNextStopName}. Departing Shortly...`;
    } else {
        const crossedItem = locationList.find(l => l.message?.toLowerCase().includes("crossed"));
        if (crossedItem) {
            train.currentStationName = crossedItem.message;
            train.currentStationCode = innerData?.current_station_name?.replace('~', '').trim() || "TRACK";
        } else {
            train.currentStationName = innerData?.current_station_name?.replace('~', '').trim() || "In Transit";
            train.currentStationCode = train.currentStationName;
        }
        train.nextStationName = cleanNextStopName;
    }

    train.currentKM = Number(innerData?.distance_from_source || 0);
    train.lastUpdatedAt = new Date();
    return train;


}