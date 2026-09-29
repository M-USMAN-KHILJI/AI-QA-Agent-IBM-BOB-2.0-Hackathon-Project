import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../Const/Display';
import { useAuth } from '../Context/AuthContext';

export const UploadCard = ({ onStartScan }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [showAuthFields, setShowAuthFields] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File selection validation (50MB compressed limit)
  const handleFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('Please upload a valid .zip archive of your project.');
      return;
    }

    const maxBytes = 50 * 1024 * 1024; // 50MB limit
    if (file.size > maxBytes) {
      setErrorMsg(`File exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please compress only source code.`);
      return;
    }

    setSelectedFile(file);
  };

  // Intercept click to browse if user is not logged in
  const handleBrowseClick = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: 'upload',
          message: 'Please sign in to your account before uploading and testing your project code.',
        },
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: 'upload',
          message: 'Please sign in to your account before uploading and testing your project code.',
        },
      });
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleProject = () => {
    setErrorMsg('');
    // Create a mock sample project bundle indicator
    setSelectedFile({
      name: 'ecommerce-cart-app-sample.zip',
      size: 14.2 * 1024 * 1024,
      isSample: true,
    });
    setProjectDescription('Sample E-commerce store: User browses product catalog, clicks item, adds to cart, modifies quantity, and attempts checkout.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a .zip project file or click "Try with a sample project".');
      return;
    }

    // Auth gate for uploaded custom files
    if (!isAuthenticated && !selectedFile.isSample) {
      navigate('/login', {
        state: {
          from: 'upload',
          message: 'Please sign in to run autonomous test scans on your project.',
        },
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (onStartScan) {
        await onStartScan({
          file: selectedFile,
          description: projectDescription,
          credentials: showAuthFields ? credentials : null,
          isSample: selectedFile.isSample || false,
        });
      } else {
        const mockRunId = 'scan-' + Math.random().toString(36).substring(2, 9);
        navigate(`/scan/${mockRunId}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate scan. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2
            className="font-bold text-white tracking-tight flex items-center gap-2.5"
            style={{ fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold }}
          >
            <span>Launch Autonomous QA Agent</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
              FastAPI + React Sandbox
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload your project code to spin up in an isolated Docker sandbox. Playwright AI agent will autonomously explore and detect bugs.
          </p>
        </div>

        {/* Try with sample project button */}
        <button
          type="button"
          onClick={handleSampleProject}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition shadow-sm hover:shadow-purple-500/20 cursor-pointer whitespace-nowrap"
        >
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Try with Sample Project
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Dropzone with Auth Protection */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'dropzone-active'
              : selectedFile
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div className="flex flex-col items-center justify-center gap-3">
            {selectedFile ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    {selectedFile.name}
                    {selectedFile.isSample && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-mono">
                        Demo Project
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Sandbox Injection
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition ml-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    <span className="text-blue-400 font-semibold hover:underline">
                      Click to browse
                    </span>{' '}
                    or drag and drop your project .zip
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Must contain React frontend and/or FastAPI backend (Max 50MB compressed)
                  </p>
                  {!isAuthenticated && (
                    <p className="text-[11px] font-mono text-purple-400/90 mt-2 bg-purple-500/10 py-0.5 px-2.5 rounded-full inline-block border border-purple-500/20">
                      🔒 Authentication required to upload • Click to Sign In
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Project Description (Guides the Vision LLM & Browser Agent) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target User Flows & App Description <span className="text-slate-400 font-normal">(Recommended)</span>
          </label>
          <textarea
            rows="3"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="e.g. User navigates from Home to Catalog, clicks 'Add to Cart', opens cart drawer, changes quantity, and tests checkout button..."
            className="w-full rounded-xl bg-slate-900/60 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-200 placeholder-slate-400 p-3.5 outline-none transition"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            This context directs the Playwright agent's interaction priority and prevents false-positive visual alerts.
          </p>
        </div>

        {/* Optional Credentials Accordion */}
        <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/20">
          <button
            type="button"
            onClick={() => setShowAuthFields(!showAuthFields)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Test Credentials (For apps with Auth walls)</span>
            </div>
            <span className="text-slate-400 text-xs">{showAuthFields ? 'Hide ▲' : 'Provide Credentials ▼'}</span>
          </button>

          {showAuthFields && (
            <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/60">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Test Username / Email</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="demo@example.com"
                  className="w-full rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Test Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <p className="col-span-full text-[11px] text-slate-400">
                Credentials are saved only in an isolated per-scan memory block and automatically purged immediately upon test completion.
              </p>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submission Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Security: 512MB RAM cap • Non-root execution</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className={`btn-primary-glow px-6 py-3 rounded-xl font-semibold text-sm text-white flex items-center gap-2.5 transition ${
              isSubmitting || !selectedFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Initializing Sandbox...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Start Autonomous QA Scan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadCard;
