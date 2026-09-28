import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeverityBadge, StatusBadge, TechBadge } from './Badge';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../Const/Display';

export const RecentScansTable = ({ scans = [] }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Default mock scans for rich initial presentation if empty
  const defaultScans = [
    {
      id: 'scan-7f8a92b',
      projectName: 'e-commerce-portal',
      framework: 'React 19 + FastAPI',
      pagesVisited: 8,
      duration: '1m 42s',
      timestamp: '12 mins ago',
      status: 'complete',
      bugs: { critical: 1, high: 2, medium: 1, low: 3 },
    },
    {
      id: 'scan-3d91c4a',
      projectName: 'fintech-checkout-flow',
      framework: 'React + Vite',
      pagesVisited: 5,
      duration: '58s',
      timestamp: '1 hour ago',
      status: 'complete',
      bugs: { critical: 2, high: 0, medium: 1, low: 0 },
    },
    {
      id: 'scan-99b821e',
      projectName: 'internal-crm-tool',
      framework: 'FastAPI Backend',
      pagesVisited: 12,
      duration: '2m 15s',
      timestamp: '3 hours ago',
      status: 'complete',
      bugs: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    {
      id: 'scan-11fa48c',
      projectName: 'analytics-dashboard-v2',
      framework: 'React 19 + FastAPI',
      pagesVisited: 4,
      duration: 'Running...',
      timestamp: 'Just now',
      status: 'running',
      bugs: { critical: 0, high: 1, medium: 0, low: 0 },
    },
  ];

  const currentScans = scans.length > 0 ? scans : defaultScans;

  const filteredScans = currentScans.filter((scan) => {
    const matchesSearch =
      scan.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'bugs') {
      return (scan.bugs.critical > 0 || scan.bugs.high > 0);
    }
    if (activeFilter === 'passed') {
      return (scan.bugs.critical === 0 && scan.bugs.high === 0 && scan.status === 'complete');
    }
    if (activeFilter === 'running') {
      return scan.status === 'running';
    }
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h3
            className="font-bold text-white tracking-tight"
            style={{ fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold }}
          >
            Recent QA Execution History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry logs and visual regression evidence from containerized test sessions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by project or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-56 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-8 pr-3 py-2 outline-none focus:border-blue-500 transition"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('bugs')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'bugs'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Has Bugs
            </button>
            <button
              onClick={() => setActiveFilter('passed')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'passed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passed
            </button>
            <button
              onClick={() => setActiveFilter('running')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeFilter === 'running'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Running
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Run ID & Project</th>
              <th className="py-3 px-4">Tech Stack</th>
              <th className="py-3 px-4">Pages & Time</th>
              <th className="py-3 px-4">Severity Findings</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs">
            {filteredScans.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium">No matching QA scans found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredScans.map((scan) => {
                const totalBugs =
                  scan.bugs.critical + scan.bugs.high + scan.bugs.medium + scan.bugs.low;

                return (
                  <tr key={scan.id} className="table-row-hover group">
                    {/* Project & Run ID */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition">
                          {scan.projectName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          #{scan.id} • {scan.timestamp}
                        </div>
                      </div>
                    </td>

                    {/* Framework */}
                    <td className="py-4 px-4">
                      <TechBadge label={scan.framework} variant="blue" />
                    </td>

                    {/* Pages & Duration */}
                    <td className="py-4 px-4">
                      <div className="text-slate-200 font-medium">
                        {scan.pagesVisited} pages checked
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                        {scan.duration}
                      </div>
                    </td>

                    {/* Bug Findings Summary */}
                    <td className="py-4 px-4">
                      {totalBugs === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Zero Bugs Found
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {scan.bugs.critical > 0 && (
                            <span className="badge-critical px-2 py-0.5 rounded text-[11px] font-semibold">
                              {scan.bugs.critical} Critical
                            </span>
                          )}
                          {scan.bugs.high > 0 && (
                            <span className="badge-high px-2 py-0.5 rounded text-[11px] font-semibold">
                              {scan.bugs.high} High
                            </span>
                          )}
                          {scan.bugs.medium > 0 && (
                            <span className="badge-medium px-2 py-0.5 rounded text-[11px] font-semibold">
                              {scan.bugs.medium} Med
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={scan.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => navigate(`/report/${scan.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 transition cursor-pointer"
                      >
                        <span>View Report</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentScansTable;
