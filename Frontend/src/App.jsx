import React from "react"
import { Route, BrowserRouter as Router, Routes,} from 'react-router-dom';
import Home from "./homepage";
import Layout from "./pages/verticaltrain";
import GlobalDashboard from "./pages/fleetDashboard";

const App=()=>{

  return (
<Router>
  <Routes>
    <Route path='/' element={<Home/>}/>
    <Route path='/dashboard/:trainNumber' element={<Layout />}/>
    <Route path='/global-dashboard' element={<GlobalDashboard />}></Route>
  </Routes>
</Router>
  )
}

export default App
