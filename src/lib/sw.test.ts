import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const code = readFileSync(resolve(__dirname, '../../static/firebase-messaging-sw.js'), 'utf8');

type Handler = (e: any) => void;
let handlers: Record<string, Handler>;
let self: any;

function load(clients: any[] = []) {
  handlers = {};
  self = {
    location: { origin: 'https://casa.test' },
    addEventListener: (t: string, h: Handler) => { handlers[t] = h; },
    skipWaiting: vi.fn(),
    registration: { showNotification: vi.fn().mockResolvedValue(undefined) },
    clients: {
      claim: vi.fn().mockResolvedValue(undefined),
      matchAll: vi.fn().mockResolvedValue(clients),
      openWindow: vi.fn().mockResolvedValue(undefined),
    },
  };
  new Function('self', code)(self);
}

async function fire(type: string, e: any) {
  let p: Promise<unknown> | undefined;
  handlers[type]({ ...e, waitUntil: (x: Promise<unknown>) => { p = x; } });
  await p;
}

beforeEach(() => load());

describe('service worker', () => {
  it('takes over promptly', async () => {
    handlers.install({});
    expect(self.skipWaiting).toHaveBeenCalled();
    await fire('activate', {});
    expect(self.clients.claim).toHaveBeenCalled();
  });

  it('always shows the notification from an FCM data payload', async () => {
    const data = { json: () => ({ data: { title: 'Spesa da pagare', body: 'B', link: 'https://casa.test/?tab=spese' }, from: 'x' }) };
    await fire('push', { data });
    expect(self.registration.showNotification).toHaveBeenCalledWith('Spesa da pagare', {
      body: 'B', icon: '/icon-192.png', badge: '/icon-192.png', data: { link: 'https://casa.test/?tab=spese' },
    });
  });

  it('accepts top-level and notification payloads, and shows something on garbage', async () => {
    await fire('push', { data: { json: () => ({ title: 'T', body: 'B', link: '/x' }) } });
    expect(self.registration.showNotification.mock.lastCall[0]).toBe('T');
    await fire('push', { data: { json: () => ({ notification: { title: 'N', body: 'NB' } }) } });
    expect(self.registration.showNotification.mock.lastCall[0]).toBe('N');
    await fire('push', { data: { json: () => { throw new Error('bad'); } } });
    expect(self.registration.showNotification).toHaveBeenCalledTimes(3);
  });

  it('focuses an open window and asks it to switch tab', async () => {
    const client = { url: 'https://casa.test/', focus: vi.fn().mockResolvedValue(undefined), postMessage: vi.fn() };
    load([{ url: 'https://other.test/', focus: vi.fn(), postMessage: vi.fn() }, client]);
    const notification = { close: vi.fn(), data: { link: 'https://casa.test/?tab=acquisto' } };
    await fire('notificationclick', { notification });
    expect(notification.close).toHaveBeenCalled();
    expect(self.clients.matchAll).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
    expect(client.focus).toHaveBeenCalled();
    expect(client.postMessage).toHaveBeenCalledWith({ type: 'open-tab', link: 'https://casa.test/?tab=acquisto' });
    expect(self.clients.openWindow).not.toHaveBeenCalled();
  });

  it('opens a new window when the app is not running', async () => {
    const notification = { close: vi.fn(), data: { link: 'https://casa.test/?tab=spese' } };
    await fire('notificationclick', { notification });
    expect(self.clients.openWindow).toHaveBeenCalledWith('https://casa.test/?tab=spese');
  });
});
