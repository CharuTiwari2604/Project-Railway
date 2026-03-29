import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, ChevronRight, Train, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HistoryPage = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandId, setExpandId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/history');
        setHistory(res.data);
      } catch (err) {
        console.error("History Error: ", err);
      }
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="bg-[#1A1A1A] p-3 rounded-2xl border border-white/5">
          <ArrowLeft size={20} className="text-yellow-400" />
        </button>
        <h1 className="text-2xl font-black">Search History</h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-yellow-400" />
          </div>
        ) : (
          history.map((item) => (
            <div key={item._id} className='space-y-2'>
              <div onClick={() => setExpandId(expandId === item._id ? null : item._id)} className={`bg-[#141414] border border-white/5 p-5 rounded-[28px] flex items-center gap-4 active:bg-[#1A1A1A]  cursor-pointer ${expandId === item._id ? 'border-yellow-400/20' : ''}`} >
                <div className="bg-yellow-400/10 p-4 rounded-2xl hover:bg-yellow-400 hover:text-black transition-colors text-yellow-400">
                  <Train size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-yellow-400/50">{item.trainNumber}</span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      {new Date(item.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-200">{item.name}</h3>
                  <p className="text-xs text-gray-500 font-medium italic">
                    Status: {item.finalReason?.message || (item.history?.length > 0 ? item.history[item.history.length - 1].message : "No Data")}
                  </p>
                </div>

                <button className="bg-[#1A1A1A] p-2 rounded-xl text-gray-600">
                  <ChevronRight size={20} />
                </button>
              </div>
              {expandId === item._id && (
                <div className="mx-2 bg-[#1A1A1A]/80 border border-white/5 p-5 rounded-b-[28px] mt-3xl pt-10">
                  <p className='text-[1rem] font-black text-yellow-400 text-center'>
                    JOURNEY LOGBOOK
                  </p>
                  <div className="max-h-75 overflow-y-auto pr-2 space-y-3 custom-scrollbar" >
                    {item.history && item.history.length > 0 ? (
                      [...item.history].reverse().map((log, index) => (
                        <div key={index} className='flex gap-4 items-start bg-black/40 p-8 pb-11 rounded-2xl border border-white/5' >
                          <div className="w-2 h-2 rounded-full bg-yellow-400 -mt-2 -ml-6">
                            <div className='flex-1 min-w-80 -mt-2 pl-1 ml-2.5'>
                              <p className="text-xs text-gray-300 font-medium">{log.message} </p>
                              <p className="text-[10px] text-gray-600 mt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600 text-center italic">No logs found for this journey.</p>
                    )
                    }
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate('./mapview', { state: { trainInfo: item } }) }} className="w-full mt-5 bg-yellow-400/10 text-yellow-400 py-3 rounded-xl text-xs font-bold hover:bg-yellow-400 hover:text-black">
                    View 3D Replay
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Clock size={48} className="text-gray-800 mb-4" />
          <p className="text-gray-600 font-bold">No history found.<br />Start tracking trains!</p>
        </div>
      )}
    </div >
  );
}

export default HistoryPage;