import api from './axiosInstance';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'CLINICIAN' | 'RECEPTION' | 'ADMIN';
}

export interface Patient {
  id: number;
  recordNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  allergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  recordNumber: string;
  clinicianId: number;
  createdById: number;
  patientId: number;
  startTime: string;
  endTime: string;
  note?: string;
  status: 'PENDING' | 'COMPLETED';
  clinicianNote?: string;
  patient: Patient;
  clinician: User;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// Auth
export const register = (data: { username: string; email: string; password: string; role: string }) =>
  api.post('/auth/register', data);

export const login = (data: { username: string; password: string }) =>
  api.post('/auth/login', data);

export const resetPassword = (data: { email: string; password: string }) =>
  api.post('/auth/reset-password', data);

// Patients
export const getPatients = () => api.get<Patient[]>('/patients');
export const getPatient = (id: number) => api.get<Patient>(`/patients/${id}`);
export const createPatient = (data: Partial<Patient>) => api.post<Patient>('/patients', data);
export const updatePatient = (id: number, data: Partial<Patient>) =>
  api.put<Patient>(`/patients/${id}`, data);
export const deletePatient = (id: number) => api.delete(`/patients/${id}`);

// Appointments
export const getAppointments = () => api.get<Appointment[]>('/appointments');
export const getAppointment = (id: number) => api.get<Appointment>(`/appointments/${id}`);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAppointment = (data: any) => api.post<Appointment>('/appointments', data);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateAppointment = (id: number, data: any) =>
  api.put<Appointment>(`/appointments/${id}`, data);
export const deleteAppointment = (id: number) => api.delete(`/appointments/${id}`);

// Users
export const getClinicians = () => api.get<User[]>('/users/clinicians');
