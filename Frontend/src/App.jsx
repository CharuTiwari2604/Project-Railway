import React, { useState } from "react"
import { Route, BrowserRouter as Router, Routes,} from 'react-router-dom';
import Home from "./homepage";
import Layout from "./pages/verticaltrain";
import GlobalDashboard from "./pages/fleetDashboard";
import OverTake from "./components/overtake";
import StatusDashboard from "./components/statusPage";
import HistoryPage from "./components/history";

const App=()=>{

  return (

<Router>
  <Routes>
    <Route path='/' element={<Home/>}/>
    <Route path='/dashboard/:trainNumber' element={<Layout />}/>
    <Route path='/mapview' element={<StatusDashboard/>} />
    <Route path='/global-dashboard' element={<GlobalDashboard />} />
    <Route path="/overtake" element={< OverTake />} />
    <Route path="/history" element={<HistoryPage />} />
  </Routes>
</Router>
  )
}

export default App
