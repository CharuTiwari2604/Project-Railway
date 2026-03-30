require('dotenv').config();
const express = require("express");
const cors= require('cors');
const { default: mongoose } = require('mongoose');
const trainRouter = require('./routes/trainroute');
const app= express();
const PORT= process.env.PORT || 5000;

 app.use(cors());
 app.use(express.json());

 setInterval(()=>{
   // autoSyncAllTrains()
 }, 1200000)

 app.get('/', (req, res)=>{
    res.send("Backend System Running.")
 })

app.use('/api', trainRouter)

 mongoose.connect(process.env.MONGO_URI).then((conn)=>{
    console.log("Connected to Database")
 }).catch((err)=>{
    console.log("Error connecting database", err)
 })

 app.listen(PORT, ()=>{
    console.log(`Server running on PORT ${PORT}`)
 })
