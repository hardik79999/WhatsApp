// Created by: Master Fix Pass

import { apiClient } from './client';
import { validateOtp, validatePhone } from '../utils/validators';

function assertValid(result) {
  if (!result.valid) throw new Error(result.error);
  return result.value;
}

export async function sendOtp(phone) {
  const normalizedPhone = assertValid(validatePhone(phone));
  const { data } = await apiClient.post('/auth/send-otp', { phone: normalizedPhone });
  return data;
}

export async function verifyOtp(phone, otp) {
  const normalizedPhone = assertValid(validatePhone(phone));
  const normalizedOtp = assertValid(validateOtp(otp));
  const { data } = await apiClient.post('/auth/verify-otp', {
    phone: normalizedPhone,
    otp: normalizedOtp,
  });
  if (data?.access_token) localStorage.setItem('access_token', data.access_token);
  if (data?.csrf_access_token) localStorage.setItem('csrf_access_token', data.csrf_access_token);
  if (data?.csrf_refresh_token) localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);
  return data;
}

export async function refreshToken() {
  const { data } = await apiClient.post('/auth/refresh');
  if (data?.access_token) localStorage.setItem('access_token', data.access_token);
  if (data?.csrf_access_token) localStorage.setItem('csrf_access_token', data.csrf_access_token);
  if (data?.csrf_refresh_token) localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);
  return data;
}

export async function logout() {
  const { data } = await apiClient.post('/auth/logout');
  localStorage.clear();
  sessionStorage.clear();
  return data;
}
