import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

const push = vi.hoisted(() => ({
  pushSupport: vi.fn(),
  pushEnabled: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  sendTestPush: vi.fn(),
  unregisterOnLogout: vi.fn(),
  permissionGranted: () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
}));
vi.mock('$lib/push', () => push);
const fb = vi.hoisted(() => ({ auth: { currentUser: { email: 'a@b.it' } }, logout: vi.fn() }));
vi.mock('$lib/firebase-client', () => fb);

const { default: SettingsModal } = await import('./SettingsModal.svelte');

let target: HTMLElement;
let cmp: Record<string, unknown>;

const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); flushSync(); };
const sw = () => target.querySelector('[role="switch"]') as HTMLButtonElement;
const testBtn = () => [...target.querySelectorAll('button')].find(b => b.textContent?.includes('Invia notifica di prova'));

function setPermission(p: string) {
  (globalThis as any).Notification = { permission: p };
}

async function open(support: string, enabled = false) {
  push.pushSupport.mockResolvedValue(support);
  push.pushEnabled.mockReturnValue(enabled);
  cmp = mount(SettingsModal, { target, props: { onClose: () => {} } });
  await tick();
}

beforeEach(() => {
  vi.clearAllMocks();
  setPermission('granted');
  target = document.createElement('div');
  document.body.appendChild(target);
});
afterEach(() => { unmount(cmp); target.remove(); });

describe('SettingsModal notifications', () => {
  it('disables the switch and explains when the app is not on the Home screen', async () => {
    await open('need-home');
    expect(target.textContent).toContain("Aggiungi l'app alla schermata Home");
    expect(sw().disabled).toBe(true);
  });

  it('disables the switch when unsupported', async () => {
    await open('unsupported');
    expect(target.textContent).toContain('Questo browser non supporta le notifiche');
    expect(sw().disabled).toBe(true);
  });

  it('enables push on click and shows the test button', async () => {
    push.enablePush.mockResolvedValue('on');
    await open('ok');
    sw().click();
    expect(push.enablePush).toHaveBeenCalledTimes(1);
    await tick();
    expect(sw().getAttribute('aria-checked')).toBe('true');
    expect(testBtn()).toBeTruthy();
  });

  it('shows the iPhone settings hint when permission is denied', async () => {
    push.enablePush.mockResolvedValue('denied');
    await open('ok');
    sw().click();
    await tick();
    expect(target.textContent).toContain("Impostazioni dell'iPhone");
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('disables push on click and hides the test button', async () => {
    push.disablePush.mockResolvedValue(undefined);
    await open('ok', true);
    expect(testBtn()).toBeTruthy();
    sw().click();
    expect(push.disablePush).toHaveBeenCalledTimes(1);
    await tick();
    expect(sw().getAttribute('aria-checked')).toBe('false');
    expect(testBtn()).toBeFalsy();
  });

  it('starts off when the flag is set but permission was revoked', async () => {
    setPermission('denied');
    await open('ok', true);
    expect(sw().getAttribute('aria-checked')).toBe('false');
    expect(testBtn()).toBeFalsy();
  });

  it('starts off when Notification is missing', async () => {
    delete (globalThis as any).Notification;
    await open('ok', true);
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('hides the test button when support is not ok', async () => {
    await open('unsupported', true);
    expect(testBtn()).toBeFalsy();
  });

  it('sends only one test while a send is in flight', async () => {
    let resolve!: (v: boolean) => void;
    push.sendTestPush.mockReturnValue(new Promise<boolean>(r => { resolve = r; }));
    await open('ok', true);
    testBtn()!.click();
    await tick();
    expect(testBtn()!.disabled).toBe(true);
    testBtn()!.click();
    testBtn()!.click();
    expect(push.sendTestPush).toHaveBeenCalledTimes(1);
    resolve(true);
    await tick();
    expect(testBtn()!.disabled).toBe(false);
    push.sendTestPush.mockResolvedValue(true);
    testBtn()!.click();
    expect(push.sendTestPush).toHaveBeenCalledTimes(2);
  });

  it('unregisters the device before signing out', async () => {
    push.unregisterOnLogout.mockResolvedValue(undefined);
    fb.logout.mockResolvedValue(undefined);
    await open('ok', true);
    const out = [...target.querySelectorAll('button')].find(b => b.textContent?.includes('Disconnetti'))!;
    out.click();
    await tick();
    expect(push.unregisterOnLogout).toHaveBeenCalledOnce();
    expect(fb.logout).toHaveBeenCalledOnce();
    expect(push.unregisterOnLogout.mock.invocationCallOrder[0]).toBeLessThan(fb.logout.mock.invocationCallOrder[0]);
  });
});
