const Train = require('../models/trainmodel')

exports.getTrainStatus = async(req, res)=>{
    try{
        const {trainNumber} = req.params;
        const myTrain = await Train.findOne({trainNumber: trainNumber})
         if(!myTrain)
            return res.status(404).json({message: "Train not found in our System"})
        
        let finalReason ="Running on Schedule";

        //logic 1 fog
        if(myTrain.visibility <500){
            finalReason=`Delayed due to dense fog(Visibility:${myTrain.visibility})`
        }
        //logic 2 priority
        else{
            const priorityTrain = await Train.findOne({priority:1})
            if(myTrain.currentSpeed===0 && priorityTrain && priorityTrain.priority < myTrain.priority){
            finalReason= `Stopped for Priority Overtake by ${priorityTrain.name}`;
        }
        //logic 3 station occupied
        else{
            const obstacle =await Train.findOne({
                currentStation: myTrain.nextStation,
                trainNumber:{$ne: myTrain.trainNumber} //$ne not count my train on station
            })
            if(obstacle && myTrain.currentSpeed < 10){
                finalReason= `Waiting for Plateform Clearence at ${myTrain.nextStation} (Occupied by ${obstacle.name})`
            }
             //logic 4 outer signal
        else if(myTrain.currentSpeed < 5 && myTrain.distanceToNextStation < 1.5){
            finalReason = "Stopped at Outer Signal"
        }
        }
        }

        res.json({
            name:myTrain.name,
            currentSpeed: myTrain.currentSpeed,
            statusReason: finalReason,
            lastStation:myTrain.currentStation
        })
    }catch(err){
        res.status(500).json({error: error.message})
    }
}