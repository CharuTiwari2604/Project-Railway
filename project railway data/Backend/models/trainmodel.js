const mongoose = require('mongoose')

const TrainSchema = new mongoose.Schema({
    trainNumber: {
        type: String,
        required: true,
        unique: true
    },
    name:{
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: true
    },
    currentSpeed:{
        type: Number,
        default:0
    },
    distanceToNextStation:{
        type: Number,
        default:0
    },
    lastUpdated:{
        type: Date,
        default:Date.now
    },
    currentStation: {
        type: String,
    },
    nextStation: {
        type: String,
    },
    visibility: {
        type: Number,
        default: 1000
    }
})

module.exports = mongoose.model('Train', TrainSchema)