// Created by: Master Fix Pass

import { apiClient } from './client';
import { isValidUuid, validateGroupName } from '../utils/validators';

function assertUuid(value, label) {
  if (!isValidUuid(value)) throw new Error(`${label} invalid hai`);
}

export async function getChats() {
  const { data } = await apiClient.get('/chats/');
  return data;
}

export async function createChat(userId) {
  assertUuid(userId, 'User ID');
  const { data } = await apiClient.post('/chats/', { contact_id: userId });
  return data;
}

export async function createGroup(data) {
  const name = validateGroupName(data?.group_name);
  if (!name.valid) throw new Error(name.error);
  const participantIds = data?.participant_ids || [];
  if (!participantIds.length) throw new Error('At least one participant select karo');
  participantIds.forEach((id) => assertUuid(id, 'Participant ID'));
  const { data: response } = await apiClient.post('/groups/create', {
    ...data,
    group_name: name.value,
    participant_ids: [...new Set(participantIds)],
  });
  return response;
}

export async function updateGroup(chatId, data) {
  assertUuid(chatId, 'Chat ID');
  if (data?.group_name !== undefined) {
    const name = validateGroupName(data.group_name);
    if (!name.valid) throw new Error(name.error);
    data = { ...data, group_name: name.value };
  }
  const { data: response } = await apiClient.put(`/chats/${chatId}/info`, data);
  return response;
}

export async function addParticipant(chatId, userId) {
  assertUuid(chatId, 'Chat ID');
  assertUuid(userId, 'User ID');
  const { data } = await apiClient.post(`/groups/${chatId}/add-members`, { member_ids: [userId] });
  return data;
}

export async function removeParticipant(chatId, userId) {
  assertUuid(chatId, 'Chat ID');
  assertUuid(userId, 'User ID');
  const { data } = await apiClient.delete(`/groups/${chatId}/remove-member/${userId}`);
  return data;
}
