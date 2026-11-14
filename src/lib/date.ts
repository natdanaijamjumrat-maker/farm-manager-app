import type { ISODate } from '../types';

export const toISO = (d: Date): ISODate => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const today = (): ISODate => toISO(new Date());
export const parse = (s: ISODate) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: ISODate, n: number): ISODate => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const diffDays = (a: ISODate, b: ISODate) =>
  Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000);

export const fmtDate = (s: ISODate, lang: 'th' | 'en', opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  s ? parse(s).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', opts) : '–';

export const monthKey = (s: ISODate) => s.slice(0, 7);
