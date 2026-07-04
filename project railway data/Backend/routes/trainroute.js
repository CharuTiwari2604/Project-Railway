const express = require('express');
const { getTrainStatus } = require('../controller/trainController');
const trainRouter = express.Router();

trainRouter.get('/status/:trainNumber', getTrainStatus)

module.exports= trainRouter