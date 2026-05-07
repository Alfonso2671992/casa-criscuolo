import type { Category } from './types';

export const CATS: Category[] = [
  {id:'luce',label:'Luce',color:'#B07A10',bg:'#FEF3C7',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.4-1.2 4.5-3 5.7V17H8v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 017-7z"/></svg>`},
  {id:'acqua',label:'Acqua',color:'#1565C0',bg:'#E3F2FD',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`},
  {id:'gas',label:'Gas',color:'#E65100',bg:'#FFF3E0',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-3.13 9-7 0-2-1-3.5-2.5-4.5C17 9 15 7 15 4c-1.5 1-3 3.5-3 5.5 0-2-1-4-3-5.5C9 7 7 9 6.5 10.5 5 11.5 3 13 3 15c0 3.87 4.03 7 9 7z"/></svg>`},
  {id:'spesa',label:'Spesa',color:'#2E7D32',bg:'#E8F5E9',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`},
  {id:'uscite',label:'Uscite',color:'#7B1FA2',bg:'#F3E5F5',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`},
  {id:'regali',label:'Regali',color:'#C2185B',bg:'#FCE4EC',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`},
  {id:'condominio',label:'Condominio',color:'#5D4037',bg:'#EFEBE9',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="1"/><path d="M8 3v18M16 3v18M2 9h20M2 15h20"/></svg>`},
  {id:'altro',label:'Altro',color:'#6B7280',bg:'#F3F4F6',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
];

export const CASA_CATS: Category[] = [
  {id:'Lampada',label:'Lampada',color:'#B07A10',bg:'#FEF3C7',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.4-1.2 4.5-3 5.7V17H8v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 017-7z"/></svg>`},
  {id:'Quadro',label:'Quadro',color:'#6D4C41',bg:'#EFEBE9',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`},
  {id:'Mobile',label:'Mobile',color:'#5D4037',bg:'#EFEBE9',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20M12 4v16"/></svg>`},
  {id:'Tappeto',label:'Tappeto',color:'#C4622D',bg:'#FDF0E6',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M3 14h18M7 6v12M17 6v12"/></svg>`},
  {id:'Divano',label:'Divano',color:'#7B1FA2',bg:'#F3E5F5',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2"/><path d="M2 11a2 2 0 014 0v2h12v-2a2 2 0 014 0v4H2v-4z"/><path d="M6 19v2M18 19v2"/></svg>`},
  {id:'Altro',label:'Altro',color:'#6B7280',bg:'#F3F4F6',svg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
];

export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
export const DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
export const BOLLETTE_IDS = ['luce','acqua','gas'];
export const ROOT = 'casa_criscuolo';
