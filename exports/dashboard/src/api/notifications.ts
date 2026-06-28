import { createApiClient, type ApiClientOptions } from './http';

type NotificationLogStatus = 'queued' | 'sent' | 'failed';

interface ApiNotificationLog {
  id: number | string;
  event: string;
  channel: string;
  recipient: string;
  subject?: string | null;
  message: string;
  status: NotificationLogStatus;
  queued_at?: string | null;
  sent_at?: string | null;
  order?: { id: number | string; number: string } | null;
}

interface ApiNotificationLogResponse {
  data: ApiNotificationLog[];
  summary: {
    queued: number;
    sent: number;
    failed: number;
  };
}

interface ApiNotificationProcessResponse {
  summary: {
    processed: number;
    sent: number;
    failed: number;
  };
}

export interface NotificationLogRecord {
  id: string;
  event: string;
  channel: string;
  recipient: string;
  subject: string;
  message: string;
  status: NotificationLogStatus;
  queuedAt: string;
  sentAt: string;
  orderNumber: string;
}

function mapNotificationLogFromApi(log: ApiNotificationLog): NotificationLogRecord {
  return {
    id: String(log.id),
    event: log.event,
    channel: log.channel,
    recipient: log.recipient,
    subject: log.subject ?? '',
    message: log.message,
    status: log.status,
    queuedAt: log.queued_at ?? '',
    sentAt: log.sent_at ?? '',
    orderNumber: log.order?.number ?? '',
  };
}

export async function fetchNotificationLogs(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<ApiNotificationLogResponse>('/notifications/logs');

  return {
    logs: response.data.map(mapNotificationLogFromApi),
    summary: response.summary,
  };
}

export async function updateNotificationLogStatus(id: string, status: NotificationLogStatus, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiNotificationLog }>(`/notifications/logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  return mapNotificationLogFromApi(response.data);
}

export async function retryNotificationLog(id: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiNotificationLog }>(`/notifications/logs/${id}/retry`, {
    method: 'POST',
  });

  return mapNotificationLogFromApi(response.data);
}

export async function processNotificationQueue(limit = 25, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<ApiNotificationProcessResponse>('/notifications/process', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });

  return response.summary;
}

export async function queueTestNotification(channel: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiNotificationLog }>('/notifications/test-send', {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });

  return mapNotificationLogFromApi(response.data);
}
