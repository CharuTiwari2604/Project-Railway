const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema({
    trainNumber: String,
    trainName: String,
    trainType: String,
    stations: [{
        stationCode: String,
        stationName: String,
        arrivalTime: String,
        departureTime: String,
        distance: Number,
        haltTime: Number,
        isCommercialStop: {type: Boolean, default: true}
    }]
})

module.exports = mongoose.model('Schedule', scheduleSchema)