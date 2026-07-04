const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema({
    trainNumber: { type: String, required: true, unique: true },
    trainName: String,
    trainType: String,
    stations: [{
        stationCode: String,
        stationName: String,
        distance: Number,
        platform: { type: String, default: "1" },
    }]
})

module.exports = mongoose.model('Schedule', scheduleSchema)