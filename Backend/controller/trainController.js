const Train = require('../models/trainmodel')
const Station = require('../models/stationmodel');

exports.getTrainStatus = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const myTrain = await Train.findOne({ trainNumber: trainNumber }).populate('route nextStation currentStation');
        if (!myTrain) return res.status(404).json({ message: "Train not found in our System" })

        const currentIndex = myTrain.currentStationIndex;
        const nextStation = myTrain.route[myTrain.currentStationIndex + 1] || null;

        const currentStationData = myTrain.route[currentIndex];
        const priorityTrain = await Train.findOne({ priority: 1 })

        let dist = 0;
        if (nextStation) {
            dist = nextStation.distanceFromStart - myTrain.currentKM;
        }

        const obstacle = await Train.findOne({
            currentStation: myTrain.nextStation,
            trainNumber: { $ne: myTrain.trainNumber } //$ne not count my train on station
        })

        //eta calculation
        let currentEta = -1;
        if (myTrain.currentSpeed > 0) {
            currentEta = Math.round((dist / myTrain.currentSpeed) * 60)
        }


        //priority logic
        const behindTrain = await Train.findOne({
            nextStation: myTrain.currentStation,
            priority: { $lt: myTrain.priority },       //gt = greater than
            trainNumber: { $ne: myTrain.trainNumber }
        });
        let finalReason = "Running on Schedule";



        // finish
        if (myTrain.currentStationIndex === myTrain.route.length - 1) {
            finalReason = {
                code: "COMPLETED",
                severity: "Normal",
                uiTheme: "dot-passed",
                message: `Journey Finished at ${currentStationData.name}.`
            }
        }


        else if (behindTrain) {
            finalReason = {
                code: "PRIORITY_HOLD",
                severity: "High",
                uiTheme: "dot-warning",
                message: `Holding at ${myTrain.currentStation?.name} to allow ${behindTrain?.name} to overtake.`
            }
        }

        // obstacle train in path
        else if (obstacle && myTrain.currentSpeed < 10) {
            finalReason = {
                code: "STATION_OCCUPIED",
                severity: "Critical",
                uiTheme: "dot-blocked",
                message: `Waiting for Plateform Clearence at ${myTrain.nextStation?.name} (Occupied by ${obstacle.name}).`
            }
        }

        // fog
        else if (myTrain.visibility < 50) {
            finalReason = {
                code: "WEATHER_DELAY",
                severity: "High",
                uiTheme: "fog-delay",
                message: `Delayed due to dense fog(Visibility:${myTrain.visibility})`
            }
        }


        // priority
        else if (myTrain.currentSpeed === 0 && priorityTrain && priorityTrain.priority < myTrain.priority) {
            finalReason = {
                code: "PRIORITY_PASS",
                severity: "High",
                uiTheme: "priority",
                message: `Stopped for Priority Overtake by ${priorityTrain.name}.`
            }
        }

        // station full?
        else if (currentStationData.currentlyOccupied > 85) {
            finalReason = {
                code: "STATION_CROWDED",
                severity: "Medium",
                uiTheme: "dot-warning",
                message: `High Crowd at ${currentStationData.name}. Expect Delays.`
            }
        }

        //outer signal
        else if (myTrain.currentSpeed < 5 && dist < 1.5) {
            finalReason = {
                code: "SIGNAL_STOP",
                severity: "High",
                uiTheme: "dot-blocked",
                message: "Stopped at Outer Signal (Waiting for Permission)."
            }
        }


        else {
            finalReason = {
                code: "ON_TIME",
                severity: "Normal",
                uiTheme: "dot-active",
                message: "Running on Schedule."
            }
        }

        const reasonChanged = JSON.stringify(myTrain.statusReason) !== JSON.stringify(finalReason);
        if (reasonChanged) {
            myTrain.statusReason = finalReason;
            myTrain.history.push({
                message: `System Alert: ${finalReason.message}`
            })
            if (myTrain.history.length > 5) {
                myTrain.history.shift();
            }
            await myTrain.save();
            console.log(`Status updated for Train ${trainNumber}`)
        }

        res.json({
            trainNumber: myTrain.trainNumber,
            name: myTrain.name,
            currentSpeed: myTrain.currentSpeed,
            statusReason: finalReason,
            lastStation: myTrain.currentStation,
            route: myTrain.route,
            eta: currentEta,
            distanceToNext: dist.toFixed(2),
            currentStationIndex: myTrain.currentStationIndex,
            history: myTrain.history
        })
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



