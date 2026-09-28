import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar, SeverityBadge } from '../../../CustomComp';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../../../Const/Display';

export const ReportScreen = () => {
  const { runId } = useParams();
  const navigate = useNavigate();

  // Mock finding for demo review
  const findings = [
    {
      id: 1,
      title: 'Checkout button unresponsive on mobile viewport (500 Internal Error)',
      severity: 'critical',
      confidence: 'High (98%)',
      pageUrl: '/checkout',
      explanation: 'Clicking the "Complete Purchase" button triggers an unhandled rejection in cartService.js. The network request to /api/checkout failed with HTTP 500.',
    },
    {
      id: 2,
      title: 'Layout overlap: Pricing card overflows navbar on tablet resolution',
      severity: 'high',
      confidence: 'Medium (85%)',
      pageUrl: '/pricing',
      explanation: 'Visual regression: The z-index on the featured pricing column causes it to overlay above the sticky navigation menu when scrolling.',
    },
    {
      id: 3,
      title: 'Console Warning: Deprecated lifecycle method detected',
      severity: 'low',
      confidence: 'High (95%)',
      pageUrl: '/',
      explanation: 'Warning captured in browser console: componentWillReceiveProps is deprecated in React 19.',
    }
  ];

  return (
    <div className="dashboard-canvas flex flex-col min-h-screen text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              SCAN REPORT COMPLETED
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">Audit Findings & Visual Regression Report</h2>
            <p className="text-xs text-slate-400">Run ID: <span className="font-mono text-slate-200">#{runId}</span></p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            ← Return to Dashboard
          </button>
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          {findings.map((f) => (
            <div key={f.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={f.severity} />
                  <span className="text-xs font-mono text-slate-400">{f.pageUrl}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Confidence: {f.confidence}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{f.explanation}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ReportScreen;
