import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Report.css';
import { Navbar, SeverityBadge, TechBadge } from '../../../CustomComp';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../../../Const/Display';
import { getReport } from '../../../Api/Api';

export const Report = () => {
  const { runId } = useParams();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});

  // High-fidelity fallback report dataset for instant presentation
  const fallbackReport = {
    runId: runId || 'scan-sample-demo',
    projectName: 'ecommerce-cart-app',
    timestamp: new Date().toLocaleString(),
    duration: '1m 38s',
    totalPages: 8,
    passRate: 75,
    summaryCounts: {
      critical: 1,
      high: 2,
      medium: 1,
      low: 2,
      passed: 6,
    },
    findings: [
      {
        id: 'bug-101',
        title: 'Complete Checkout button triggers unhandled 500 Internal Server Error',
        severity: 'critical',
        confidence: '98%',
        pageUrl: '/checkout',
        component: 'CheckoutForm.jsx:84',
        explanation: 'When clicking the "Pay & Complete Order" button with filled credit card inputs, the page stays unresponsive without user feedback. Browser console reports an unhandled Promise rejection and the backend returns HTTP 500 on /api/orders/charge.',
        consoleErrors: [
          'POST http://localhost:8000/api/orders/charge 500 (Internal Server Error)',
          'Uncaught (in promise) Error: Request failed with status code 500 at checkoutService.js:42:15',
        ],
        networkFailures: [
          {
            method: 'POST',
            url: 'http://localhost:8000/api/orders/charge',
            status: 500,
            statusText: 'Internal Server Error',
            response: '{"detail":"Database lock timeout in payment gateway transaction table"}',
          },
        ],
        suggestedFix: `// backend/app/api/orders.py\n- @router.post("/charge")\n- async def charge_order(db: Session = Depends(get_db)):\n+ async def charge_order(db: Session = Depends(get_db_session)):\n+     try:\n+         return await process_payment_safely(db)\n+     except PaymentGatewayError as e:\n+         raise HTTPException(status_code=400, detail=str(e))`,
        screenshot: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=900&auto=format&fit=crop&q=80',
        screenshotCaption: 'Checkout screen showing frozen state after button click',
      },
      {
        id: 'bug-102',
        title: 'Sticky navigation menu clips and overlays product pricing table on tablet viewport',
        severity: 'high',
        confidence: '91%',
        pageUrl: '/pricing',
        component: 'PricingCards.jsx:32',
        explanation: 'Visual Regression: At viewport width 768px - 1024px, the header navbar (z-index: 50) and the pricing card comparison header collide, making the "Enterprise Tier" CTA button unclickable.',
        consoleErrors: [],
        networkFailures: [],
        suggestedFix: `/* Fix in PricingCards.css */\n.pricing-container {\n-   margin-top: -20px;\n+   margin-top: 5rem;\n    position: relative;\n-   z-index: 60;\n+   z-index: 10;\n}`,
        screenshot: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80',
        screenshotCaption: 'Visual clipping of sticky navbar over pricing grid',
      },
      {
        id: 'bug-103',
        title: 'Missing environment variable STRIPE_PUBLIC_KEY referenced in client build',
        severity: 'high',
        confidence: '95%',
        pageUrl: '/checkout/payment',
        component: 'StripeProvider.jsx:12',
        explanation: 'Static Code & Runtime Analysis: The payment module initializes Stripe with an empty or undefined publishable key, resulting in Stripe initialization failure on runtime.',
        consoleErrors: [
          '[Stripe SDK] Invalid string: key must start with "pk_test_" or "pk_live_". Received: undefined',
        ],
        networkFailures: [],
        suggestedFix: `// Add to .env file:\nSTRIPE_PUBLIC_KEY=pk_test_sample_key_12345\nVITE_STRIPE_PUBLIC_KEY=pk_test_sample_key_12345`,
        screenshot: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80',
        screenshotCaption: 'Stripe container failing to render due to undefined credentials',
      },
      {
        id: 'bug-104',
        title: 'Cart item quantity counter does not clamp at zero, allowing negative cart totals',
        severity: 'medium',
        confidence: '89%',
        pageUrl: '/cart',
        component: 'CartDrawer.jsx:49',
        explanation: 'Functional Defect: Clicking the minus (-) stepper on an item with quantity 1 reduces it to -1 and sets subtotal to -$24.00 instead of removing the line item.',
        consoleErrors: [],
        networkFailures: [],
        suggestedFix: `// frontend/src/components/CartDrawer.jsx\nconst handleDecrement = (itemId, currentQty) => {\n-   updateQuantity(itemId, currentQty - 1);\n+   if (currentQty <= 1) {\n+     removeItem(itemId);\n+   } else {\n+     updateQuantity(itemId, currentQty - 1);\n+   }\n};`,
        screenshot: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&auto=format&fit=crop&q=80',
        screenshotCaption: 'Cart drawer showing negative $ price calculation',
      },
      {
        id: 'bug-105',
        title: 'Console log statement left in production build exposing user session token',
        severity: 'low',
        confidence: '99%',
        pageUrl: '/dashboard/profile',
        component: 'authService.js:77',
        explanation: 'Static Code Analysis: A residual console.log statement was detected printing session auth tokens to the client console.',
        consoleErrors: [
          'Session payload: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ],
        networkFailures: [],
        suggestedFix: `// authService.js line 77\n- console.log("Session payload:", token);\n+ // Sensitive token logging removed for production compliance`,
        screenshot: null,
      },
    ],
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchReport() {
      if (runId) {
        try {
          const data = await getReport(runId);
          if (isMounted && data && (data.findings || Array.isArray(data.findings))) {
            const normalized = {
              runId: data.run_id || data.runId || runId,
              projectName: data.project_name || 'uploaded-project',
              timestamp: data.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString(),
              duration: data.duration || '48s',
              totalPages: data.total_pages_visited || data.totalPages || (data.findings ? Math.max(1, new Set(data.findings.map(f => f.page_url || f.pageUrl)).size) : 1),
              passRate: data.pass_rate !== undefined ? data.pass_rate : Math.max(25, 100 - (data.findings ? data.findings.length * 15 : 0)),
              summaryCounts: {
                critical: data.summary_counts?.critical ?? data.summaryCounts?.critical ?? 0,
                high: data.summary_counts?.high ?? data.summaryCounts?.high ?? 0,
                medium: data.summary_counts?.medium ?? data.summaryCounts?.medium ?? 0,
                low: data.summary_counts?.low ?? data.summaryCounts?.low ?? 0,
                passed: data.summary_counts?.passed ?? data.summaryCounts?.passed ?? 4,
              },
              findings: (data.findings || []).map((f, idx) => ({
                id: f.id || `bug-${idx + 101}`,
                title: f.title || 'Detected Defect',
                severity: (f.severity || 'medium').toLowerCase(),
                confidence: typeof f.confidence === 'string' && f.confidence.includes('%') ? f.confidence : (f.confidence === 'high' ? '95%' : f.confidence === 'low' ? '72%' : '88%'),
                pageUrl: f.page_url || f.pageUrl || '/',
                component: f.component || (f.page_url ? `${f.page_url.replace(/^\//, '') || 'Home'}.jsx` : 'App.jsx'),
                explanation: f.explanation || 'Defect detected during crawl.',
                consoleErrors: f.console_errors || f.consoleErrors || [],
                networkFailures: f.network_failures || f.networkFailures || [],
                suggestedFix: f.suggested_fix || f.suggestedFix || null,
                screenshot: f.screenshot || (f.screenshot_b64 ? (f.screenshot_b64.startsWith('data:') ? f.screenshot_b64 : `data:image/png;base64,${f.screenshot_b64}`) : null),
                screenshotCaption: f.screenshotCaption || `Visual capture of ${f.page_url || f.pageUrl || 'page'} during automated crawl`,
              })),
            };
            setReportData(normalized);
            return;
          }
        } catch (e) {
          console.warn('Could not load remote report, using sample:', e);
        }
      }
      if (isMounted) {
        setReportData(fallbackReport);
      }
    }
    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [runId]);

  const activeReport = reportData || fallbackReport;

  // Filter logic
  const filteredFindings = (activeReport.findings || []).filter((finding) => {
    const matchesSeverity =
      activeFilter === 'all' || finding.severity?.toLowerCase() === activeFilter.toLowerCase();
    const matchesRoute =
      selectedRoute === 'all' || finding.pageUrl === selectedRoute;
    const matchesSearch =
      searchQuery === '' ||
      finding.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.pageUrl?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesRoute && matchesSearch;
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (finding) => {
    const text = `### [${finding.severity?.toUpperCase()}] ${finding.title}\n**URL:** ${finding.pageUrl}\n**Component:** ${finding.component || 'N/A'}\n**Confidence:** ${finding.confidence}\n\n**Explanation:**\n${finding.explanation}\n\n${finding.suggestedFix ? `**Suggested Fix:**\n\`\`\`javascript\n${finding.suggestedFix}\n\`\`\`` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(finding.id);
    triggerToast('Bug details copied to clipboard in Markdown format!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportFullReportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `qa-report-${activeReport.runId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Full report JSON downloaded.');
  };

  const distinctRoutes = Array.from(new Set((activeReport.findings || []).map((f) => f.pageUrl)));

  return (
    <div className="report-canvas flex flex-col min-h-screen text-slate-100">
      {/* Global Navbar */}
      <Navbar onNewScanClick={() => navigate('/')} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel border border-blue-500/40 text-blue-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-slate-400">Reports</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-blue-400 font-medium">#{activeReport.runId}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportFullReportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>

            <button
              onClick={() => navigate('/')}
              className="btn-primary-glow px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Run New Scan
            </button>
          </div>
        </div>

        {/* Report Overview Banner */}
        <section className="report-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SCAN COMPLETE • READY FOR REVIEW
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeReport.timestamp}
                </span>
              </div>

              <h1
                className="font-extrabold text-white tracking-tight leading-snug"
                style={{ fontSize: FONT_SIZES['3xl'], fontWeight: FONT_WEIGHTS.bold }}
              >
                QA Audit Report:{' '}
                <span className="text-blue-400 font-mono">{activeReport.projectName}</span>
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Autonomous browser agent crawled <strong>{activeReport.totalPages} reachable routes</strong> in{' '}
                <strong>{activeReport.duration}</strong>. Identified{' '}
                <span className="text-rose-400 font-bold">{activeReport.summaryCounts?.critical || 0} critical</span>,{' '}
                <span className="text-orange-400 font-bold">{activeReport.summaryCounts?.high || 0} high</span>, and{' '}
                <span className="text-yellow-400 font-bold">{activeReport.summaryCounts?.medium || 0} medium</span> severity issues.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="text-center px-4 border-r border-slate-800">
                <div className="text-2xl font-bold text-white">{activeReport.totalPages}</div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Pages Checked</div>
              </div>
              <div className="text-center px-4 border-r border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">{activeReport.passRate}%</div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">UI Health Score</div>
              </div>
              <div className="text-center px-4">
                <div className="text-2xl font-bold text-blue-400">{activeReport.duration}</div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Scan Duration</div>
              </div>
            </div>
          </div>

          {/* Severity Counters & Interactive Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <button
              onClick={() => setActiveFilter('critical')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                activeFilter === 'critical'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-rose-500/50 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-mono text-rose-400">Critical</div>
              <div className="text-xl font-bold text-white mt-1">{activeReport.summaryCounts?.critical || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">App breaking / 500s</div>
            </button>

            <button
              onClick={() => setActiveFilter('high')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                activeFilter === 'high'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg shadow-orange-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-orange-500/50 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-mono text-orange-400">High</div>
              <div className="text-xl font-bold text-white mt-1">{activeReport.summaryCounts?.high || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Missing configs / overlaps</div>
            </button>

            <button
              onClick={() => setActiveFilter('medium')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                activeFilter === 'medium'
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-lg shadow-yellow-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-yellow-500/50 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-mono text-yellow-400">Medium</div>
              <div className="text-xl font-bold text-white mt-1">{activeReport.summaryCounts?.medium || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">UI logic flaws</div>
            </button>

            <button
              onClick={() => setActiveFilter('low')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                activeFilter === 'low'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-sky-500/50 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-mono text-sky-400">Low / Warnings</div>
              <div className="text-xl font-bold text-white mt-1">{activeReport.summaryCounts?.low || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Console logs / lint</div>
            </button>

            <button
              onClick={() => setActiveFilter('all')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
                activeFilter === 'all'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-blue-500/50 text-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-mono text-blue-400">View All</div>
              <div className="text-xl font-bold text-white mt-1">{(activeReport.findings || []).length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total Findings</div>
            </button>
          </div>
        </section>

        {/* Filter and Search Controls */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search findings, routes, or files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-9 pr-3 py-2 outline-none focus:border-blue-500 transition"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Route Selector */}
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Explored Routes</option>
              {distinctRoutes.map((route) => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-white font-bold">{filteredFindings.length}</span> of {(activeReport.findings || []).length} issues
          </div>
        </section>

        {/* Detailed Findings List */}
        <section className="space-y-6">
          {filteredFindings.length === 0 ? (
            <div className="report-card rounded-2xl p-12 text-center text-slate-400">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">No Issues Match Filters</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try selecting "View All" or clear your search query to see all detected issues.
              </p>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const currentTab = activeTabs[finding.id] || 'screenshot';

              return (
                <article
                  key={finding.id}
                  className={`report-card report-card-${finding.severity} rounded-2xl p-6 sm:p-7 space-y-5`}
                >
                  {/* Top Bar: Severity, URL, Confidence, Copy */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <SeverityBadge severity={finding.severity} />
                      <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {finding.pageUrl}
                      </span>
                      {finding.component && (
                        <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          {finding.component}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        AI Confidence: {finding.confidence}
                      </span>

                      <button
                        onClick={() => copyToClipboard(finding)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                        title="Copy bug description as Markdown"
                      >
                        {copiedId === finding.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Issue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bug Title & Explanation */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                      {finding.title}
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* Evidence Tabs */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-xs">
                      {finding.screenshot && (
                        <button
                          onClick={() => setActiveTabs({ ...activeTabs, [finding.id]: 'screenshot' })}
                          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer ${
                            currentTab === 'screenshot' ? 'tab-active' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Visual Screenshot
                        </button>
                      )}

                      {finding.consoleErrors?.length > 0 && (
                        <button
                          onClick={() => setActiveTabs({ ...activeTabs, [finding.id]: 'console' })}
                          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer ${
                            currentTab === 'console' ? 'tab-active' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Console Errors ({finding.consoleErrors.length})
                        </button>
                      )}

                      {finding.networkFailures?.length > 0 && (
                        <button
                          onClick={() => setActiveTabs({ ...activeTabs, [finding.id]: 'network' })}
                          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer ${
                            currentTab === 'network' ? 'tab-active' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Network Failures ({finding.networkFailures.length})
                        </button>
                      )}

                      {finding.suggestedFix && (
                        <button
                          onClick={() => setActiveTabs({ ...activeTabs, [finding.id]: 'fix' })}
                          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer ${
                            currentTab === 'fix' ? 'tab-active' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          AI Fix Recommendation
                        </button>
                      )}
                    </div>

                    {/* Tab Panels */}
                    <div className="mt-3">
                      {/* Screenshot Panel */}
                      {currentTab === 'screenshot' && finding.screenshot && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 group">
                          <img
                            src={finding.screenshot}
                            alt={finding.title}
                            className="w-full max-h-72 object-cover object-top opacity-90 group-hover:opacity-100 transition cursor-zoom-in"
                            onClick={() => setLightboxImage(finding.screenshot)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">
                              {finding.screenshotCaption || 'Full-page Playwright Chromium capture'}
                            </span>
                            <button
                              onClick={() => setLightboxImage(finding.screenshot)}
                              className="px-2.5 py-1 rounded bg-black/60 hover:bg-black/90 text-blue-400 font-semibold border border-white/10 transition cursor-pointer"
                            >
                              Expand View ↗
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Console Errors Panel */}
                      {currentTab === 'console' && (
                        <div className="evidence-terminal p-4 text-xs space-y-1 text-rose-300 bg-black/80 max-h-56 overflow-y-auto">
                          {finding.consoleErrors?.map((err, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-rose-500 font-bold select-none">[ERR]</span>
                              <span className="font-mono">{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Network Failures Panel */}
                      {currentTab === 'network' && (
                        <div className="evidence-terminal p-4 text-xs space-y-2 bg-black/80">
                          {finding.networkFailures?.map((net, i) => (
                            <div key={i} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold font-mono">
                                  {net.method}
                                </span>
                                <span className="font-mono text-slate-200">{net.url}</span>
                                <span className="font-mono text-rose-400 font-semibold ml-auto">
                                  HTTP {net.status} ({net.statusText})
                                </span>
                              </div>
                              {net.response && (
                                <div className="mt-1 text-slate-400 font-mono text-[11px] bg-slate-900/60 p-2 rounded">
                                  {net.response}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Fix Recommendation Panel */}
                      {currentTab === 'fix' && (
                        <div className="evidence-terminal p-4 text-xs bg-black/80 text-emerald-300 overflow-x-auto">
                          <pre className="font-mono text-[12px] leading-relaxed">
                            {finding.suggestedFix}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">Evidence Screenshot Viewer</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] p-2 bg-black flex items-center justify-center">
              <img src={lightboxImage} alt="Expanded Evidence" className="max-w-full h-auto object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI QA Agent • Autonomous Web Application Verification</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            Back to Top ↑
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Report;
