// Minimal line icon set (24px grid, 1.8 stroke). Inline so the app has no icon dependency.
const P: Record<string, string> = {
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  farm: 'M3 21V10l9-6 9 6v11M9 21v-6h6v6',
  greenhouse: 'M3 20V11a9 9 0 0 1 18 0v9M3 20h18M12 2v18M7.5 4.5V20M16.5 4.5V20',
  system: 'M4 6h16M4 12h16M4 18h16M7 6v.01M11 12v.01M15 18v.01',
  crop: 'M12 21V11M12 11C12 6 8 3 4 3c0 5 3 8 8 8zM12 13c0-4 3-7 8-7 0 4-3 7-8 7z',
  batch: 'M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4',
  log: 'M8 3h8l4 4v14H4V3h4M8 3v4h8V3M8 12h8M8 16h5',
  water: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  env: 'M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z',
  photo: 'M3 6h4l2-2h6l2 2h4v14H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  harvest: 'M5 10h14l-1.5 10h-11zM8 10V7a4 4 0 0 1 8 0v3',
  inventory: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  money: 'M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
  analytics: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.01',
  check: 'M5 12l5 5L20 7',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  reset: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 13 2M19 9A7 7 0 0 0 6 7',
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  );
}
