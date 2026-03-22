const { syncWithApi } = require('../controller/trainController');
const Train = require('../models/trainmodel')
const railwayServices = require('./railwayServices')

exports.autoSyncAllTrains = async () => {
    try {
        const trains = await Train.find().populate('route')
        for (const train of trains) {
            const apiData = await railwayServices.getLiveStatus(train.trainNumber);
            if (apiData && apiData.success) {
                const realSpeed = apiData.current_speed || 0;
                const liveCode = apiData.current_station_code;
                const matchedStation = train.route.find(s => s.stationCode === liveCode)

                if (matchedStation) {
                    train.currentKM = matchedStation.distanceFromStart;
                    train.currentStationIndex = train.route.indexOf(matchedStation);
                    train.currentStation = matchedStation._id;
                    train.nextStation = train.route[train.currentStationIndex + 1]?._id || null;
                    train.currentSpeed = realSpeed;
                    train.isLiveSpeedActive = true;

                    train.history.push({ message: `Auto-Sync: Verified at ${matchedStation.name}` })
                    if (train.history.length > 5) train.history.shift();
                    await train.save();
                    console.log(`${train.name} synced to ${matchedStation.name}`)
                }
            }
        }
    } catch (err) {
        console.error("Worker Error: ", err.message)
    }
}

