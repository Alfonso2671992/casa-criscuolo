import { describe, it, expect } from 'vitest';
import { CATS, CASA_CATS, MONTHS, DAYS, BOLLETTE_IDS, ROOT } from './constants';

describe('CATS', () => {
  it('has 8 categories', () => {
    expect(CATS).toHaveLength(8);
  });
  it('each has required fields', () => {
    for (const c of CATS) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.svg).toContain('<svg');
    }
  });
  it('includes "altro" as last', () => {
    expect(CATS[CATS.length - 1].id).toBe('altro');
  });
});

describe('CASA_CATS', () => {
  it('has 6 categories', () => {
    expect(CASA_CATS).toHaveLength(6);
  });
  it('each has required fields', () => {
    for (const c of CASA_CATS) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.svg).toContain('<svg');
    }
  });
});

describe('MONTHS', () => {
  it('has 12 months', () => expect(MONTHS).toHaveLength(12));
  it('starts with Gennaio', () => expect(MONTHS[0]).toBe('Gennaio'));
  it('ends with Dicembre', () => expect(MONTHS[11]).toBe('Dicembre'));
});

describe('DAYS', () => {
  it('has 7 days', () => expect(DAYS).toHaveLength(7));
  it('starts with Lu', () => expect(DAYS[0]).toBe('Lu'));
});

describe('BOLLETTE_IDS', () => {
  it('has 4 ids', () => expect(BOLLETTE_IDS).toHaveLength(4));
  it('includes luce, acqua, gas, condominio', () => {
    expect(BOLLETTE_IDS).toContain('luce');
    expect(BOLLETTE_IDS).toContain('acqua');
    expect(BOLLETTE_IDS).toContain('gas');
    expect(BOLLETTE_IDS).toContain('condominio');
  });
});

describe('ROOT', () => {
  it('is casa_criscuolo', () => expect(ROOT).toBe('casa_criscuolo'));
});
