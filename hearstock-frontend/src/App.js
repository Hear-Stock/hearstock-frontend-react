import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SpherePage from './pages/SpherePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sphere" element={<SpherePage />} />
      </Routes>
    </Router>
  );
}

export default App;
