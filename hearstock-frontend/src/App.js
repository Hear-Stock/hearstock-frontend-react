import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SpherePage from './pages/SpherePage';
import HRTFDemo from './pages/HRTFDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sphere" element={<SpherePage />} />
        <Route path="/hrtfdemo" element={<HRTFDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
