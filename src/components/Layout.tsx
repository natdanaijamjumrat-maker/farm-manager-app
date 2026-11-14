import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { ROUTES, GROUPS, MOBILE_TABS, TAB_LABELS, type RouteId } from '../routes';
import { useT } from '../i18n';
import { useStore } from '../store';
import { ConfirmDialog } from './Modal';

export function Layout({ route, go, children }: { route: RouteId; go: (r: RouteId) => void; children: ReactNode }) {
  const { t, lang, setLang } = useT();
  const { loadSample, clearAll, notify, toast } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'clear' | 'reset'>(null);

  const nav = (onPick?: () => void) => (
    <nav className="nav" aria-label={t('เมนูหลัก', 'Main menu')}>
      {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
        <div key={g} className="nav-group">
          <div className="nav-group-label">{t(...GROUPS[g])}</div>
          {ROUTES.filter((r) => r.group === g).map((r) => (
            <a key={r.id} href={`#${r.id}`} className={`nav-link ${route === r.id ? 'active' : ''}`} aria-current={route === r.id ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); go(r.id); onPick?.(); }}>
              <Icon name={r.icon} /> <span>{t(r.th, r.en)}</span>
            </a>
          ))}
        </div>
      ))}
    </nav>
  );

  const tools = (
    <div className="side-tools">
      <div className="lang-switch" role="group" aria-label="Language">
        <button type="button" className={lang === 'th' ? 'on' : ''} aria-pressed={lang === 'th'} onClick={() => setLang('th')}>ไทย</button>
        <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('reset')}><Icon name="reset" size={16} /> {t('โหลดข้อมูลตัวอย่างใหม่', 'Reload sample data')}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('clear')}><Icon name="trash" size={16} /> {t('ล้างข้อมูลทั้งหมด', 'Clear all data')}</button>
    </div>
  );

  const current = ROUTES.find((r) => r.id === route)!;

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        {nav()}
        {tools}
      </aside>

      <header className="topbar">
        <Brand />
        <span className="topbar-title">{t(current.th, current.en)}</span>
        <button type="button" className="lang-mini" onClick={() => setLang(lang === 'th' ? 'en' : 'th')} aria-label={t('เปลี่ยนเป็นภาษาอังกฤษ', 'Switch to Thai')}>
          <Icon name="globe" size={18} /> {lang === 'th' ? 'EN' : 'ไทย'}
        </button>
      </header>

      <main className="main">
        <div className="proto-banner" role="note">
          <strong>{t('โหมดต้นแบบ', 'Prototype')}</strong>
          {t(' · ข้อมูลเป็นตัวอย่าง เก็บไว้ในหน้าเว็บนี้ชั่วคราว และจะหายเมื่อรีเฟรชหน้า', ' · Sample data, kept only in this browser tab. It resets when you reload the page.')}
        </div>
        {children}
      </main>

      <nav className="tabbar" aria-label={t('เมนูด่วน', 'Quick menu')}>
        {MOBILE_TABS.map((id) => {
          const r = ROUTES.find((x) => x.id === id)!;
          return (
            <a key={id} href={`#${id}`} className={route === id ? 'active' : ''} aria-current={route === id ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); go(id); }}>
              <Icon name={r.icon} size={22} />
              <span>{t(...(TAB_LABELS[id] ?? [r.th, r.en]))}</span>
            </a>
          );
        })}
        <button type="button" className={!MOBILE_TABS.includes(route) ? 'active' : ''} onClick={() => setMoreOpen(true)}>
          <Icon name="menu" size={22} />
          <span>{t('เมนูอื่น', 'More')}</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('เมนูทั้งหมด', 'All modules')}>
            <div className="sheet-head">
              <h2>{t('เมนูทั้งหมด', 'All modules')}</h2>
              <button type="button" className="icon-btn" onClick={() => setMoreOpen(false)} aria-label={t('ปิด', 'Close')}><Icon name="close" /></button>
            </div>
            {nav(() => setMoreOpen(false))}
            {tools}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm === 'clear' ? t('ล้างข้อมูลทั้งหมด?', 'Clear all data?') : t('โหลดข้อมูลตัวอย่างใหม่?', 'Reload sample data?')}
          message={confirm === 'clear'
            ? t('ทุกหน้าจะว่างเปล่า ใช้ดูหน้าตาเมื่อยังไม่มีข้อมูล และเริ่มกรอกข้อมูลของคุณเอง', 'Every screen will be empty. Use this to see the empty states or to start entering your own data.')
            : t('ข้อมูลที่คุณเพิ่มหรือแก้ไขจะถูกแทนที่ด้วยข้อมูลตัวอย่าง', 'Anything you added or changed will be replaced by the sample data.')}
          confirmLabel={confirm === 'clear' ? t('ล้างข้อมูล', 'Clear data') : t('โหลดใหม่', 'Reload')}
          danger={confirm === 'clear'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === 'clear') { clearAll(); notify(t('ล้างข้อมูลแล้ว', 'All data cleared')); } else { loadSample(); notify(t('โหลดข้อมูลตัวอย่างแล้ว', 'Sample data loaded')); }
            setConfirm(null); setMoreOpen(false);
          }}
        />
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={18} /> {toast}</div>}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21V11C12 6 8 3 4 3c0 5 3 8 8 8zM12 13c0-4 3-7 8-7 0 4-3 7-8 7z" fill="currentColor" /></svg>
      </span>
      <span className="brand-name">Farm Manager</span>
    </div>
  );
}
