require('dotenv').config();
const express = require("express");
const cors= require('cors');
const { default: mongoose } = require('mongoose');
const trainRouter = require('./routes/trainroute');
const trainmodel = require('./models/trainmodel');
const app= express();
const PORT= process.env.PORT || 5000;

 app.use(cors());
 app.use(express.json());


 app.get('/', (req, res)=>{
    res.send("Backend System Running.")
 })

app.use('/api', trainRouter)

const createTestTrain = async()=>{
    try{

   
    await trainmodel.deleteMany({})
    await trainmodel.create([

    { 
                trainNumber: "12301", 
                name: "Howrah Rajdhani", 
                priority: 1, 
                currentSpeed: 80, 
                distanceToNextStation: 10,
                currentStation: "Dhanbad",
                nextStation: "Gaya",
                visibility: 1000
            },
            { 
                trainNumber: "12810", 
                name: "Howrah Mail", 
                priority: 5, 
                currentSpeed: 0, 
                distanceToNextStation: 1.2,
                currentStation: "Asansol",
                nextStation: "Dhanbad",
                visibility: 300
            }
        ])
} catch(err){
    console.log("Error seeding data:", err )
}
 }

 mongoose.connect(process.env.MONGO_URI).then((conn)=>{
    console.log("Connected to Database")
createTestTrain();
 }).catch((err)=>{
    console.log("Error connecting database", err)
 })

 app.listen(PORT, ()=>{
    console.log(`Server running on PORT ${PORT}`)
 })
 
