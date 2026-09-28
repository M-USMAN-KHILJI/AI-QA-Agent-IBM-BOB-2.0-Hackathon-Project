import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style.css';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../../../Const/Display';
import {
  Navbar,
  StatCard,
  UploadCard,
  RecentScansTable,
  AgentMonitorCard,
} from '../../../CustomComp';
import { uploadProject, getRecentScans } from '../../../Api/Api';

export const Dashboard = () => {
  const navigate = useNavigate();
  const uploadSectionRef = useRef(null);

  const [notification, setNotification] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  React.useEffect(() => {
    async function loadScans() {
      try {
        const scans = await getRecentScans();
        if (scans && scans.length > 0) {
          setRecentScans(scans);
        }
      } catch (err) {
        // use default fallback scans
      }
    }
    loadScans();
  }, []);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartScan = async (scanPayload) => {
    try {
      const response = await uploadProject(scanPayload);
      if (response && response.run_id) {
        navigate(`/scan/${response.run_id}`);
      } else {
        throw new Error('No run ID returned from backend.');
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.message || 'Error initiating scan.',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="dashboard-canvas flex flex-col min-h-screen text-slate-100">
      {/* Top Navigation */}
      <Navbar onNewScanClick={scrollToUpload} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl glass-panel border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3 shadow-2xl animate-fade-in">
          <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-10 border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>IBM Bob 2.0 Hackathon • Autonomous Testing Workflow</span>
            </div>

            <h1
              className="font-extrabold text-white tracking-tight leading-tight"
              style={{
                fontSize: FONT_SIZES['4xl'],
                fontWeight: FONT_WEIGHTS.bold,
              }}
            >
              Autonomous QA Agent for{' '}
              <span className="gradient-text-blue-purple">Full-Stack Apps</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Drop in your React & FastAPI code. Our agent spins up an isolated Docker sandbox, navigates every reachable route with headless Chromium, and hands back high-fidelity bug reports in minutes.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToUpload}
                className="btn-primary-glow px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Project & Scan
              </button>

              <button
                onClick={() => navigate('/report')}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Audit Report
              </button>

              <div className="flex items-center gap-2 pl-2">
                <span className="tech-pill">Node 20</span>
                <span className="tech-pill">Python 3.11</span>
                <span className="tech-pill">Playwright</span>
                <span className="tech-pill">Docker SDK</span>
              </div>
            </div>
          </div>
        </section>

        {/* Telemetry Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total QA Scans"
            value="148"
            subtitle="Autonomous test runs"
            change="34% this week"
            isPositive={true}
            accentColor={COLORS.primary}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <StatCard
            title="Critical Bugs Caught"
            value="42"
            subtitle="Blocked before deployment"
            change="High impact"
            isPositive={false}
            accentColor={COLORS.rose}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <StatCard
            title="Avg Scan Speed"
            value="1m 35s"
            subtitle="vs. 4+ hours manual QA"
            change="15x faster"
            isPositive={true}
            accentColor={COLORS.secondary}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="Sandbox Health"
            value="99.8%"
            subtitle="Auto-cleanup & teardown"
            change="Zero leaks"
            isPositive={true}
            accentColor={COLORS.emerald}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </section>

        {/* Upload & Quick Action Section */}
        <div ref={uploadSectionRef}>
          <UploadCard onStartScan={handleStartScan} />
        </div>

        {/* Sandbox & Agent Health Telemetry */}
        <section>
          <AgentMonitorCard />
        </section>

        {/* Recent Scans Table */}
        <section>
          <RecentScansTable scans={recentScans} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI QA Agent • Built for IBM Bob 2.0 Hackathon (lablab.ai)</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Server</span>
            <span>•</span>
            <span>Dockerized Chromium</span>
            <span>•</span>
            <span>Zero Persistence Clean-up</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
