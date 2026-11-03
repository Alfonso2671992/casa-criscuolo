import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

const push = vi.hoisted(() => ({
  pushSupport: vi.fn(),
  pushEnabled: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  sendTestPush: vi.fn(),
}));
vi.mock('$lib/push', () => push);
vi.mock('$lib/firebase-client', () => ({ auth: { currentUser: { email: 'a@b.it' } }, logout: vi.fn() }));

const { default: SettingsModal } = await import('./SettingsModal.svelte');

let target: HTMLElement;
let cmp: Record<string, unknown>;

const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); flushSync(); };
const sw = () => target.querySelector('[role="switch"]') as HTMLButtonElement;
const testBtn = () => [...target.querySelectorAll('button')].find(b => b.textContent?.includes('Invia notifica di prova'));

async function open(support: string, enabled = false) {
  push.pushSupport.mockResolvedValue(support);
  push.pushEnabled.mockReturnValue(enabled);
  cmp = mount(SettingsModal, { target, props: { onClose: () => {} } });
  await tick();
}

beforeEach(() => {
  vi.clearAllMocks();
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
});
