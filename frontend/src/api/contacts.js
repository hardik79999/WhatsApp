// Created by: Master Fix Pass

import { apiClient } from './client';
import { validatePhone } from '../utils/validators';

export async function getContacts() {
  const { data } = await apiClient.get('/contacts/');
  return data;
}

export async function syncContact(phone, name = null) {
  const validation = validatePhone(phone);
  if (!validation.valid) throw new Error(validation.error);
  const { data } = await apiClient.post('/contacts/sync-single', {
    phone: validation.value,
    name,
  });
  return data;
}
