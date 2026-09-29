import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../Const/Display';
import { useAuth } from '../Context/AuthContext';

export const Navbar = ({ onNewScanClick }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(9, 10, 15, 0.85)',
        borderColor: COLORS.borderDefault,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold tracking-tight text-white"
                  style={{ fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold }}
                >
                  AI QA Agent
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.0 Bob
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Autonomous Full-Stack Sandbox Tester
              </p>
            </div>
          </Link>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-400">Sandbox:</span>
          <span className="text-emerald-400 font-medium">Ready (Node.js + Python + Playwright)</span>
        </div>

        {/* Right: Actions & User Auth */}
        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-slate-800 transition"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </Link>

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-1 border-l border-slate-800">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] uppercase">
                  {user.username ? user.username.charAt(0) : 'U'}
                </div>
                <span className="font-mono text-slate-200 text-xs max-w-[100px] truncate">
                  {user.username}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            onClick={onNewScanClick}
            className="btn-primary-glow px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap ml-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Scan
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
