const mongoose = require('mongoose')

const TrainSchema = new mongoose.Schema({
    trainNumber: { type: String, required: true, unique: true },
    name: String,
    priority: { type: Number, default: 3 }, 
    currentKM: { type: Number, default: 0 },
    currentSpeed: { type: Number, default: 0 },
    totalDelay: { type: Number, default: 0 }, 
    currentStationCode: String,
    currentStationName: String,
    liveStatusMessage: String,
    nextStationDistance: { type: Number, default: 0 },
    nextStationName: { type: String },
    expectedPlatform: { type: String, default: "N/A" },
    visibility: { type: Number, default: 100 },
    statusReason: {
        code: { type: String, default: "ON_TIME" },
        message: { type: String, default: "Running on Schedule" },
        severity: { type: String, default: "Normal" }
    },
    lastUpdatedAt: { type: Date, default: Date.now },
    history: [{
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    route: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }]
});


module.exports = mongoose.model('Train', TrainSchema)