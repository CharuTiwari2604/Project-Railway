require('dotenv').config();
const mongoose = require('mongoose')
const Train = require('./models/trainmodel')
const Station = require('./models/stationmodel')

const seedDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.log("Not reached .env")
        }
        await mongoose.connect(uri)
        console.log("Connected to Seeder")
        // Clean up
        const dltTrain = await Train.deleteMany({})
        const dltStation = await Station.deleteMany({})

        // station list
        const stationData = [
            { name: "New Delhi", currentlyOccupied: 40, platformCount: 16, stationCode: "NDLS", distanceFromStart: 0 },
            { name: "Aligarh Jn", currentlyOccupied: 10, platformCount: 7, stationCode: "ALI", distanceFromStart: 131 },
            { name: "Kanpur Central", currentlyOccupied: 60, platformCount: 10, stationCode: "CNB", distanceFromStart: 440 },
            { name: "Prayagraj Jn", currentlyOccupied: 30, platformCount: 12, stationCode: "PYJ", distanceFromStart: 635 },
            { name: "Varanasi Jn", currentlyOccupied: 20, platformCount: 9, stationCode: "BSB", distanceFromStart: 755 }
        ];

        const createdStations = await Station.insertMany(stationData);

        // map station IDs to route
        const routeIDs = createdStations.map(s => s._id)
        const trainData = {
            trainNumber: "22436",
            name: "Vande Bharat Express",
            route: routeIDs,
            currentStationIndex: 0,
            currentStation: routeIDs[0],
            nextStation: routeIDs[1],
            visibility: 100,
            currentSpeed: 130,
            priority: 1,
            statusReason: {
                code: "ON_TIME",
                severity: "Normal",
                uiTheme: "dot-active",
                message: "Departing NDLS"

            }
        }
        const secondTrain = {
            trainNumber: "12428",
            name: "Rewa Express",
            priority: 3,
            route: routeIDs,
            currentStationIndex: 1, 
            currentStation: routeIDs[1],
            nextStation: routeIDs[2],
            visibility: 100,
            currentSpeed: 80,
            statusReason: {
                code: "ON_TIME",
                severity: "Normal",
                uiTheme: "dot-active",
                message: "Standing at Aligarh"

            }
        }

        await Train.create(trainData);
        await Train.create(secondTrain)
        console.log("Train seeded with Routes")

        await mongoose.connection.close();


    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedDatabase()