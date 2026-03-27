const express = require('express');
const Train = require('../models/trainmodel')
const { getTrainStatus, getAllTrains, syncWithApi } = require('../controller/trainController');
// const { getTrainStatus, getAllTrains, moveTrain, triggerObstacle, resetFleet, restartJourney, syncLiveLocation, syncWithApi } = require('../controller/trainController');
const { importTrainSchedule } = require('../controller/staticDataApi');
// const { getLiveUpdate } = require('../controller/liveStatus');
const trainRouter = express.Router();

trainRouter.get('/all', getAllTrains)
trainRouter.get('/status/:trainNumber', getTrainStatus)
trainRouter.get('/live/:trainNumber', syncWithApi)


trainRouter.post('/weather', async(req, res)=>{
    const {condition} = req.body;

    let maxSpeed = 110;
    if(condition === "FOG") maxSpeed=30;
    if(condition === "STORM") maxSpeed=15;

    await Train.updateMany(
        {status: "Running"},
        {
            $set: {
                maxAllowedSpeed : maxSpeed,
                currentWeather: condition
            },
            $push: {
                history: {message: `Weather Alert: ${condition}. Speed capped at ${maxSpeed}km/h.`},
                timestamp: newDate()
            }
        }
    )
    res.json({message: `Global weather set to ${condition}` })
})

trainRouter.get('/import/:trainNumber', async(req, res)=>{
    const {trainNumber} = req.params;
    try{
        await importTrainSchedule(trainNumber);
        res.status(200).json({message: `Train ${trainNumber} imported Successfully`})
    }catch(error){
        res.status(500).json({error: error.message})
    }
})


module.exports= trainRouter;