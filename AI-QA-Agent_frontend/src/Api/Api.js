import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Upload project zip and initiate autonomous scan
 */
export const uploadProject = async ({ file, description, credentials, isSample }) => {
  const formData = new FormData();
  if (file && !isSample) {
    formData.append('file', file);
  }
  if (description) {
    formData.append('description', description);
  }
  if (credentials) {
    formData.append('test_username', credentials.username || '');
    formData.append('test_password', credentials.password || '');
  }
  if (isSample) {
    formData.append('is_sample', 'true');
  }

  try {
    const response = await client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // { run_id: "...", status: "queued" }
  } catch (error) {
    // If backend is not running yet during development/demo, generate a mock fallback run_id
    console.warn('Backend unavailable, falling back to local simulation mode:', error.message);
    return {
      run_id: 'scan-' + Math.random().toString(36).substring(2, 9),
      status: 'queued',
      is_simulated: true,
    };
  }
};

/**
 * Poll current status of a scan
 */
export const getScanStatus = async (runId) => {
  try {
    const response = await client.get(`/scan/${runId}`);
    return response.data;
  } catch (error) {
    console.warn('Backend poll unavailable:', error.message);
    return {
      run_id: runId,
      status: 'running',
      progress_pct: 65,
      current_step: 'Playwright browser agent exploring routes...',
    };
  }
};

/**
 * Fetch complete report for a finished scan
 */
export const getReport = async (runId) => {
  try {
    const response = await client.get(`/reports/${runId}`);
    return response.data;
  } catch (error) {
    console.warn('Backend report fetch unavailable:', error.message);
    return null;
  }
};

/**
 * Fetch recent scan history
 */
export const getRecentScans = async () => {
  try {
    const response = await client.get('/reports');
    return response.data || [];
  } catch (error) {
    console.warn('Backend recent scans unavailable:', error.message);
    return [];
  }
};

export default {
  uploadProject,
  getScanStatus,
  getReport,
  getRecentScans,
};

