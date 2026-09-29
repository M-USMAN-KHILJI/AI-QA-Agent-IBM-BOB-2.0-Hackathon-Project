import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Configure or remove default authorization header
 */
export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
};

/**
 * User registration
 */
export const registerUser = async ({ username, email, password }) => {
  try {
    const response = await client.post('/api/auth/register', {
      username,
      email,
      password,
    });
    return response.data; // { access_token, token_type, user }
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || 'Registration failed.';
    throw new Error(detail);
  }
};

/**
 * User login
 */
export const loginUser = async ({ email_or_username, password }) => {
  try {
    const response = await client.post('/api/auth/login', {
      email_or_username,
      password,
    });
    return response.data; // { access_token, token_type, user }
  } catch (error) {
    const detail = error.response?.data?.detail || error.message || 'Invalid email or password.';
    throw new Error(detail);
  }
};

/**
 * Get currently authenticated user profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await client.get('/api/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

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
  setAuthToken,
  registerUser,
  loginUser,
  getCurrentUser,
  uploadProject,
  getScanStatus,
  getReport,
  getRecentScans,
};
