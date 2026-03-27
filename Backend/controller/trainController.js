const axios = require('axios')
const Train = require('../models/trainmodel')
const Station = require('../models/stationmodel')
const Schedule = require('../models/schedulemodel')

exports.getTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const myTrain = await Train.findOne({ trainNumber });
        if (!myTrain) return res.status(404).json({ message: "Train not found in our System" })
        const mySchedule = await Schedule.findOne({ trainNumber });
        if (!mySchedule) return res.status(404).json({ message: "Schedule Map not found" })

        let currentIndex = mySchedule.stations.findIndex(s => s.stationCode.trim() === myTrain.currentStationCode.trim());
        const currentInMap = mySchedule.stations[currentIndex] || null;
        if (currentIndex === -1 || myTrain.currentSpeed > 0) {
            nextIndex = mySchedule.stations.findIndex(s => s.distance > myTrain.currentKM);
            currentIndex = nextIndex === -1 ? mySchedule.stations.length -1 : nextIndex;
        }
        const nextInMap = mySchedule.stations[currentIndex] || mySchedule.stations[mySchedule.stations.length - 1];
        const distToNext = (nextInMap.distance - myTrain.currentKM).toFixed(1);


        const priorityMap = { "rajdhani": 1, "shatabdi": 1, "duronto": 1, "superfast": 2, "express": 3, "passenger": 4 }
        const myPriority = priorityMap[mySchedule.trainType.toLowerCase()] || 3;


        let finalReason = { code: "ON_TIME", severity: "Normal", uiTheme: "dot-active", message: "Running on Schedule" }

        const lastMsg = myTrain.history[myTrain.history.length - 1]?.message.toLowerCase() || "";
        const isTechnicalArea = lastMsg.includes("no-halt") || lastMsg.includes("technical");

        if (currentIndex === mySchedule.stations.length - 1) {       //finished
            finalReason = { code: "COMPLETED", severity: "Normal", uiTheme: "dot-passed", message: `Journey Finished at ${myTrain.stationName}.` }
        }

        else if (myTrain.currentSpeed === 0 && currentInMap?.isCommercialStop) {        //halt
            finalReason = { code: "HALT", severity: "Normal", uiTheme: "dot-warning", message: `Arrived ${currentInMap.stationName} (Halt: ${currentInMap.haltTime} mins).` }
        }

        else if (myTrain.visibility < 200) {         //fog
            finalReason = { code: "WEATHER_DELAY", severity: "High", uiTheme: "fog-delay", message: `Delayed due to dense fog (Visibility:${myTrain.visibility}m)` }
        }

        else if (distToNext < 5 && nextInMap) {            // station full?
            const now = new Date();
            const fromTime = new Date(now.getTime() - 3600000).toISOString();
            const toTime = new Date(now.getTime() + 7200000).toISOString();

            stationRes = await axios.get(`https://rail-info-api-india1.p.rapidapi.com/v1/stations/${nextInMap.stationCode}/arrivals?from=${encodeURIComponent(fromTime)}&to=${encodeURIComponent(toTime)}&limit=50`, {
                headers: { 'X-RapidAPI-Key': process.env.RAPID_API_KEY, 'X-RapidAPI-Host': 'rail-info-api-india1.p.rapidapi.com' }
            })
            const arrivals = stationRes.data.data || [];
            const busyPlatforms = arrivals.filter(t => t.status === "Arrived").length;
            const platformBlocker = arrivals.find(t => t.station_code === nextInMap.stationCode && t.platform === "1" && t.status === "Arrived")
            finalReason = { code: "STATION_CROWDED", severity: "Medium", uiTheme: "dot-warning", message: platformBlocker ? `Platform ${currentInMap?.platform || '1'} Occupied by ${platformBlocker.train_name}.` : `Station Congestion: ${busyPlatforms} platforms busy at ${nextInMap.stationName}.` }
        }

        else {
            const trafficRes = await axios.get(`https://rail-info-api-india1.p.rapidapi.com/v1/trains/between?offset=0&from=${myTrain.currentStationCode}&to=${nextInMap.stationCode}&limit=50&via=${nextInMap.via || ''}`, {
                headers: { 'X-RapidAPI-Key': process.env.RAPID_API_KEY, 'X-RapidAPI-Host': 'rail-info-api-india1.p.rapidapi.com' }
            })
            const sectionTrains = trafficRes.data.data || [];

            const stalker = sectionTrains.find(t => (priorityMap[t.train_type?.toLowerCase()] || 3) < myPriority)

            const trainAhead = sectionTrains.find(t => t.distance_km > myTrain.currentKM && t.train_no !== trainNumber);

            if (myTrain.currentSpeed === 0 && isTechnicalArea && stalker) {
                const gap = Math.abs(myTrain.currentKM - stalker.distance_km);

                const stalkerSpeed = stalker.speed > 0 ? stalker.speed : 60;
                const estTime = Math.round((gap / stalkerSpeed) * 60) + 7;
                finalReason = { code: "OVERTAKE", severity: "high", uiTheme: "dot-warning", message: `Waiting for ${stalker.train_name} to pass. Estimated time: ${estTime} `, }

            }
            else if (trainAhead && myTrain.currentSpeed < 30) {
                finalReason = { code: "BLOCKED_SECTION", severity: "high", uiTheme: "dot-blocked", message: `Following ${trainAhead.train_name} too closely. Waiting for signal clearance.` };
            }
            else if (myTrain.currentSpeed === 0 && isTechnicalArea) {
                finalReason = { code: "TECHNICAL", severity: "medium", uiTheme: "dot-warning", message: "Technical Stop: Waiting for crossing or track maintenance." };
            }
        }

        if (myTrain.statusReason?.code !== finalReason.code) {
            myTrain.statusReason = finalReason;
            myTrain.history.push({ message: finalReason.message, timestamp: new Date() });
            if (myTrain.history.length > 5) myTrain.history.shift();
            await myTrain.save()
        }
        res.json({ ...myTrain._doc, finalReason, distToNext: parseFloat(distToNext) })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


