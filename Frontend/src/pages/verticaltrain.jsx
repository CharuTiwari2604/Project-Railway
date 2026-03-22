import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../index.css'

const formatDelay = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0s";
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m  ${secs}s` : `${secs}s`
}

const TrainTimeline = ({ train, allTrains }) => {
    if (!train || !train.route) {
        return <div>Loading Intel...</div>
    }
    
    const finalStation = train.route[train.route.length - 1];
    const totalDistance = finalStation.distanceFromStart;
    const progress = (train.currentKM / totalDistance) * 100;

    return (
        <div className="timelineContainer">
            <div className="line">
                <div className="progress-fill" style={{ height: `${progress}%` }}></div>
            </div>
            {train.route.map((station, index) => {
                const isActive = index === train.currentStationIndex;
                const isPassed = index < train.currentStationIndex;
                const dwellProgress = train.dwellTime ? (train.dwellTime/20)*100 : 0;

                let statusClass = "dot-upcoming";
                if (isPassed) statusClass = "dot-passed";
                else if (isActive) statusClass = train.statusReason?.uiTheme;

                return (
                    <div key={station._id} className="item">
                        <div className={`station-dot ${statusClass}`}>
                            {isActive && <div className={train.statusReason?.severity === 'Critical' ? "pulse-warning" : "pulsering"}></div>}
                        </div>
                        <div className="stationifo">
                            <h4 className={(isActive && train.statusReason?.severity === 'Critical') ? 'text-red' : (isActive ? 'neontxt' : '')}>
                                {station.name}
                            </h4>
                            {isActive && (
                                <div className="flex flex-col gap-2">
                                    <span>Speed: {train.currentSpeed} km/h</span>
                                    {train.dwellTime>0 ? (
                                        <div className="w-full h-1.5 bg-white rounded-full">
                                        <div className="h-full bg-amber-500 transition-all duration-1000 ease-linear" style={{width: `${dwellProgress}%`}}>
                                            </div>
                                            <span className="mt-5">Departing in {train.dwellTime}sec.</span>
                                            </div>
                                    ) : (
                                        <span className="text-xs">
                                            {train.eta === -1 ? <b className="text-red-500 animate-pulse">STOPPED</b> :`ETA: ${train.eta} mins`}
                                        </span>
                                    )}
                                    <span className="mt-6">Occupancy: {station.currentlyOccupied}%</span>
                                    <span>Delay: {formatDelay(train.totalDelay)} </span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const Layout = () => {

    const [train, setTrain] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoPilot, setAutoPilot] = useState(false);
    const { trainNumber } = useParams();
    const [allTrains, setAllTrains] = useState([]);

    const loadIntel = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/all`)
            const data = await res.json();
            const trainList = Array.isArray(data) ? data : [data];

        setAllTrains(trainList);
            const specific = trainList.find(t=> t.trainNumber === trainNumber)
            setTrain(specific)
            
        } catch (err) {
            console.error("Sync Error: ", err)
        } finally {
            setLoading(false);
        }
    };

const stalker = allTrains.find(t => t.priority < train?.priority);
    const liveGap = (stalker && train) 
        ? Math.abs(train.currentKM - stalker.currentKM).toFixed(2) 
        : "N/A";


    useEffect(() => {
        loadIntel()
        const heartbeat = setInterval(() => {
            if (!autoPilot)
                loadIntel();
        }, 5000)
        return () => clearInterval(heartbeat);
    }, [trainNumber, autoPilot])

    useEffect(() => {
        if (!autoPilot || !train || loading) return;
        const isNotFinished = train.currentStationIndex < (train.route?.length - 1)

        if (isNotFinished) {
            const timer = setTimeout(() => {
                moveTrain();
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [train, autoPilot])

    const moveTrain = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/move/${train.trainNumber}`, { method: 'POST' })
            const data = await res.json();
            setTrain(data)
        } catch (err) {
            console.error(err)
        }
    }

    const initiateChaos = () => {
        fetch(`http://localhost:5000/api/chaos/${train.trainNumber}`).then((res) => {
            if (!res.ok) { return res.text().then(text => { throw new Error(text) }) }
            return res.json()
        }).then(() => {
            loadIntel()
        }).catch(err => console.error("Chaos Error:", err))
    }

    const RestartJourney = (trainNumber) => {
        fetch(`http://localhost:5000/api/restart/${trainNumber}`, { method: 'POST' })
            .then((res) => {
                if (!res.ok) return res.text().then(text => { throw new Error(text) })
                return res.json();
            })
            .then(() => {
                loadIntel();
                alert(`Train ${trainNumber} has been reset to origin.`)
            })
            .catch(err => console.error("Error in restart: ", err));
    }

    if (loading) return <div className="loading">Loading</div>
    if (!train) return <div className="error">No live data available</div>
    const isAtFinalDestination = train?.currentStationIndex === (train?.route?.length - 1);

    return (
        <div className={`appwrapper ${train.statusReason?.uiTheme || 'normal'}`}>
            <header>
                <h2 className="mb-4 pt-4 ml-3">System Snapshot: {train.name} </h2>
                <div className={`reasoning-card ${train.statusReason?.severity === 'Critical' || train.statusReason?.severity === 'High' ? 'urgent' : ''}`} >
                    <span className="label">Live Logic:</span>
                    <p>{train.statusReason?.message}</p>
                    {train.statusReason?.code === "PRIORITY_OVERTAKE" && (
                        <div className="mt-3 p-2 bg-orange-900/40 border border-orange-500 rounded animate-pulse">
                            <h3 className="text-lg font-mono text-white">
                                {liveGap}<span className="text-xs">KM GAP</span>
                            </h3>
                            <p className="text-[10px] text-orange-200 opacity-70">Holding for Vande Bharat Express</p>
                        </div>
                    )}
                    
                </div>
            </header>
            <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mt-5" onClick={moveTrain} disabled={loading || isAtFinalDestination}>{isAtFinalDestination ? "Journey Complete" : "Move Train"}</button>
            <button className={`ml-5 p-1 rounded-sm text-white ${autoPilot ? 'bg-green-600' : 'bg-slate-600'}`} onClick={() => setAutoPilot(!autoPilot)}>
                {autoPilot ? "Auto-Pilot: ON" : "Auto-Pilot: OFF"}
            </button>

            <TrainTimeline train={train} allTrains={allTrains} gap={liveGap} />
            <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mb-4" onClick={initiateChaos}>Initiate Chaos</button>
            {train.statusReason?.code === 'COMPLETED' && (
                <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mb-4" onClick={() => RestartJourney(train.trainNumber)}>Restart Journey</button>
            )}
            <div>
                {train.history?.length > 0 ? (
                    train.history.map((log, index) => (
                        <div key={index} className="text-xs border-l-2 border-amber-500 pl-2 mb-2 bg-black/20 p-1">
                            <span className="opacity-50 mr-2">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}:
                            </span>
                            {log.message}
                        </div>
                    ))
                ) : (
                    <p className="opacity-30">No recent activity logged.</p>

                )}
            </div>
        </div>
    )
}

export default Layout;