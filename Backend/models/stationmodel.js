const mongoose = require('mongoose')

const StationSchema = new mongoose.Schema({
    stationCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    totalPlatforms: { type: Number, default: 2 },
})

module.exports = mongoose.model('Station', StationSchema)