exports.getAllTrains = async (req, res) => {
    try {
        const allTrains = await Train.find().populate('route nextStation currentStation')
        res.json(allTrains)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.syncWithApi = async (req, res) => {
    try {
        let { trainNumber } = req.params;
        trainNumber = trainNumber.toString().trim();

        const response = await axios.request({
            method: 'GET',
            url: `https://irctc-api2.p.rapidapi.com/liveTrain`,
            params: { trainNumber: trainNumber, startDay: '1' },
            headers: {
                'X-RapidAPI-Key': process.env.RAPID_API_KEY,
                'X-RapidAPI-Host': 'irctc-api2.p.rapidapi.com'
            }
        })
        const apiData = response.data?.data;
        if (!apiData || (!apiData.train_number && !apiData.success)) {
            return res.json({ message: "Sync Idle", note: "No data received from API" });
        }
        
        console.log("DETAILED LOCATION:", JSON.stringify(apiData.current_location_info, null, 2))

        let train = await Train.findOne({ trainNumber });

        if (!train) {
            const schedule = await Schedule.findOne({ trainNumber });

            if (!schedule) {
                return res.status(404).json({ message: "Train number not found in Trains OR Schedules." });
            }

            const priorityMap = { "rajdhani": 1, "shatabdi": 1, "duronto": 1, "superfast": 2, "express": 3, "passenger": 4 };
            const trainPriority = priorityMap[schedule.trainType?.toLowerCase()] || 3;

            train = new Train({
                trainNumber,
                name: apiData.train_name || schedule?.trainName || "Unknown",
                priority: priorityMap[schedule?.trainType?.toLowerCase()] || 3,
                currentStationCode: apiData.current_station_name?.replace(/[~*]/g, '') || "START"
                // route: schedule.stations.map(s => s._id)
            });
            await train.save();
        }

        if (apiData) {
            train.currentStationCode = apiData.next_stoppage_info?.next_stoppage?.replace(/[~*]/g, '') || train.currentStationCode;
            train.currentSpeed = apiData.current_speed || 0;
            train.totalDelay = apiData.delay || 0;
            train.currentKM = apiData.distance_from_source || 0;
            train.lastUpdatedAt = new Date();

            const liveMsg = apiData.current_location_info?.[0]?.readable_message || `Confirmed at ${train.currentStationCode}`;

            train.history.push({
                message: `Live Sync: ${liveMsg} (Speed: ${train.currentSpeed} km/h, Delay: ${train.totalDelay}m)`
            });

            if (train.history.length > 5) train.history.shift();
            await train.save();
            return res.json({
                message: "Sync Successfull",
                location: apiData.current_station_name,
                speed: train.currentSpeed,
                delay: train.totalDelay
            })
        }
        return res.json({
            message: "Sync Idle",
            location: apiData.current_station_name,
            note: "Using last known database position."
        })
    } catch (err) {
        console.error("Sync Error: ", err)
        res.status(500).json({ error: "Failed to connect to Indian Railway Server" })
    }
}
