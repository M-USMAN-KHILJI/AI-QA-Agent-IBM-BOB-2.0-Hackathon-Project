import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../screen/main/DashBoard/Dshboard';
import ScanScreen from '../screen/main/ScanScree/ScanScreen';
import Report from '../screen/main/Report/Report';

export const Navigation = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Scan In-Progress Screen */}
        <Route path="/scan/:runId" element={<ScanScreen />} />

        {/* Detailed QA Audit Report Screen */}
        <Route path="/report" element={<Report />} />
        <Route path="/report/:runId" element={<Report />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Navigation;
