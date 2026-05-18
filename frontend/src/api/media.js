// Created by: Master Fix Pass

import { apiClient } from './client';
import { validateFileUpload } from '../utils/validators';

export async function uploadMedia(file, onProgress) {
  const validation = validateFileUpload(file);
  if (!validation.valid) throw new Error(validation.error);

  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });
  return data;
}

export async function deleteMedia(folder, filename) {
  if (!folder || !filename) throw new Error('Media path invalid hai');
  await apiClient.delete(`/media/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`);
}
