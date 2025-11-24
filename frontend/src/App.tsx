import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from './components/RecruiterDashboard';
import ConsultarCandidates from './pages/ConsultarCandidates';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecruiterDashboard />} />
        <Route path="/consultar" element={<ConsultarCandidates />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
