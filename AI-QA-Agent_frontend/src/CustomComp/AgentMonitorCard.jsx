import React from 'react';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../Const/Display';

export const AgentMonitorCard = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h4
            className="font-bold text-white tracking-tight"
            style={{ fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold }}
          >
            Agent Engine & Sandbox Telemetry
          </h4>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          HEALTHY • 99.8% UPTIME
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Module 1: Base Image */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">SANDBOX BASE IMAGE</div>
          <div className="text-sm font-semibold text-slate-100 mt-1 flex items-center gap-1.5">
            <span className="text-blue-400">qa-sandbox-base</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded">v2</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pre-baked Node 20 + Python 3.11
          </div>
        </div>

        {/* Module 2: Playwright */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">PLAYWRIGHT ENGINE</div>
          <div className="text-sm font-semibold text-slate-100 mt-1 flex items-center gap-1.5">
            <span className="text-purple-400">Chromium Headless</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            NetworkIdle + Full DOM Watchers
          </div>
        </div>

        {/* Module 3: Resource Limiter */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">CONTAINER CONSTRAINTS</div>
          <div className="text-sm font-semibold text-slate-100 mt-1 flex items-center gap-1.5">
            <span className="text-cyan-400">512MB RAM • 1.0 CPU</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Non-root <code className="text-slate-300">sandboxuser</code>
          </div>
        </div>

        {/* Module 4: Vision AI Model */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">BUG CLASSIFIER</div>
          <div className="text-sm font-semibold text-slate-100 mt-1 flex items-center gap-1.5">
            <span className="text-amber-400">Vision LLM Active</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Contextual Functional & Layout Checks
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMonitorCard;
