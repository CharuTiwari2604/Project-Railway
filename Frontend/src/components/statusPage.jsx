import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ArrowLeft, MapPin, Zap, AlertTriangle } from 'lucide-react';
import OverTake from './overtake';
import { useLocation, useNavigate } from 'react-router-dom';


const StatusDashboard = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state?.trainInfo;

    const isOvertaking = data?.finalReason?.code === 'OVERTAKE';

    if (!data) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-yellow-400 font-bold mb-4">Session Timed Out</p>
                    <button onClick={() => navigate('/')} className="px-6 py-2 bg-yellow-400 text-black rounded-full font-bold">
                        RE-SYNC TRAIN
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="h-screen bg-[#0D0D0D] flex flex-col font-sans">
            <button onClick={() => navigate(-1)} className="bg-[#1A1A1A] p-3 rounded-2xl border border-white/5 active:scale-90 w-12 mt-6 ml-4">
                <ArrowLeft size={20} className="text-yellow-400" />
            </button>
            <div className="h-1/2 relative border-b border-white/5">
                <Canvas shadows camera={{ position: [20, 10, 20], fov: 35 }}>
                    <ambientLight intensity={3} />
                    <directionalLight position={[10, 20, 10]} intensity={4} castShadow />
                    <pointLight position={[-20, 10, -20]} intensity={2} color="#ffffff" />
                    <Environment preset='apartment' />
                    <Suspense fallback={null}>
                        <group position={[0, -1, 0]} >
                            <OverTake isOvertaking={isOvertaking} trainName={data?.name} />
                        </group>
                    </Suspense>
                    <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} target={[0, 0, 0]} />
                </Canvas>
                <div className="absolute top-[-2.2rem] left-25 flex gap-2">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 shadow-xl ${isOvertaking ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 text-black'}`}>
                        {isOvertaking && <Zap size={14} />}
                        {data?.mergedStatus || "Live Sync"}
                    </div>
                </div>
            </div>
            <div className="h-170 bg-[#141414] rounded-t-[40px] p-8  border-white/5">
                <div className="flex justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white leading-tight uppercase">{data?.name}</h2>
                        <p className="text-gray-500 font-bold text-xs tracking-[0.2em]">{data?.trainNumber}</p>
                    </div>
                    <div className="bg-yellow-400/10 p-3 rounded-2xl max-h-13 border border-yellow-400/20">
                        <MapPin className="text-yellow-400" size={24} />
                    </div>
                </div>
                <div className="bg-[#1A1A1A] p-5 rounded-3xl mb-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 blur-3xl rounded-full"></div>
                    <div className="flex gap-4 items-center relative z-10">
                        <div className="bg-yellow-400/10 p-3 rounded-2xl">
                            <AlertTriangle className="text-yellow-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">khabri Status</p>
                            <h4 className="text-sm font-bold text-white mb-2">{data?.mergedStatus || "Analyzing singnals..."}</h4>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black tracking-widest mb-2">CURRENT SPEED</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-white leading-none">{data?.currentSpeed}</p>
                            <p className="text-[10px] text-gray-500 font-bold mb-1">KM/H</p>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5">
                        <p className="text-[9px] text-gray-600 font-black tracking-[3px] mb-2">NEXT STATION</p>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute -mt-4 inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex -mt-4 rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                                <p className="text-xl -mt-8 font-black text-white tracking-tighter uppercase">
                                    {data?.nextStationName}
                                </p>
                            </div>
                            <div className=" relative mt-10 min-w-40 -ml-23">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5">DISTANCE =</span>
                                <span className="text-sm font-black text-yellow-400">
                                    {data?.distToNext} <span className="text-[10px] text-gray-500">KM</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5 relative">
                        <p className="text-[9px] text-gray-600 font-black tracking-[3px] mb-2">TARGET PLATFORM</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-black text-yellow-400">{data?.expectedPlatform || "1"}</p>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Expected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatusDashboard;