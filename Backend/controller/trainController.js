const axios = require('axios')
const Train = require('../models/trainmodel')
const Station = require('../models/stationmodel')
const Schedule = require('../models/schedulemodel')
const { v4: uuidv4 } = require('uuid');

exports.getTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { forceSync } = req.query;

        const mySchedule = await Schedule.findOne({ trainNumber: trainNumber.toString().trim() });
        if (!mySchedule) return res.status(404).json({ message: "Schedule Map not found" })

        let myTrain = await Train.findOne({ trainNumber }).populate('route');

        const priorityMap = { "rajdhani": 1, "shatabdi": 1, "duronto": 1, "superfast": 2, "express": 3, "passenger": 4 };
        const myPriority = priorityMap[mySchedule.trainType?.toLowerCase()] || 3;

        if (!myTrain) {
            myTrain = new Train({
                trainNumber,
                name: mySchedule.trainName,
                priority: myPriority,
                currentKM: 0,
                liveStatusMessage: "Initializing Khabri Tracking..."
            });
            await myTrain.save();
        }


        const currentStnIndex = mySchedule.stations.findIndex(s => s.stationCode === myTrain.currentStationCode);
        const currentKM = Number(myTrain.currentKM);
        // const nextInMap = mySchedule.stations.find(s => Number(s.distance) >= currentKM) || mySchedule.stations[mySchedule.stations.length - 1];
       let nextInMap;
