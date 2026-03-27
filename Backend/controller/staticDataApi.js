const axios = require('axios');
const Schedule = require('../models/schedulemodel');

exports.importTrainSchedule = async (trainNumber) => {
    try {
        const OfficialStations = {
            method: 'GET',
            url: `https://rail-info-api-india1.p.rapidapi.com/v1/trains/${trainNumber}/stops`,
            headers: {
                'X-RapidAPI-Key': process.env.RAPID_API_KEY,
                'X-RapidAPI-Host': 'rail-info-api-india1.p.rapidapi.com'
            }
        }

        const stopResponse = await axios.request(OfficialStations);
        const mainData = stopResponse.data.data || stopResponse.data.route || stopResponse.data;
        let finalArray = Array.isArray(mainData) ? mainData : (mainData.route || mainData.stations);
        if (!finalArray) throw new Error("No data found for this train.")


        const cleanedStations = finalArray.map((item) => ({
            stationCode: item.station_code,
            stationName: item.station_code,
            arrivalTime: item.arrival_time,
            departureTime: item.departure_time,
            distance: item.distance_km,
            haltTime: item.dwell_time_minutes,
            isCommercialStop: (item.dwell_time_minutes > 0 || item.stop === true)
        }))

        const trainType = {
            method: 'GET',
            url: `https://rail-info-api-india1.p.rapidapi.com/v1/trains/${trainNumber}`,
            headers: {
                'X-RapidAPI-Key': process.env.RAPID_API_KEY,
                'X-RapidAPI-Host': 'rail-info-api-india1.p.rapidapi.com'
            }
        }

        const typeResponse = await axios.request(trainType);
        const trainData = typeResponse.data.data || typeResponse.data.data;

        const newSchedule = {
            trainNumber: trainNumber,
            trainName: trainData.train_name || mainData.train_name || "Unknown Train",
            trainType: trainData.train_type || "express",
            stations: cleanedStations
        }

        await Schedule.findOneAndUpdate(
            { trainNumber: trainNumber },
            { $set: newSchedule },
            { upsert: true, new: true }
        )
        console.log("Schedule Saved Successfully")
    } catch (err) {
        console.error("Error importing data: ", err)
    }
}