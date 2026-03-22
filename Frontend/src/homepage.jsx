import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Home=()=>{

  const [trainNumber, setTrainNumber]= useState('')
  const [data, setData]= useState(null)
  const [loading, setLoading] = useState(false)
  const navigate=useNavigate();

  const handleSearch = async()=>{
    setLoading(true);
    try{
      const response = await axios.get(`http://localhost:5000/api/status/${trainNumber}`)
      setData(response.data)
    }catch(err){
      alert("Train not found or Server Down")
    }
    setLoading(false)
  }

  const handleClick =()=>{
    navigate(`/global-dashboard`)
}

    return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8 shadow-neon">
      Train Intelligence System
      </h1>
      <div className="flex gap-4 mb-10">
        <input 
          type="text" 
          placeholder="Enter Train Number (e.g., 12810)"
          className="bg-gray-900 border border-cyan-500 p-3 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value)}
        />
        <button 
          onClick={handleSearch}
          className="bg-cyan-600 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-lg transition-all"
        >
          {loading ? "Analyzing..." : "Trace Train"}
        </button>
      </div>
      {/* The Result Card */}
      {data && (
        <div className="border-l-4 border-cyan-500 bg-gray-900 p-6 rounded-r-xl animate-pulse">
          <h2 className="text-2xl text-cyan-300 mb-2">{data.name}</h2>
          <p className="text-gray-400 mb-4">Current Speed: {data.currentSpeed} km/h</p>
          <div className="bg-black p-4 rounded-lg border border-gray-700">
            <span className="text-yellow-400 font-bold uppercase tracking-widest text-sm">Reasoning:</span>
            <p className="text-xl mt-2">{data.statusReason.message}</p>
          </div>
          <button className="text-white bg-blue-900 rounded-sm mt-5 p-2" onClick={handleClick}>Enter Command Center</button>
       </div>
      )}
       
</div>
)
}

export default Home;