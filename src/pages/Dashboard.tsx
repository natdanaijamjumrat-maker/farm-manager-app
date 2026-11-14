import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { Card, PageHeader, Pill, Progress, Stat, EmptyState } from '../components/ui';
import { BarChart, LineChart, Legend } from '../components/Charts';
import { aliveCount, batchDay, batchProgress, fmtNum, fmtTHB, isActive, latestLog, netKg } from '../lib/selectors';
import { addDays, diffDays, fmtDate, monthKey, toISO, today } from '../lib/date';
import { useOptions } from '../lib/options';
import type { RouteId } from '../routes';

export function Dashboard({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t, lang } = useT();
  const label = useLabel();
  const { cropName } = useOptions();
  const td = today();

  const active = db.batches.filter(isActive);
  const plants = active.reduce((s, b) => s + aliveCount(db, b), 0);
  const seeds = active.reduce((s, b) => s + b.seedCount, 0);
  const survival = seeds ? plants / seeds : 0;
  const yieldKg = db.harvests.reduce((s, h) => s + netKg(h), 0);
  const thisMonth = monthKey(td);
  const costMonth = db.transactions.filter((x) => x.type === 'cost' && monthKey(x.date) === thisMonth).reduce((s, x) => s + x.amount, 0);
  const revenueMonth = db.transactions.filter((x) => x.type === 'revenue' && monthKey(x.date) === thisMonth).reduce((s, x) => s + x.amount, 0);

  // Monthly cost vs revenue, last 4 months
  const months = [3, 2, 1, 0].map((m) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m);
    return toISO(d).slice(0, 7);
  });
  const mLabel = (k: string) => fmtDate(`${k}-01`, lang, { month: 'short' });
  const sumBy = (type: 'cost' | 'revenue') => months.map((k) => db.transactions.filter((x) => x.type === type && monthKey(x.date) === k).reduce((s, x) => s + x.amount, 0));

  // Average temperature, last 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(td, i - 13));
  const avg = (d: string, f: 'temperature' | 'humidity') => {
    const ls = db.logs.filter((l) => l.date === d);
    return ls.length ? Number((ls.reduce((s, l) => s + l[f], 0) / ls.length).toFixed(1)) : null;
  };

  // Alerts
  const alerts: { tone: 'warn' | 'bad'; text: string; to: RouteId }[] = [];
  for (const b of active) {
    const l = latestLog(db, b.id);
    const c = db.crops.find((x) => x.id === b.cropId);
    if (l && c && (l.ph < c.phMin || l.ph > c.phMax)) alerts.push({ tone: 'bad', text: t(`${b.code}: pH ${l.ph} อยู่นอกช่วง ${c.phMin}–${c.phMax}`, `${b.code}: pH ${l.ph} is outside ${c.phMin}–${c.phMax}`), to: 'nutrients' });
    if (l && c && (l.ec < c.ecMin || l.ec > c.ecMax)) alerts.push({ tone: 'warn', text: t(`${b.code}: EC ${l.ec} อยู่นอกช่วง ${c.ecMin}–${c.ecMax}`, `${b.code}: EC ${l.ec} is outside ${c.ecMin}–${c.ecMax}`), to: 'nutrients' });
    if (!l || diffDays(td, l.date) > 1) alerts.push({ tone: 'warn', text: t(`${b.code}: ยังไม่มีบันทึกวันนี้`, `${b.code}: no log recorded today`), to: 'logs' });
  }
  for (const i of db.inventory) if (i.quantity < i.minLevel) alerts.push({ tone: 'warn', text: t(`${i.name} ใกล้หมด (${i.quantity} ${i.unit})`, `${i.name} is low (${i.quantity} ${i.unit})`), to: 'inventory' });

  const upcoming = [...active].sort((a, b) => a.expectedHarvestDate.localeCompare(b.expectedHarvestDate));
  const isEmpty = db.batches.length === 0 && db.harvests.length === 0 && db.transactions.length === 0;

  return (
    <div className="page">
      <PageHeader title={t('ภาพรวมฟาร์ม', 'Farm overview')} subtitle={`${db.farms[0]?.name ?? 'Farm Manager'} · ${fmtDate(td, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />

      {isEmpty ? (
        <EmptyState icon="dashboard" title={t('ยังไม่มีข้อมูลในฟาร์ม', 'No farm data yet')}
          text={t('เริ่มจากเพิ่มชนิดผักในคลังข้อมูลพืช แล้วสร้างรอบการปลูกแรก', 'Start by adding a crop to the Crop Library, then create your first planting batch.')}
          action={<button type="button" className="btn btn-primary" onClick={() => go('crops')}>{t('ไปที่คลังข้อมูลพืช', 'Go to Crop Library')}</button>} />
      ) : (
        <>
          <div className="stats">
            <Stat label={t('ต้นที่กำลังปลูก', 'Plants growing')} value={fmtNum(plants)} unit={t('ต้น', 'plants')} sub={t(`จาก ${fmtNum(seeds)} เมล็ด`, `from ${fmtNum(seeds)} seeds`)} />
            <Stat label={t('รอบปลูกที่ดำเนินการ', 'Active batches')} value={String(active.length)} unit={t('รอบ', 'batches')} sub={t(`พร้อมเก็บ ${active.filter((b) => b.status === 'ready').length} รอบ`, `${active.filter((b) => b.status === 'ready').length} ready to harvest`)} />
            <Stat label={t('อัตรารอด', 'Survival rate')} value={fmtNum(survival * 100, 1)} unit="%" sub={survival >= 0.9 ? t('ดี (เป้าหมาย ≥ 90%)', 'Good (target ≥ 90%)') : t('ต่ำกว่าเป้า 90%', 'Below 90% target')} tone={survival >= 0.9 ? 'good' : 'warn'} />
            <Stat label={t('ผลผลิตสุทธิรวม', 'Total net yield')} value={fmtNum(yieldKg, 1)} unit={t('กก.', 'kg')} sub={t(`${db.harvests.length} ครั้งที่เก็บเกี่ยว`, `${db.harvests.length} harvests`)} />
            <Stat label={t('ต้นทุนเดือนนี้', 'Cost this month')} value={fmtTHB(costMonth)} sub={t(`รายได้ ${fmtTHB(revenueMonth)}`, `Revenue ${fmtTHB(revenueMonth)}`)} />
          </div>

          <div className="grid-2">
            <Card title={t('ต้นทุนและรายได้ 4 เดือนล่าสุด', 'Cost vs revenue, last 4 months')}>
              <Legend items={[{ name: t('ต้นทุน', 'Cost'), color: 'var(--s2)' }, { name: t('รายได้', 'Revenue'), color: 'var(--s1)' }]} />
              <BarChart labels={months.map(mLabel)} ariaLabel="Cost vs revenue"
                series={[{ name: t('ต้นทุน', 'Cost'), color: 'var(--s2)', values: sumBy('cost') }, { name: t('รายได้', 'Revenue'), color: 'var(--s1)', values: sumBy('revenue') }]}
                valueFmt={fmtTHB} />
            </Card>
            <Card title={t('อุณหภูมิเฉลี่ย 14 วัน', 'Average temperature, 14 days')}>
              <p className="chart-note">{t('ค่าเฉลี่ยจากบันทึกประจำวันทุกโรงเรือน (°C)', 'Average of all daily logs (°C)')}</p>
              <LineChart labels={days.map((d) => fmtDate(d, lang, { day: 'numeric', month: 'short' }))} ariaLabel="Average temperature" unit="°C"
                series={[{ name: t('อุณหภูมิ', 'Temperature'), color: 'var(--accent)', values: days.map((d) => avg(d, 'temperature')) }]} />
            </Card>
          </div>

          <div className="grid-2">
            <Card title={t('รอบปลูกที่กำลังดำเนินการ', 'Active batches')} action={<button type="button" className="link-btn" onClick={() => go('batches')}>{t('ดูทั้งหมด', 'View all')}</button>}>
              {upcoming.length === 0 ? <p className="muted">{t('ไม่มีรอบปลูกที่กำลังดำเนินการ', 'No active batches')}</p> : (
                <ul className="list">
                  {upcoming.map((b) => (
                    <li key={b.id} className="list-row">
                      <div className="list-main">
                        <div className="list-title">{b.code} <span className="muted">· {cropName(b.cropId)}</span></div>
                        <Progress value={batchProgress(b)} />
                        <div className="list-meta">{t(`วันที่ ${batchDay(b)}`, `Day ${batchDay(b)}`)} · {t('เก็บเกี่ยว', 'Harvest')} {fmtDate(b.expectedHarvestDate, lang, { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <Pill tone={b.status === 'ready' ? 'accent' : b.status === 'seedling' ? 'info' : 'neutral'}>{label('status', b.status)}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={t('สิ่งที่ต้องดูแล', 'Needs attention')}>
              {alerts.length === 0 ? <p className="muted">{t('ทุกอย่างปกติ', 'Everything looks normal')}</p> : (
                <ul className="list">
                  {alerts.slice(0, 6).map((a, i) => (
                    <li key={i}>
                      <button type="button" className={`alert alert-${a.tone}`} onClick={() => go(a.to)}>
                        <span className="alert-icon" aria-hidden="true">!</span>
                        <span>{a.text}</span>
                        <span className="sr-only">{a.tone === 'bad' ? 'critical' : 'warning'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
