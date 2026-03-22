const axios = require('axios');
require('dotenv').config();

let lastFetchTime= null;
let cachedData={};

exports.getLiveStatus = async(trainNumber)=>{
    const now= Date.now()

    if(lastFetchTime && (now-lastFetchTime < 3600000) && cachedData[trainNumber]){
        console.log("Using cached data...")
        return cachedData[trainNumber]
    }

   const options={ method: 'GET',
    url: 'https://train-running-api.p.rapidapi.com/api/LiveTrainApi/',
    params: {
        trainNumber: trainNumber,
        start_day: '0'
    },
    headers: {
        'x-rapidapi-host': 'train-running-api.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPID_API_KEY
    }
}
try{
    console.log(`Calling Real API: ${trainNumber}...`)
    const response = await axios.request(options)
    lastFetchTime = now;
    cachedData[trainNumber] = response.data;
    
    console.log("Raw API Response: ", response.data)
    return response.data;
    }catch(err){
        console.error("API Fetch Error: ", err.message)
        return null;
    }
}