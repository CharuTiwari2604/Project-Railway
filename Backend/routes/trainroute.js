const express = require('express');
const { getTrainStatus, getAllTrains, moveTrain, triggerObstacle, resetFleet, restartJourney, syncLiveLocation, syncWithApi } = require('../controller/trainController');
const trainRouter = express.Router();

trainRouter.get('/all', getAllTrains)
trainRouter.get('/status/:trainNumber', getTrainStatus)
trainRouter.post('/move/:trainNumber', moveTrain)
trainRouter.get('/chaos/:trainNumber', triggerObstacle)
trainRouter.get('/reset', resetFleet)
trainRouter.post('/restart/:trainNumber', restartJourney)
trainRouter.post('/sync/:trainNumber', syncLiveLocation)
trainRouter.post('/update-from-api/:trainNumber', syncWithApi)

trainRouter.post('/weather', async(req, res)=>{
    const {condition, visibility} = req.body;

    let maxSpeed = 110;
    if(condition === "FOG") maxSpeed=30;
    if(condition === "STORM") maxSpeed=15;

    await Train.updateMany(
        {status: "Running"},
        {
            $set: {
                "constraints.maxAllowedSpeed" : maxSpeed,
                "currentWeather": condition
            },
            push: {
                history: {message: `Weather Alert: ${condition}. Speed capped at ${maxSpeed}km/h.`}
            }
        }
    )
    res.json({message: `Global weather set to ${condition}` })
})



module.exports= trainRouter