exports.moveTrain = async (req, res) => {

    try {
        const { trainNumber } = req.params;
        const train = await Train.findOne({ trainNumber }).populate('route nextStation currentStation')
        if (!train) return res.status(404).json({ message: "Train not found" });

        const nextStation = train.route[train.currentStationIndex + 1] || null;
        const distanceToNext = nextStation ? (nextStation.distanceFromStart - train.currentKM) : 0;
        const finalStation = train.route[train.route.length - 1];
        const currentStationData = train.route[train.currentStationIndex];


        if (nextStation && train.currentKM >= nextStation.distanceFromStart) {
            train.currentKM = nextStation.distanceFromStart;
            train.currentStationIndex += 1;
            train.currentStation = nextStation._id;
            train.nextStation = train.route[train.currentStationIndex + 1]?._id || null;
            train.history.push({ message: `Arrived at ${nextStation.name}` })
        }

        const stalker = await Train.findOne({
            priority: { $lt: train.priority },
            currentKM: { $lt: train.currentKM + 1.0, $gte: train.currentKM - 10 },
            trainNumber: { $ne: train.trainNumber },
            currentSpeed: { $gt: 20 }
        })

        const obstacle = await Train.findOne({
            nextStation: train.currentStation,
            priority: { $gt: train.priority },
            currentStation: train.nextStation ? train.nextStation._id : null,
            trainNumber: { $ne: train.trainNumber },
        });

        // weather randomizer
        const chaosFactor = Math.random();
        if (chaosFactor < 0.10) {
            const change = Math.floor(Math.random() * 20 - 10);     //math.floor decimal(5.2) values ko normal(5) mein convert krta h
            train.visibility = Math.max(0, Math.min(100, (train.visibility || 100) + change))
        }

        let finalSpeed = 100;
        let finalStatus = {
            code: "ON_TIME",
            severity: "Normal",
            uiTheme: "dot-active",
            message: "Running on Schedule."
        }

        if (train.currentKM >= finalStation.distanceFromStart) {       //finished
            finalSpeed = 0;
            finalStatus = { code: "COMPLETED", severity: "Normal", uiTheme: "dot-passed", message: `Journey Finished at ${finalStation.name}.` }
        }

        else if (distanceToNext < 0.5) {            //reached station
            if (train.dwellTime === 0 && train.statusReason?.code !== "STATION_DWELL") {
                train.dwellTime = 20;
                finalSpeed = 0;
                finalStatus = { code: "STATION_DWELL", severity: "Info", uiTheme: "dot-active", message: `Halt at ${nextStation.name} for 20sec.` }
            }
        }

        else if (train.dwellTime > 0) {
            finalSpeed = 0;
            train.dwellTime -=1;
            finalStatus = {code: "STATION_DWELL", severity: "Info", uiTheme: "dot-active", message:`Halt at ${nextStation.name} (${train.dwellTime}sec Remaining).`}

            if (train.dwellTime === 0) {
                train.currentStationIndex += 1;
                finalSpeed=100;
                finalStatus = {code:"ON_TIME", severity: "Normal", uiTheme: "dot-active", message: `Departing from ${nextStation.name}.`};
            }
        }

        else if (stalker) {      //overtake
            finalSpeed = 0;
            finalStatus = { code: "PRIORITY_OVERTAKE", severity: "Warning", uiTheme: "dot-paused", message: `Pulling over for Priority Overtake by ${stalker.name}.` }
        }

        else if (obstacle && distanceToNext < 2.0) {            //blocked station(avoid collision)
            finalSpeed = 0;
            finalStatus = { code: "STATION_OCCUPIED", severity: "Critical", uiTheme: "dot-blocked", message: `Waiting for Plateform Clearence at ${train.nextStation?.name} (Occupied by ${obstacle.name}).` }
        }

        else if (train.currentKM <= 2.5 && train.currentSpeed === 0) {      //kickstart
            console.log("Force train to move: ", train.name)
            finalSpeed = 100;
            finalStatus = { code: "ON_TIME", severity: "Normal", uiTheme: "dot-active", message: "Initial Departure..." };
        }

        else if (train.currentSpeed < 5 && distanceToNext < 1.5) {      //outer signal stop
            finalSpeed = 0;
            finalStatus = { code: "SIGNAL_STOP", severity: "High", uiTheme: "dot-blocked", message: "Stopped at Outer Signal (Waiting for Permission)." }
        }

        else if (train.visibility < 50) {        //visibility
            finalSpeed = 40;
            finalStatus = { code: "WEATHER_DELAY", severity: "High", uiTheme: "fog-delay", message: `Delayed due to dense fog(Visibility:${train.visibility})` }
        }

        else if (currentStationData.currentlyOccupied > 85) {     //crowd (slow down)
            finalSpeed = 80;
            finalStatus = { code: "STATION_CROWDED", severity: "Medium", uiTheme: "dot-warning", message: `High Crowd at ${currentStationData.name}. Expect Delays.` }
        }

        else if (nextStation && distanceToNext < 2.0) {    //normal station break
            finalSpeed = Math.max(10, distanceToNext * 50);
            finalStatus = { code: "ON_TIME", severity: "Normal", uiTheme: "dot-active", message: `Approaching ${nextStation.name}.` }
        }

        else {
            finalSpeed = 100;
            finalStatus = { code: "ON_TIME", severity: "Normal", uiTheme: "dot-active", message: "Runningon Schedule." }
        }

        train.currentSpeed = finalSpeed;
        train.statusReason = finalStatus;

        let etaMinutes = train.currentSpeed > 0 ? Math.round((distanceToNext / train.currentSpeed) * 60) : -1;
        train.history.push({ message: `Movement Update: ${train.statusReason.message}` })
        if (train.history.length > 5) train.history.shift();

        const simulationspeed = 500
        const timeElapsedHours = (300 * simulationspeed) / 3600000;
        const distanceTravelled = finalSpeed * timeElapsedHours;
        train.currentKM += distanceTravelled;
        train.currentSpeed = finalSpeed;

        const isDelayed = (finalSpeed === 0 && train.currentKM < finalStation.distanceFromStart && finalStatus.code !=="STATION_DWELL")

        const updatedTrain = await Train.findOneAndUpdate(                      //train.save()
            { _id: train._id },
            {
                $set: {
                    currentKM: train.currentKM,
                    currentSpeed: train.currentSpeed,
                    currentStationIndex: train.currentStationIndex,
                    currentStation: train.currentStation,
                    nextStation: train.nextStation,
                    eta: etaMinutes,
                    distanceToNext: distanceToNext.toFixed(2),
                    dwellTime: train.dwellTime,
                    statusReason: train.statusReason,
                    history: train.history.slice(-5)
                },
                $inc: { totalDelay: isDelayed ? 1 : 0 }
            },
            { new: true }
        ).populate('route nextStation currentStation')

        console.log(`Train: ${train.trainNumber} Speed: ${train.currentSpeed} Status: ${train.statusReason.code} Delay: ${train.totalDelay}`)
        return res.json(updatedTrain);
    } catch (err) {
        console.error("Error in move: ", err)
        return res.status(500).json({ error: err.message })
    }
};


