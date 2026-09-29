import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../Context/AuthContext';
import Dashboard from '../screen/main/DashBoard/Dshboard';
import ScanScreen from '../screen/main/ScanScree/ScanScreen';
import Report from '../screen/main/Report/Report';
import { Login, Signup } from '../screen/Auth';

export const Navigation = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />

          {/* Scan In-Progress Screen */}
          <Route path="/scan/:runId" element={<ScanScreen />} />

          {/* Detailed QA Audit Report Screen */}
          <Route path="/report" element={<Report />} />
          <Route path="/report/:runId" element={<Report />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Navigation;
