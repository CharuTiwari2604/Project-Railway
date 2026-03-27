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
    route:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    }],
    currentKM: {
        type: Number,
        default: 0
    },
    currentStationCode: String,
    lastSyncDelay: {type: Number, default: Date.now()},
    currentSpeed:{
        type: Number,
        default:0
    },
    currentStationIndex: {
        type: Number,
        default:0
    },
    currentStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    },
    nextStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
    },
    totalDelay:{
        type: Number,
        default: 0
    },
    visibility: {
        type: Number,
        default: 100
    },
    lastUpdatedAt:{
        type: Date,
        default:Date.now
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