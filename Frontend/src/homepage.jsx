import React, { useState } from "react";
import axios from 'axios';
import {  Train, Calendar } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {

  const [trainNumber, setTrainNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('0');

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trainNumber || !date ) {
      alert("Please Select both Train Number and Day!")
      return;
    }
    setLoading(true);
    const d = new Date();
    d.setDate(d.getDate() - parseInt(date)); 
    const apiDate = d.toISOString().split('T')[0].replace(/-/g, '');
    try {
      const syncRes = await axios.get(`${API_BASE}/api/live/${trainNumber}?departure_date=${apiDate}`);
      if (syncRes.data) {
            const res = await axios.get(`${API_BASE}/api/status/${trainNumber}`);
            console.log("Final Status for Dashboard:", res.data.mergedStatus);
            navigate('/mapview', { state: { trainInfo: res.data } });
        }
    } catch (err) {
      alert("Train not found or Sync failed.")
    }finally {
        setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans p-6 pb-24">
      <form onSubmit={handleSearch}>
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <p className="text-gray-400 text-lg mt-4 mb-2">Let's find out</p>
            <h1 className="text-3xl font-bold">RukiKyun? Express</h1>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-1 rounded-2xl mt-12 flex mb-8">
          <button className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-bold text-m">Live Status</button>
          <button className="flex-1 py-3 text-gray-500 font-bold text-m" onClick={() => navigate('/mapview')}>Map View</button>
          <button className="flex-1 py-3 text-gray-400 font-bold text-m" onClick={() => navigate('/history')}>History</button>
        </div>

        <div className="bg-[#141414] border border-white/5 p-6 rounded-4xl mt-16 mb-8 shadow-2xl">
          <div className="space-y-7 relative">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/10 p-3 rounded-xl">
                <Train className="text-yellow-400" size={24} />
              </div>
              <div className="flex-1">
                <label className="text-[13px] text-gray-500 tracking-widest font-bold">TRAIN NUMBER</label>
                <input type="text" placeholder="e.g. 22356" value={trainNumber} onChange={(e) => setTrainNumber(e.target.value)} required className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-gray-700" />
              </div>
            </div>

            <div className="h-0.5 bg-white/5 ml-14"></div>

            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/10 p-3 rounded-xl">
                <Calendar className="text-yellow-400" size={24} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 tracking-widest font-bold block mb-1">
                  START DAY
                </label>
                <select className="w-full text-lg font-bold text-white focus:outline-none cursor-pointer appearance-none pl-4 -ml-4" id="date" value={date} onChange={(e) => setDate(e.target.value)} required >
                  <option value="" disabled className="bg-[#141414]">Select Starting Day</option>
                  <option value="0" className="bg-[#141414]">Day 0 (Started Today)</option>
                  <option value="1" className="bg-[#141414]">Day 1 (Started Yesterday)</option>
                  <option value="2" className="bg-[#141414]">Day 2 (2 Days Ago)</option>
                  <option value="3" className="bg-[#141414]">Day 3 (3 Days Ago)</option>
                  <option value="4" className="bg-[#141414]">Day 4 (4 Days Ago)</option>
                  <option value="5" className="bg-[#141414]">Day 5 (5 Days Ago)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-yellow-400 text-black py-5 mt-6 rounded-2xl font-black text-xl">
          {loading ? 'Searching...' : 'Track Khabri'}
        </button>
      </form>
    </div >
  )
}

export default Home;