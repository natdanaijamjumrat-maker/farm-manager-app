import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, EmptyState, PageHeader, Pill } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Table, type Col } from '../components/Table';
import { useOptions } from '../lib/options';
import { fmtDate, today } from '../lib/date';
import { latestLog } from '../lib/selectors';
import type { FieldDef, Values } from '../components/EntityForm';
import type { Activity, DailyLog } from '../types';
import type { RouteId } from '../routes';

export function Logs({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t, lang } = useT();
  const label = useLabel();
  const o = useOptions();
  const [batch, setBatch] = useState('');
  const [limit, setLimit] = useState(25);

  const fields: FieldDef[] = [
    { key: 'date', label: t('วันที่', 'Date'), type: 'date', required: true, half: true },
    { key: 'batchId', label: t('รอบปลูก (Batch)', 'Batch'), type: 'select', options: o.batches, required: true, half: true },
    { key: 'ph', label: t('ค่า pH', 'pH'), type: 'number', step: 0.1, min: 0, max: 14, required: true, half: true, hint: t('ผักสลัดส่วนใหญ่ 5.8–6.5', 'Most lettuce: 5.8–6.5') },
    { key: 'ec', label: t('ค่า EC', 'EC'), type: 'number', unit: 'mS/cm', step: 0.1, min: 0, max: 10, required: true, half: true, hint: t('ผักสลัดส่วนใหญ่ 1.2–1.8', 'Most lettuce: 1.2–1.8') },
    { key: 'temperature', label: t('อุณหภูมิ', 'Temperature'), type: 'number', unit: '°C', step: 0.1, min: -10, max: 60, required: true, half: true },
    { key: 'humidity', label: t('ความชื้นสัมพัทธ์', 'Relative humidity'), type: 'number', unit: '%', min: 0, max: 100, required: true, half: true },
    { key: 'aliveCount', label: t('จำนวนต้นที่รอด', 'Plants alive'), type: 'number', unit: t('ต้น', 'plants'), min: 0, required: true, half: true, hint: t('เติมจากบันทึกล่าสุดของรอบนี้ให้อัตโนมัติ', 'Filled from this batch’s last log') },
    { key: 'activities', label: t('กิจกรรมที่ทำวันนี้', 'Activities today'), type: 'chips', options: o.fromLabels('activity') },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea', placeholder: t('เช่น พบเพลี้ยที่ราง 3', 'e.g. aphids seen on channel 3') },
  ];

  const prefill = (key: string, v: Values): Values => {
    if (key !== 'batchId') return v;
    const b = db.batches.find((x) => x.id === v.batchId);
    if (!b) return v;
    const last = latestLog(db, b.id);
    return { ...v, aliveCount: last?.aliveCount ?? b.seedCount };
  };

  const ed = useEditor({
    collection: 'logs', noun: t('บันทึกประจำวัน', 'daily log'), fields, onFieldChange: prefill,
    defaults: () => ({ date: today(), activities: [] as Activity[], batchId: batch || '' }),
  });

  const active = db.batches.filter((b) => b.status !== 'harvested');
  const loggedToday = new Set(db.logs.filter((l) => l.date === today()).map((l) => l.batchId));
  const missing = active.filter((b) => !loggedToday.has(b.id));

  const rows = db.logs.filter((l) => !batch || l.batchId === batch).sort((a, b) => b.date.localeCompare(a.date) || a.batchId.localeCompare(b.batchId));

  const range = (l: DailyLog, k: 'ph' | 'ec' | 'temperature') => {
    const b = db.batches.find((x) => x.id === l.batchId);
    const c = db.crops.find((x) => x.id === b?.cropId);
    if (!c) return true;
    const [lo, hi] = k === 'ph' ? [c.phMin, c.phMax] : k === 'ec' ? [c.ecMin, c.ecMax] : [c.tempMin, c.tempMax];
    return l[k] >= lo && l[k] <= hi;
  };
  const val = (l: DailyLog, k: 'ph' | 'ec' | 'temperature', suffix = '') => (
    <span className={range(l, k) ? '' : 'out-of-range'} title={range(l, k) ? undefined : t('นอกช่วงที่เหมาะสม', 'Outside target range')}>
      {l[k]}{suffix}{!range(l, k) && ' ⚠'}
    </span>
  );

  const cols: Col<DailyLog>[] = [
    { key: 'date', head: t('วันที่', 'Date'), cell: (l) => fmtDate(l.date, lang, { day: 'numeric', month: 'short' }) },
    { key: 'batch', head: 'Batch', cell: (l) => <span className="mono">{o.batchCode(l.batchId)}</span> },
    { key: 'ph', head: 'pH', num: true, cell: (l) => val(l, 'ph') },
    { key: 'ec', head: 'EC', num: true, cell: (l) => val(l, 'ec') },
    { key: 'temp', head: t('อุณหภูมิ', 'Temp'), num: true, cell: (l) => val(l, 'temperature', '°') },
    { key: 'rh', head: t('ความชื้น', 'RH'), num: true, cell: (l) => `${l.humidity}%` },
    { key: 'alive', head: t('ต้นรอด', 'Alive'), num: true, cell: (l) => l.aliveCount.toLocaleString() },
    { key: 'act', head: t('กิจกรรม', 'Activities'), hideSm: false, cell: (l) => <div className="pill-row">{l.activities.map((a) => <Pill key={a}>{label('activity', a)}</Pill>)}</div> },
    { key: 'notes', head: t('หมายเหตุ', 'Notes'), cell: (l) => l.notes || <span className="muted">–</span> },
  ];

  return (
    <div className="page">
      <PageHeader title={t('บันทึกประจำวัน', 'Daily Logs')} subtitle={t('ค่าน้ำ สภาพอากาศ และงานที่ทำในแต่ละวัน', 'Water readings, climate and work done each day')}
        action={db.batches.length > 0 ? <AddButton label={t('บันทึกวันนี้', 'Log today')} onClick={() => ed.openNew()} /> : undefined} />

      {db.batches.length === 0 ? (
        <EmptyState icon="log" title={t('ยังไม่มีรอบปลูก', 'No batches yet')} text={t('สร้างรอบปลูกก่อน แล้วจึงบันทึกค่าประจำวันได้', 'Create a planting batch first, then you can log daily readings.')}
          action={<button type="button" className="btn btn-primary" onClick={() => go('batches')}>{t('ไปที่รอบการปลูก', 'Go to batches')}</button>} />
      ) : (
        <>
          {missing.length > 0 && (
            <div className="callout">
              <strong>{t('ยังไม่ได้บันทึกวันนี้:', 'Not logged today:')}</strong>
              <div className="pill-row">
                {missing.map((b) => (
                  <button key={b.id} type="button" className="chip" onClick={() => ed.openNew({ batchId: b.id, aliveCount: latestLog(db, b.id)?.aliveCount ?? b.seedCount })}>
                    + <span className="mono">{b.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="toolbar">
            <label className="select-inline">
              <span>{t('รอบปลูก', 'Batch')}</span>
              <select id="log-filter" value={batch} onChange={(e) => { setBatch(e.target.value); setLimit(25); }}>
                <option value="">{t('ทุกรอบ', 'All batches')}</option>
                {o.batches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <span className="muted small">{t(`${rows.length} รายการ`, `${rows.length} entries`)}</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon="log" title={t('ยังไม่มีบันทึก', 'No logs yet')} text={t('กด “บันทึกวันนี้” เพื่อเพิ่มบันทึกแรก', 'Tap “Log today” to add the first entry.')} action={<AddButton label={t('บันทึกวันนี้', 'Log today')} onClick={() => ed.openNew()} />} />
          ) : (
            <>
              <Table rows={rows.slice(0, limit)} cols={cols} actions={(l) => <RowActions onEdit={() => ed.openEdit(l)} onDelete={() => ed.askDelete(l.id, `${o.batchCode(l.batchId)} ${fmtDate(l.date, lang)}`)} />} />
              {rows.length > limit && <div className="center"><button type="button" className="btn btn-ghost" onClick={() => setLimit(limit + 25)}>{t('แสดงเพิ่ม', 'Show more')} ({rows.length - limit})</button></div>}
            </>
          )}
        </>
      )}
      {ed.element}
    </div>
  );
}