if (currentStnIndex !== -1 && currentStnIndex < mySchedule.stations.length - 1) {
    nextInMap = mySchedule.stations[currentStnIndex + 1];
} else {
    nextInMap = mySchedule.stations.find(s => Number(s.distance) > Number(myTrain.currentKM)) || mySchedule.stations[mySchedule.stations.length - 1];
}
        // const distToNext = Math.max(0, Number(nextInMap.distance) - currentKM);
        const distToNext = Math.abs(Number(nextInMap.distance) - Number(myTrain.currentKM));
        if (distToNext < 0) distToNext = 0;

        let finalReason = {
            code: "ON_TIME",
            severity: "normal",
            message: myTrain.liveStatusMessage || "Running on Schedule"
        };


        let sectionTrains = [];
        if (forceSync === "true") {
            try {                                           //getTrainsBetween
                const trafficRes = await axios.get(`https://rail-info-api-india1.p.rapidapi.com/v1/trains/between?from=${myTrain.currentStationCode}&to=${nextInMap.stationCode}`, {
                    headers: { 'X-RapidAPI-Key': process.env.RAPID_API_KEY }
                });
                sectionTrains = trafficRes.data.data || [];
            } catch (e) { console.log("Traffic API failed, using fallback."); }
        } else {
            sectionTrains = [{ train_name: "12301 - RAJDHANI", train_type: "rajdhani", distance_km: (myTrain.currentKM + 3), speed: 130 }];
        }


        // if (myTrain.currentStationCode === mySchedule.stations[mySchedule.stations.length - 1].stationCode) {       //finished
        if (distToNext < 0.5) {
            finalReason = { code: "ARRIVED", severity: "success", message: ` Journey Completed at ${nextInMap.stationName}.` };
        }

        else {                                                          //overtake
            const stalker = sectionTrains.find(t => (priorityMap[t.train_type?.toLowerCase()] || 3) < myPriority);
            if (myTrain.currentSpeed === 0 && distToNext > 1.5 && stalker) {
                finalReason = {
                    code: "OVERTAKE",
                    severity: "high",
                    message: `Waiting at Outer for ${stalker.train_name} to pass. Priority Overtake in progress.`
                };
            }

            else if (myTrain.currentSpeed === 0 && distToNext <= 1.5) {
                // const targetPlatform = myTrain.expectedPlatform || "1";
                const targetPlatform = myTrain.expectedPlatform || nextInMap.platform || "1";
                const isOccupied = sectionTrains.some(t => t.platform === targetPlatform && t.status === "Arrived");

                if (isOccupied) {
                    finalReason = {
                        code: "PLATFORM_FULL",
                        severity: "medium",
                        message: ` Platform ${targetPlatform} at ${nextInMap.stationName} is occupied. Waiting for clearance.`
                    };
                } else {
                    finalReason = {
                        code: "HALT",
                        severity: "normal",
                        message: ` Halt at ${nextInMap.stationCode} (Platform: ${targetPlatform}).`
                    };
                }
            }

            else if (myTrain.currentSpeed === 0 && distToNext > 5) {
                const isLiveUpdateBetter = myTrain.liveStatusMessage && myTrain.liveStatusMessage.length > 10;
                finalReason = {
                    code: "TECHNICAL",
                    severity: "medium",
                    message: isLiveUpdateBetter ? myTrain.liveStatusMessage : "Technical Halt: Waiting for signal or track maintenance."
                };
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
            currentSpeed: myTrain?.currentSpeed || 0,
            currentKM: myTrain?.currentKM || 0,
            nextStationName: nextInMap?.stationName || nextInMap?.stationCode || "Tracking...",
            distToNext: parseFloat(distToNext.toFixed(1)) || 0,
            mergedStatus: finalReason?.message || "Syncing data...",
            expectedPlatform: myTrain?.expectedPlatform || "1",
            finalReason: finalReason
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getAllTrains = async (req, res) => {
    try {
        const allTrains = await Train.find().populate('route currentStationCode')
        res.json(allTrains)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



exports.syncWithApi = async (req, res) => {
    try {
        let { trainNumber } = req.params;
        trainNumber = trainNumber.toString().trim();
        const { departure_date } = req.query;
        let apiData = null;
        const apiDate = departure_date || new Date().toISOString().split('T')[0].replace(/-/g, '');

        try {
            const uniqueID = uuidv4();
            const response = await axios({
                method: 'GET',
                url: `https://indian-railway-irctc.p.rapidapi.com/api/trains/v1/train/status`,
                params: {
                    train_number: trainNumber,
                    departure_date: apiDate,
                    isH5: "true",
                    client: "web",
                    deviceIdentifier: "Mozilla/5.0-Khabri-App-" + uniqueID,
                },
                headers: {
                    'x-rapidapi-key': process.env.RAPID_API_KEY,
                    'x-rapidapi-host': 'indian-railway-irctc.p.rapidapi.com',
                    'x-rapid-api': 'rapid-api-database',
                    'Content-Type': 'application/json'
                },
                timeout: 8000
            });
            apiData = response.data?.data || response.data;
        } catch (apiErr) {
            apiData = {
                train_number: trainNumber,
                current_station: "NBQ",
                current_speed: 0,
                train_status_message: "API Offline, using mock location",
                stations: [
                    { stationCode: "NBQ", distance: "0", expected_platform: "3", stationName: "New Bongaigaon junction" },
                    { stationCode: "GHY", distance: "40", expected_platform: "2", stationName: "Guwahati junction" }
                ]
            };
        }

        const schedule = await Schedule.findOne({ trainNumber });
        if (!schedule) {
            return res.status(404).json({ message: "Train number not found in Schedules." });
        }

        let train = await Train.findOne({ trainNumber });

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

        const dataBody = apiData.body || apiData;
        train.liveStatusMessage = dataBody.train_status_message?.replace(/<[^>]*>/g, '') || "In Transit";

        const currentStnCode = dataBody.current_station || dataBody.current_station_code || dataBody.station_code || "Unknown";
        const stationsArray = dataBody.stations || dataBody.station_list || dataBody.route || [];

        const currentStnData = stationsArray.find(s =>
            s.stationCode === currentStnCode ||
            s.station_code === currentStnCode
        );

        train.currentKM = Number(currentStnData?.distance || dataBody.distance_from_source || train.currentKM || 0);
        train.currentStationCode = currentStnCode;
        train.currentSpeed = dataBody.current_speed || 0;
        // train.liveStatusMessage = dataBody.train_status_message || "In Transit";
        train.expectedPlatform = currentStnData?.expected_platform || "N/A";
        train.lastUpdatedAt = new Date();

        const liveMsg = `Confirmed at ${currentStnCode}`;
        train.history.push({
            message: `Live Sync: ${liveMsg} (Speed: ${train.currentSpeed} km/h)`,
            timestamp: new Date()
        });

        if (train.history.length > 5) train.history.shift();

        await train.save();
        return res.json({ message: "Sync Successful", train });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", detail: err.message });
    }
};