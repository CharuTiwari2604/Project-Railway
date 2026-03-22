import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

const GlobalDashboard = () => {
    const [trains, setTrains] = useState([]);
    const [activeAutoPilot, setActivePilot] = useState({})
    const [syncTargets, setSyncTargets] = useState({});
    const [globalAutoPilot, setGlobalAutoPilot] = useState(false);


    const handleSync = (trainNumber) => {
        const selectedCode = syncTargets[trainNumber];
        if (!selectedCode) return alert("Please select a station first!")
        fetch(`http://localhost:5000/api/sync/${trainNumber}?stationCode=${selectedCode}`, { method: 'POST' }).then(res => res.json())
            .then(data => {
                console.log("Sync Response: ", data)
                loadFleet();
                alert(`Train ${trainNumber} is now at ${data.at}`)
            })
            .catch(err => console.error("Sync Error: ", err))
    }


    const loadFleet = () => {
        fetch("http://localhost:5000/api/all").then(res => res.json())
            .then(data => setTrains(data))
            .catch(err => console.error(err))
    }

    const toggleAllAutoPilot = () => {
        const newState = !globalAutoPilot;
        setGlobalAutoPilot(newState)
        const newIndividualStates = {}
        trains.forEach(t => {
            newIndividualStates[t.trainNumber] = newState
        })
        setActivePilot(newIndividualStates)
    }

     const formatDelay = (seconds)=>{
        if(!seconds || isNaN(seconds)) return "0s";
        const mins = Math.floor(seconds/60)
        const secs= seconds%60
        return mins > 0 ? `${mins}m  ${secs}s`  : `${secs}s`
    }


    const handleReset = () => {
        fetch("http://localhost:5000/api/reset").then(res => res.json())
            .then(() => {
                setSyncTargets({});
                loadFleet();
                alert("System Reset: All trains returned to normal.")
            })
            .catch(err => console.error(err))
    }

    const setWeather = async (type) => {
        const response = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condition: type })
        })
        const data = await response.json()
        loadFleet()
    }


    const avgVisibility = trains.length > 0 ? trains.reduce((sum, t) => sum + (t.visibility || 0), 0) / trains.length : 100;
    const isGlobalFoggy = avgVisibility < 60;

    useEffect(() => {
        loadFleet();
        const interval = setInterval(loadFleet, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!globalAutoPilot) return
        const masterClock = setInterval(() => {
            trains.forEach((t) => {
                if (t.currentStationIndex < (t.route?.length -1)) {
                    fetch(`http://localhost:5000/api/move/${t.trainNumber}`, { method: 'POST' }).then(res=> res.json())
                    .then(updatedData =>{
                        setTrains(prevTrains =>
                            prevTrains.map(item=>
                                item.trainNumber === updatedData.trainNumber ? updatedData : item
                            )
                        )
                    })
                        .catch(err => console.error("Move Error:", err));
                }
            })
        }, 1000);
        return () => clearInterval(masterClock)
    }, [globalAutoPilot, trains]);

    return (
        <div className='p-8 bg-slate-900 min-h-screen text-white'>
            <h1 className='text-3xl font-bold mb-6'>Fleet Dispatcher Control</h1>

            <button onClick={toggleAllAutoPilot} className={`w-full py-1 mb-2 rounded font-bold text-xs transition-colors ${globalAutoPilot ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {globalAutoPilot ? "GLOBAL AUTO-PILOT: ACTIVE" : "GLOBAL AUTO-PILOT: OFF"}
            </button>
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


                            <div className="flex space-x-2 mt-4">
                                <select className="bg-slate-800 text-xs p-1 rounded border border-slate-700"
                                    value={syncTargets[t.trainNumber] || ""} onChange={(e) => { setSyncTargets(prev => ({ ...prev, [t.trainNumber]: e.target.value })) }}>
                                    <option value="">
                                        Select Sync Point
                                    </option>
                                    {t.route.map(s => (
                                        <option key={s._id} value={s.stationCode}>{s.name} ({s.stationCode}) </option>
                                    ))}
                                </select>
                                <button onClick={() => handleSync(t.trainNumber)} className="bg-purple-600 px-3 py-1 rounded text-[10px] font-bold hover:bg-purple-500">
                                    Manual Sync
                                </button>
                                {t.statusReason?.code === "PRIORITY_OVERTAKE" && (
                                    <div className='animate-pulse text-orange-500 font-bold text-xs'>
                                        ⚠️ OVERTAKE IN PROGRESS: Letting {t.statusReason.message.split('by ')[1]} pass.
                                    </div>
                                )}

                            </div>
                            <div className='mt-3 text-xs'>
                                <button onClick={() => setWeather("CLEAR")} className='bg-blue-500 px-3 py-1'>☀️ Clear</button>
                                <button onClick={() => setWeather("FOG")} className='bg-gray-500 px-3 py-1 ml-2'>🌫️ Heavy Fog</button>
                                <button onClick={() => setWeather("STORM")} className='bg-red-500 px-3 py-1 ml-2'>⚡ Storm</button>
                            </div>

                            <div className='my-2 text-sm opacity-80 pt-2'>
                                <p>Current: {t.currentStation?.name || 'Initializing...'} </p> <span>Delay: {formatDelay(t.totalDelay)} </span>
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
                    </div>
                )
            })}
            <button className='bg-blue-900 p-2 w-60 ml-17 rounded-xl cursor-pointer' onClick={handleReset}>Emergency System Reset </button>
        </div>
    )
}

export default GlobalDashboard;