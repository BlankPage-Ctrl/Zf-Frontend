import { request } from './client.js';

export type ProviderType = 'openai' | 'openai-compatible';

export interface ProviderDto {
  name: string;
  type: ProviderType;
  apiKey?: string;
  baseURL?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  apiKey?: string;
  baseURL?: string;
  models: Model[];
  createdAt: string;
  updatedAt: string;
}

export interface ModelDto {
  modelId: string;
  displayName?: string;
}

export interface Model {
  id: string;
  modelId: string;
  displayName?: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export const providersApi = {
  list: () => request<Provider[]>('/providers'),
  get: (id: string) => request<Provider>(`/providers/${id}`),
  create: (dto: ProviderDto) => request<Provider>('/providers', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: Partial<ProviderDto>) => request<Provider>(`/providers/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => request<void>(`/providers/${id}`, { method: 'DELETE' }),
};

export const modelsApi = {
  list: (providerId: string) => request<Model[]>(`/providers/${providerId}/models`),
  create: (providerId: string, dto: ModelDto) => request<Model>(`/providers/${providerId}/models`, { method: 'POST', body: JSON.stringify(dto) }),
  update: (providerId: string, modelId: string, dto: Partial<ModelDto>) => request<Model>(`/providers/${providerId}/models/${modelId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (providerId: string, modelId: string) => request<void>(`/providers/${providerId}/models/${modelId}`, { method: 'DELETE' }),
};
