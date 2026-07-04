import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const GlobalDashboard = () => {
    const [trains, setTrains] = useState([]);
    const [activeAutoPilot, setActivePilot] = useState({})

    const loadFleet = () => {
        fetch("http://localhost:5000/api/all").then(res => res.json())
            .then(data => setTrains(data))
            .catch(err => console.error(err))
    }
    const toggleAutoPilot = (tNum) => {
        setActivePilot(prev => ({
            ...prev,
            [tNum]: !prev[tNum]
        }))
    }

    const handleReset = () => {
        fetch("http://localhost:5000/api/reset").then(res => res.json())
            .then(() => {
                loadFleet();
                alert("System Reset: All trains returned to normal.")
            })
            .catch(err => console.error(err))
    }


    const avgVisibility = trains.length > 0 ? trains.reduce((sum, t) => sum + (t.visibility || 0), 0) / trains.length : 100;
    const isGlobalFoggy = avgVisibility < 60;

    useEffect(() => {
        loadFleet();
        const interval = setInterval(loadFleet, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (trains && trains.length > 0) {
            trains.forEach((t) => {
                if (activeAutoPilot[t.trainNumber] && t.statusReason?.code === "ON_TIME") {
                    const dynamicSpeed=t.currentSpeed>100 ? 3000: 5000;
                    const timer=setTimeout(()=>{
                    fetch(`http://localhost:5000/api/move/${t.trainNumber}`, { method: 'POST' })
                        .catch(err => console.error("Move Error:", err));
                    }, dynamicSpeed)
                    return ()=> clearTimeout(timer);
                }
            });
        }
    }, [trains, activeAutoPilot]);

    return (
        <div className='p-8 bg-slate-900 min-h-screen text-white'>
            <h1 className='text-3xl font-bold mb-6'>Fleet Dispatcher Control</h1>
            {isGlobalFoggy && (
                <div className="bg-yellow-600 text-black p-4 mb-6 rounded-lg font-bold flex items-center shadow-lg animate-pulse">
                    <span className='text-2xl mr-3'>⚠️</span>
                    <div>
                        <h2 className='text-lg'>REGIONAL WEATHER ADVISORY</h2>
                        <p className='text-sm opacity-90'>Average fleet visibility is low ({Math.round(avgVisibility)}%). Expect delays across all route. </p>
                    </div>
                </div>
            )}
            {trains.map(t => {
                const totalDistance = t.route[t.route.length - 1].distanceFromStart || 1;
                const horizontalProgress = (t.currentKM / totalDistance) * 100;
                const isHolding = t.statusReason?.code === "PRIORITY_HOLD";
                return (
                    <div key={t.trainNumber} className={`transition-all duration-700 ease-in-out ${isHolding ? "translate-y-4 opacity-80" : "translate-y-0"}`}>
                        <div className={`p-4 rounded-lg bounded-lg border-2 mb-5 ${t.statusReason?.uiTheme || 'border-slate-700'}`}>

                            <h2 className='text-xl font-bold'>{t.name}
                                <span className={`px-2 py-0.5 ml-3 rounded text-[11px] uppercase font-black ${t.priority === 1 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    P{t.priority}
                                </span>
                            </h2>
                            <div className="h-1 w-full bg-gray-700 relative my-4 rounded">
                                {t.route.map((station, index) => (
                                    <div key={station._id} className="absolute h-3 w-0.5 bg-gray-500 -top-1" style={{ left: `${(station.distanceFromStart / (totalDistance)) * 100}%` }}>
                                        {(index === 0 || index === t.route.length - 1) && (
                                            <span className='absolute top-4 -left-3 text-[8px] opacity-50'>{station.name}</span>
                                        )}
                                    </div>
                                ))}
                                <div className={`h-3 w-3 absolute -top-1 rounded-full transition-all duration-500 shadow-lg 
                                    ${t.priority === 1 ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-400 shadow-blue-400/50'} 
                                    ${isHolding ? 'is-holding scale-75 opacity-50' : 'scale-100'}`} style={{ left: `calc(${horizontalProgress}% - 6px)` }}>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap font-mono text-blue-300">
                                        {Math.round(t.currentKM)} KM
                                    </div>
                                    {t.priority === 1 && !isHolding && (<div className=' absolute inset-0 rounded-full animate-ping bg-red-500 opacity-20'></div>)}
                                </div>
                            </div>
                            <div className='my-2 text-sm opacity-80 pt-2'>
                                <p>Current: {t.currentStation?.name || 'Initializing...'} </p>
                                <p>Weather: {t.visibility}% Visibility </p>
                                <p className='text-[10px] italic text-black '>
                                    Last Activity: {t.history?.length > 0 ? t.history[t.history.length - 1].message : "Standby"}
                                </p>
                            </div>
                            <div className="bg-black bg-opacity-30 p-2 rounded text-xs mb-4 text-white min-h-10">
                                Status: {t.statusReason?.message}
                            </div>
                            <Link to={`/dashboard/${t.trainNumber}`} className='bg-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-500 transition block text-center'>
                                Open Detailed Intel</Link>
                        </div>
                        <button onClick={() => toggleAutoPilot(t.trainNumber)} className={`w-full py-1 mb-2 rounded font-bold text-xs transition-colors ${activeAutoPilot[t.trainNumber] ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {activeAutoPilot[t.trainNumber] ? "AUTO-PILOT: ACTIVE" : "AUTO-PILOT: OFF"}
                        </button>
                    </div>
                )
            })}
            <button className='bg-blue-900 p-2 w-60 ml-17 rounded-xl ' onClick={handleReset}>Emergency System Reset </button>
        </div>
    )
}

export default GlobalDashboard;