// Created by: Master Fix Pass

import { apiClient } from './client';
import { isValidUuid } from '../utils/validators';

function assertUuid(value, label) {
  if (!isValidUuid(value)) throw new Error(`${label} invalid hai`);
}

export async function addReaction(messageId, reaction) {
  assertUuid(messageId, 'Message ID');
  if (!String(reaction || '').trim()) throw new Error('Reaction required hai');
  const { data } = await apiClient.post('/reactions/', { message_id: messageId, reaction });
  return data;
}

export async function removeReaction(messageId) {
  assertUuid(messageId, 'Message ID');
  const { data } = await apiClient.delete(`/reactions/${messageId}`);
  return data;
}

export async function getReactions(messageId) {
  assertUuid(messageId, 'Message ID');
  const { data } = await apiClient.get(`/reactions/${messageId}`);
  return data;
}
