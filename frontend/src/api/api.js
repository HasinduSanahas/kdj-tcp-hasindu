// src/api/api.js — Centralised Axios API client
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Modules (Registry) ────────────────────────
export const getAllModules    = () => api.get('/modules');
export const getAttachedModules = () => api.get('/modules/attached');
export const attachModule    = (key) => api.post(`/modules/${key}/attach`);
export const detachModule    = (key) => api.post(`/modules/${key}/detach`);
export const getSubscriptions = () => api.get('/modules/debug/subscriptions');

// ── Students (Core) ───────────────────────────
export const getStudents     = () => api.get('/students');
export const getStudent      = (id) => api.get(`/students/${id}`);
export const createStudent   = (data) => api.post('/students', data);
export const updateStudent   = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent   = (id) => api.delete(`/students/${id}`);
export const enrollStudent   = (id, classId) => api.post(`/students/${id}/enroll`, { class_id: classId });

// ── Attendance Module ─────────────────────────
export const openSession     = (classId) => api.post('/attendance/sessions', { class_id: classId });
export const checkIn         = (sessionId, studentId, method = 'qr') =>
  api.post('/attendance/checkin', { session_id: sessionId, student_id: studentId, method });
export const getSessionLogs  = (sessionId) => api.get(`/attendance/sessions/${sessionId}/logs`);
export const closeSession    = (sessionId) => api.post(`/attendance/sessions/${sessionId}/close`);

// ── Groq AI Module ────────────────────────────
export const testGroqApi     = () => api.get('/ai/test-groq');
export const getAIJobs       = () => api.get('/ai/jobs');
export const triggerAIReport = (studentId, classId) =>
  api.post(`/ai/trigger/${studentId}`, { classId });

export default api;
