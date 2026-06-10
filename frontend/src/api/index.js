import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  registerStudent: (data) => api.post('/auth/register/student', data),
  registerCompany: (data) => api.post('/auth/register/company', data),
  registerTrainer: (data) => api.post('/auth/register/trainer', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  getNotifications: () => api.get('/auth/notifications'),
  markNotificationsRead: () => api.put('/auth/notifications/read')
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.put('/students/profile', data),
  getDashboard: () => api.get('/students/dashboard'),
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  delete: (id) => api.delete(`/students/${id}`)
};

// Company API
export const companyAPI = {
  getProfile: () => api.get('/companies/profile'),
  updateProfile: (data) => api.put('/companies/profile', data),
  getDashboard: () => api.get('/companies/dashboard'),
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  verify: (id) => api.put(`/companies/${id}/verify`),
  delete: (id) => api.delete(`/companies/${id}`)
};

// Job API
export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  approve: (id) => api.put(`/jobs/${id}/approve`),
  getMyJobs: () => api.get('/jobs/my-jobs')
};

// Application API
export const applicationAPI = {
  apply: (jobId, data) => api.post(`/applications/apply/${jobId}`, data),
  getMyApplications: (params) => api.get('/applications/my', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  getCompanyApplications: (params) => api.get('/applications/company', { params }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  withdraw: (id) => api.put(`/applications/${id}/withdraw`),
  getAll: (params) => api.get('/applications', { params })
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  approveUser: (id) => api.put(`/admin/approve/${id}`),
  rejectUser: (id, data) => api.put(`/admin/reject/${id}`, data),
  toggleStatus: (id) => api.put(`/admin/toggle-status/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  assignTrainer: (data) => api.post('/admin/assign-trainer', data),
  getPlacementStats: () => api.get('/admin/placement-stats')
};

// Trainer API
export const trainerAPI = {
  getProfile: () => api.get('/trainers/profile'),
  updateProfile: (data) => api.put('/trainers/profile', data),
  getDashboard: () => api.get('/trainers/dashboard'),
  getStudents: (params) => api.get('/trainers/students', { params }),
  updateReadiness: (studentId, data) => api.put(`/trainers/students/${studentId}/readiness`, data),
  getAll: () => api.get('/trainers'),
  getById: (id) => api.get(`/trainers/${id}`)
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics')
};

// Upload API
export const uploadAPI = {
  uploadResume: (formData) => api.post('/upload/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCertificate: (formData) => api.post('/upload/certificate', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProfilePic: (formData) => api.post('/upload/profile-pic', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};
