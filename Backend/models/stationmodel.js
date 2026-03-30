const mongoose = require('mongoose')

const StationSchema = new mongoose.Schema({
    stationCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    totalPlatforms: { type: Number, default: 2 },
    currentlyOccupied: { type: Number, default: 0 },
    distanceFromStart: { type: Number, default: 0 },
    activeTrains: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Train'
    }]
})

module.exports = mongoose.model('Station', StationSchema)