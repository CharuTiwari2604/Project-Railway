const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema({
    trainNumber: { type: String, required: true, unique: true },
    trainName: String,
    trainType: String,
    stations: [{
        stationCode: String,
        stationName: String,
        arrivalTime: String,
        departureTime: String,
        distance: Number,
        haltTime: Number,
        dayCount: { type: Number, default: 1 },
        platform: { type: String, default: "1" },
        isCommercialStop: {type: Boolean, default: true}
    }]
})

module.exports = mongoose.model('Schedule', scheduleSchema)