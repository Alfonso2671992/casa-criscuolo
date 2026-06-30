export interface Expense {
  _k?: string;
  n: string;
  a: number;
  c: string;
  dt: string | null;
  sc: string | null;
  payer: string;
  half: number | null;
  s: 'da' | 'ok';
  paidAt?: string;
  ts: number;
}

export interface WishItem {
  _k?: string;
  n: string;
  c: string;
  d: string;
  l: string;
  bgt: number | null;
  p: string | null;
  ts: number;
}

export interface Misura {
  _k?: string;
  n: string;
  d: string;
  l: number | null;
  w: number | null;
  h: number | null;
  note: string;
  p: string | null;
  ts: number;
}

export interface AcquistoItem {
  _k?: string;
  n: string;
  c: string;
  qta: string;
  ts: number;
}

export type TabId = 'spese' | 'acquisto' | 'casa' | 'misure';

export interface Names {
  p1: string;
  p2: string;
}

export type ModalState = 
  | { type: 'misura-edit'; misura: Misura }
  | { type: 'expense-edit'; expense: Expense }
  | { type: 'wish-edit'; wish: WishItem }
  | { type: 'confirm'; message: string; onConfirm: () => void; onCancel: () => void }
  | { type: 'settings' }
  | { type: 'svuota'; cat: string; onConfirm: () => void; onCancel: () => void }
  | null;

export interface Category {
  id: string;
  label: string;
  color: string;
  bg: string;
  svg: string;
}
