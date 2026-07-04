import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../index.css'

const TrainTimeline = ({ train }) => {
    if (!train || !train.route) {
        return <div>Loading Intel...</div>
    }
    const progress = (train.currentStationIndex / (train.route.length - 1)) * 100;

    return (
        <div className="timelineContainer">
            <div className="line">
                <div className="progress-fill" style={{ height: `${progress}%` }}></div>
            </div>
            {train.route.map((station, index) => {
                const isActive = index === train.currentStationIndex;
                const isPassed = index < train.currentStationIndex;

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
                                <div className="live-stats">
                                    <span>Speed: {train.currentSpeed} km/h</span>
                                    <span>Occupancy: {station.currentlyOccupied}%</span>
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
    const [autoPilot, setAutoPilot]=useState(false);
    const { trainNumber } = useParams();

    const loadIntel = () => {
        fetch(`http://localhost:5000/api/status/${trainNumber}`).then((res) => res.json())
            .then((data) => {
                setTrain(data);
                setLoading(false)
            }).catch((err) => console.error("Fetch error:", err))
    };

    useEffect(() => {
        loadIntel()
        const heartbeat = setInterval(() => {
            loadIntel();
        }, 5000)
        return () => clearInterval(heartbeat);
    }, [trainNumber])

    useEffect(()=> {
        if (!autoPilot || !train || loading) return;
            const canMove=train.statusReason?.code==="ON_TIME";
            const isNotFinished=train.currentStationIndex<(train.route?.length-1)

            if(canMove && isNotFinished){
                console.log("Auto-Pilot: Conditions met. Moving train in 3 seconds...");
                const autoMoveTimer=setTimeout(()=>{
                    moveTrain();
                }, 3000)
                return ()=> clearTimeout(autoMoveTimer)
            } else{
                console.log("Auto-Pilot: Standing by. Reason:", train.statusReason?.message)
            }
        
    }, [train, autoPilot])

    const moveTrain = () => {
        if (!train || !train.trainNumber) {
            console.error("No train number found!");
            return;
        }
        fetch(`http://localhost:5000/api/move/${train.trainNumber}`, { method: 'POST' })
            .then((res) => {
                if (!res.ok) { return res.text().then(text => { throw new Error(text) }) }
                return res.json()
            })
            .then(() => {
                loadIntel();
            }).catch((err) => console.error("Move Error: ", err))
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
    console.log("current train state:", train)

    return (
        <div className={`appwrapper ${train.statusReason?.uiTheme || 'normal'}`}>
            <header>
                <h2 className="mb-4 pt-4 ml-3">System Snapshot: {train.name} </h2>
                <div className={`reasoning-card ${train.statusReason?.severity === 'Critical' || train.statusReason?.severity === 'High' ? 'urgent' : ''}`} >
                    <span className="label">Live Logic:</span>
                    <p>{train.statusReason?.message}</p>
                </div>
            </header>
            <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mt-5" onClick={moveTrain} disabled={loading || isAtFinalDestination}>{isAtFinalDestination ? "Journey Complete" : "Move Train"}</button>
            <button className={`ml-5 p-1 rounded-sm text-white ${autoPilot ? 'bg-green-600' : 'bg-slate-600'}`} onClick={()=> setAutoPilot(!autoPilot)}>
                {autoPilot ? "Auto-Pilot: ON" : "Auto-Pilot: OFF"}
            </button>
            <TrainTimeline train={train} />
            <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mb-4" onClick={initiateChaos}>Initiate Chaos</button>
            {train.statusReason?.code === 'COMPLETED' && (
                <button className="move-train w-30 bg-amber-800 ml-5 rounded-sm text-white p-1 mb-4" onClick={() => RestartJourney(train.trainNumber)}>Restart Journey</button>
            )}
            <div>
                {train.history?.length > 0 ? (
                    train.history.map((log, index) => (
                        <div key={index} className="text-xs border-l-2 border-amber-500 pl-2 mb-2 bg-black/20 p-1">
                            <span className="opacity-50 mr-2">
                                {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}:
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