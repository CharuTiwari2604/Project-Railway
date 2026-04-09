import React, { useState } from "react"
import { Route, BrowserRouter as Router, Routes,} from 'react-router-dom';
import Home from "./homepage";
import OverTake from "./components/overtake";
import StatusDashboard from "./components/statusPage";
import HistoryPage from "./components/history";

const App=()=>{

  return (

<Router>
  <Routes>
    <Route path='/' element={<Home/>}/>
    <Route path='/mapview' element={<StatusDashboard/>} />
    <Route path="/overtake" element={< OverTake />} />
    <Route path="/history" element={<HistoryPage />} />
  </Routes>
</Router>
  )
}

export default App