exports.triggerObstacle = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const targetTrain = await Train.findOne({ trainNumber });
        const obstacleTrain = await Train.findOne({ trainNumber: { $ne: trainNumber } });
        if (!obstacleTrain) return res.status(404).json({ message: "No other Train Found." })
        obstacleTrain.currentStation = targetTrain.nextStation;
        obstacleTrain.currentSpeed = 0;
        targetTrain.history.push({
            message: `ALERT: Chaos Initiated! ${obstacleTrain.name} is bloacking the path.`
        })
        if (targetTrain.history.length > 5) targetTrain.history.shift();
        await targetTrain.save();
        await obstacleTrain.save();
        res.json({ message: `CHAOS INITIATED: ${obstacleTrain.name} is now blocking ${targetTrain.nextStation}` })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.resetFleet = async (req, res) => {
    try {
        const trains = await Train.find().populate('route')
        for (let train of trains) {
            train.currentKM = 0;
            train.currentStationIndex = 0;
            train.currentStation = train.route[0]?._id || train.route[0]
            train.nextStation = train.route[1]?._id || null;
            train.visibility = 100;
            train.currentSpeed = 0;
            train.totalDelay = 0;

            train.statusReason = {
                code: "ON_TIME",
                severity: "Normal",
                uiTheme: "dot-active",
                message: "System Reset: All tracks cleared."
            }
            train.history = [{ message: "Global System Reset: Ready to Departure" }]
            await train.save()
        }
        res.json({ message: "Track cleared. All trains moved to origin." })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


exports.restartJourney = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const train = await Train.findOne({ trainNumber });

        if (!train) return res.status(404).json({ message: "Train not found." });

        train.currentStationIndex = 0;
        train.currentStation = train.route[0]._id;
        train.nextStation = train.route[1];

        train.statusReason = {
            code: "READY",
            severity: "Normal",
            uiTheme: "dot-active",
            message: "Journey Reset. Ready to Departure."
        }
        await train.save();
        res.json({ message: "Journey restarted from origin." })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}



exports.syncLiveLocation = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { stationCode } = req.query;

        const train = await Train.findOne({ trainNumber }).populate('route')
        if (!train) {
            return res.status(404).json({ message: "Train not found." });
        }
        const matchedStation = train.route.find(s => s.stationCode === stationCode);
        if (matchedStation) {
            train.currentKM = matchedStation.distanceFromStart;
            train.currentStationIndex = train.route.indexOf(matchedStation);
            train.currentStation = matchedStation._id;
            train.nextStation = train.route[train.currentStationIndex + 1]?._id || null;
            train.history.push({
                message: `Live Sync: Confirmed at ${matchedStation.name}`
            })
            await train.save()
            return res.json({ message: "Sync Successful", at: matchedStation.name, km: train.currentKM })
        }
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.syncWithApi = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const apiResponse = { current_station_code: "CNB", success: true }
        if (!apiResponse || !apiResponse.success) {
            return res.status(500).json({ message: "Could not reach Indian Railway" })
        }
        const liveStationCode = apiResponse.current_station_code;
        const train = await Train.findOne({ trainNumber }).populate('route')
        if (!train) return res.status(404).json({ message: "Train not in DB" })
        const matchedStation = train.route.find(s => s.stationCode === liveStationCode)
        if (matchedStation) {
            train.currentKM = matchedStation.distanceFromStart;
            train.currentStationIndex = train.route.indexOf(matchedStation);
            train.currentStation = matchedStation._id;

            train.history.push({ message: `Global Sync at ${matchedStation.name}` })
            await train.save()
            return res.json({ message: "Sync Success", at: matchedStation.name })
        }
        res.status(404).json({ message: "Live Station not found in route plan" })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.setWeather = async (req, res) => {
    const { condition } = req.body;
    const maxSpeed = condition === "FOGGY" ? 30 : 110;

    await Train.updateMany(
        { status: "Running" },
        { $set: { "constraints.maxAllowedSpeed": maxSpeed, weather: condition } }
    )
    res.json({ message: `Weather set to ${condition}. Speed capped at ${maxSpeed}` })
}