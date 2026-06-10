
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://simakweb-be.onrender.com/api/v1';
const getAuthToken = () => localStorage.getItem('token') || '';

const fetchWrapper = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || `API Request Failed: ${response.statusText}`,
      };
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error; 
  }
};

export const AuthAPI = {
  login: (data: any) => fetchWrapper('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchWrapper('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: any) => fetchWrapper('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOtp: (data: any) => fetchWrapper('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => fetchWrapper('/users?limit=1000'),
  getMentors: () => fetchWrapper('/users?role=MENTOR&limit=1000'),
};

export const UserAPI = {
  getAll: () => fetchWrapper('/users?limit=1000'),
  getById: (id: string) => fetchWrapper(`/users/${id}`),
  create: (data: any) => fetchWrapper('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/users/${id}`, { method: 'DELETE' }),
};

export const SantriAPI = {
  getAll: () => fetchWrapper('/user-profile?role=SANTRI&limit=1000'),
  getById: (id: string) => fetchWrapper(`/user-profile/${id}`),
  create: (data: any) => fetchWrapper('/user-profile', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  update: (id: string, data: any) => fetchWrapper(`/user-profile/${id}`, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  assignToClass: (santriProfileId: string, classId: string) => fetchWrapper(`/user-profile/${santriProfileId}`, { method: 'PUT', body: JSON.stringify({ classId }) }),
  removeFromClass: (santriProfileId: string) => fetchWrapper(`/user-profile/${santriProfileId}`, { method: 'PUT', body: JSON.stringify({ classId: null }) }),
  delete: (id: string) => fetchWrapper(`/user-profile/${id}`, { method: 'DELETE' }),
};

export const WaliAPI = {
  getAll: () => fetchWrapper('/wali-santri?limit=1000'),
  getById: (id: string) => fetchWrapper(`/wali-santri/${id}`),
  create: (data: any) => fetchWrapper('/wali-santri', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  update: (id: string, data: any) => fetchWrapper(`/wali-santri/${id}`, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  delete: (id: string) => fetchWrapper(`/wali-santri/${id}`, { method: 'DELETE' }),
};

export const RelasiAPI = {
  getAll: () => fetchWrapper('/relasi?limit=1000'),
  create: (data: { waliId: string; santriId: string; category: string }) => 
    fetchWrapper('/relasi', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { category: string }) => fetchWrapper(`/relasi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/relasi/${id}`, { method: 'DELETE' }),
};

export const DivisiAPI = {
  getAll: () => fetchWrapper('/divisions?limit=1000'),
  create: (data: any) => fetchWrapper('/divisions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/divisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/divisions/${id}`, { method: 'DELETE' }),
};

export const ClassAPI = {
  getAll: () => fetchWrapper('/classes?limit=1000'),
  getById: (id: string) => fetchWrapper(`/classes/${id}`),
  getByDivisi: (divisiId: string) => fetchWrapper(`/divisions/${divisiId}/classes`),
  create: (data: any) => fetchWrapper('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/classes/${id}`, { method: 'DELETE' }),
  assignSantri: (classId: string, santriId: string) => fetchWrapper('/classes/assign-santri', { method: 'POST', body: JSON.stringify({ classId, santriId }) }),
  removeSantri: (santriProfileId: string) => fetchWrapper(`/user-profile/${santriProfileId}`, { method: 'PUT', body: JSON.stringify({ classId: null }) }),
};

export const AttendanceAPI = {
  getAll: () => fetchWrapper('/attendances?limit=1000'),
  getById: (id: string) => fetchWrapper(`/attendances/${id}`),
  submitAttendance: (data: any) => fetchWrapper('/attendances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/attendances/${id}`, { method: 'DELETE' }),
  getByClass: (classId: string) => fetchWrapper(`/classes/${classId}/attendances`),
  getBySantri: (santriId: string) => fetchWrapper(`/santri/${santriId}/attendances`),
};

export const DailyJournalAPI = {
  getAll: () => fetchWrapper('/daily-journal?limit=1000'),
  getById: (id: string) => fetchWrapper(`/daily-journal/${id}`),
  create: (data: any) => fetchWrapper('/daily-journal', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/daily-journal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/daily-journal/${id}`, { method: 'DELETE' }),
};

export const ScoreAPI = {
  getAll: () => fetchWrapper('/monthly-evaluation?limit=1000'),
  getById: (id: string) => fetchWrapper(`/monthly-evaluation/${id}`),
  create: (data: any) => fetchWrapper('/monthly-evaluation', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/monthly-evaluation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/monthly-evaluation/${id}`, { method: 'DELETE' }),
};

export const AssignmentAPI = {
  getAll: () => fetchWrapper('/assignments?limit=1000'),
  getById: (id: string) => fetchWrapper(`/assignments/${id}`),
  create: (data: any) => fetchWrapper('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWrapper(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWrapper(`/assignments/${id}`, { method: 'DELETE' }),
  getByClass: (classId: string) => fetchWrapper(`/classes/${classId}/assignments`),
};

export const SubmissionAPI = {
  getAll: () => fetchWrapper(`/submissions?limit=1000`),
  getById: (id: string) => fetchWrapper(`/submissions/${id}`),
  submitTask: (data: any) => fetchWrapper(`/submissions`, { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (submissionId: string, payload: { score: number; mentorFeedback: string; status: string }) => 
    fetchWrapper(`/submissions/${submissionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => fetchWrapper(`/submissions/${id}`, { method: 'DELETE' })
};

export default {
  AuthAPI,
  SantriAPI,
  WaliAPI,
  RelasiAPI,
  DivisiAPI,
  ClassAPI,
  AttendanceAPI,
  AssignmentAPI,
  SubmissionAPI,
  DailyJournalAPI,
  ScoreAPI,
  UserAPI,
};
