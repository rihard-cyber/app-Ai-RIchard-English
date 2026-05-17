import { apiFetch } from './apiClient';

export const fetchGeminiWithRotation = async (payload) => apiFetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify(payload),
});
