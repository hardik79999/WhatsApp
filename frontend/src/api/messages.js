// Created by: Master Fix Pass

import { apiClient } from './client';
import { isValidUuid, validateMessage } from '../utils/validators';

function assertUuid(value, label) {
  if (!isValidUuid(value)) throw new Error(`${label} invalid hai`);
}

export async function getMessages(chatId, page = 1, limit = 50) {
  assertUuid(chatId, 'Chat ID');
  const { data } = await apiClient.get(`/messages/${chatId}`, { params: { page, limit } });
  return data;
}

export async function sendMessage(data) {
  assertUuid(data?.chat_id, 'Chat ID');
  if (!data?.media_url) {
    const message = validateMessage(data?.content);
    if (!message.valid) throw new Error(message.error);
    data = { ...data, content: message.value };
  }
  const { data: response } = await apiClient.post('/messages/', data);
  return response;
}

export async function deleteMessage(messageId, options = {}) {
  assertUuid(messageId, 'Message ID');
  const { data } = await apiClient.delete(`/messages/${messageId}`, {
    params: { delete_for_everyone: Boolean(options.deleteForEveryone) },
  });
  return data;
}
