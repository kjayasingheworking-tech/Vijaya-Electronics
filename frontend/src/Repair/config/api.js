// Repair module API configuration
// Uses the main backend server with /api/repair prefix

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const REPAIR_API = {
  TECHNICIANS: `${API_BASE_URL}/api/repair/technicians`,
  JOBS: `${API_BASE_URL}/api/repair/jobs`,
  NOTIFICATIONS: `${API_BASE_URL}/api/repair/notifications`,
};

export default REPAIR_API;
