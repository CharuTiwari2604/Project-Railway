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
    currentKM: {
        type: Number,
        default: 0
    },
    lastUpdated:{
        type: Date,
        default:Date.now
    },
    currentStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    },
    nextStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    },
    route:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    }],
    visibility: {
        type: Number,
        default: 100
    },
    currentStationIndex: {
        type: Number,
        default:0
    },
    eta:{
        type: Number,
        default: 0,
        min: -1
    },
    distanceToNext:{
        type:Number,
        default: 0
    },
    totalDelay:{
        type: Number,
        default: 0
    },
    dwellTime:{
        type: Number,
        default: 0
    },
    statusReason: {
        code: {type: String, default: "INITIAL"},
        severity:{type: String, default: "Normal" },
        uiTheme: {type: String, default: "dot-active"},
        message: {type: String, default: "System Initializing..."}
    },
    history:[{
        message: {type: String},
        timestamp: {type: Date, default: Date.now}
    }]
})

module.exports = mongoose.model('Train', TrainSchema)