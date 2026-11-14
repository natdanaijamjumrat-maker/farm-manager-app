import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, EmptyState, PageHeader, Pill, Progress, Segmented } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Modal } from '../components/Modal';
import { LineChart, Legend } from '../components/Charts';
import { useOptions } from '../lib/options';
import { addDays, diffDays, fmtDate, today } from '../lib/date';
import { aliveCount, batchDay, batchProgress, fmtNum, netKg, survivalRate } from '../lib/selectors';
import type { FieldDef, Values } from '../components/EntityForm';
import type { BatchStatus, PlantingBatch } from '../types';
import type { RouteId } from '../routes';

const tone = (s: BatchStatus) => (s === 'ready' ? 'accent' : s === 'seedling' ? 'info' : s === 'harvested' ? 'neutral' : 'good');

export function Batches({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t, lang } = useT();
  const label = useLabel();
  const o = useOptions();
  const [filter, setFilter] = useState<'active' | 'all' | BatchStatus>('active');
  const [view, setView] = useState<PlantingBatch | null>(null);

  const fields: FieldDef[] = [
    { key: 'code', label: t('รหัสรอบปลูก', 'Batch code'), type: 'text', required: true, half: true, placeholder: 'GO-A1-03', hint: t('เช่น ชนิดผัก-ระบบ-ลำดับ', 'e.g. crop-system-number') },
    { key: 'cropId', label: t('ชนิดผัก', 'Crop'), type: 'select', options: o.crops, required: true, half: true },
    { key: 'systemId', label: t('ระบบปลูก', 'Growing system'), type: 'select', options: o.systems, required: true, half: true },
    { key: 'seedCount', label: t('จำนวนเมล็ด', 'Seeds sown'), type: 'number', unit: t('เมล็ด', 'seeds'), required: true, min: 1, half: true },
    { key: 'sowDate', label: t('วันที่เพาะเมล็ด', 'Sowing date'), type: 'date', required: true, half: true },
    { key: 'transplantDate', label: t('วันที่ย้ายปลูก', 'Transplant date'), type: 'date', half: true, hint: t('คำนวณอัตโนมัติจากชนิดผัก แก้ไขได้', 'Auto-filled from the crop. You can change it.') },
    { key: 'expectedHarvestDate', label: t('วันเก็บเกี่ยวที่คาดการณ์', 'Expected harvest date'), type: 'date', required: true, half: true, hint: t('คำนวณอัตโนมัติจากชนิดผัก แก้ไขได้', 'Auto-filled from the crop. You can change it.') },
    { key: 'status', label: t('สถานะ', 'Status'), type: 'select', options: o.fromLabels('status'), required: true, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];

  const derive = (key: string, v: Values): Values => {
    if (key !== 'cropId' && key !== 'sowDate') return v;
    const crop = db.crops.find((c) => c.id === v.cropId);
    if (!crop || !v.sowDate) return v;
    return { ...v, transplantDate: addDays(String(v.sowDate), crop.daysToTransplant), expectedHarvestDate: addDays(String(v.sowDate), crop.daysToHarvest) };
  };

  const ed = useEditor({
    collection: 'batches', noun: t('รอบการปลูก', 'batch'), fields, onFieldChange: derive,
    defaults: () => ({ sowDate: today(), status: 'seedling', seedCount: 120 }),
  });

  const counts = (s: BatchStatus) => db.batches.filter((b) => b.status === s).length;
  const list = db.batches
    .filter((b) => (filter === 'all' ? true : filter === 'active' ? b.status !== 'harvested' : b.status === filter))
    .sort((a, b) => b.sowDate.localeCompare(a.sowDate));

  return (
    <div className="page">
      <PageHeader title={t('รอบการปลูก', 'Planting Batches')} subtitle={t('ติดตามแต่ละรอบตั้งแต่เพาะเมล็ดถึงเก็บเกี่ยว', 'Track each batch from sowing to harvest')}
        action={db.crops.length > 0 && db.systems.length > 0 ? <AddButton label={t('สร้างรอบปลูก', 'New batch')} onClick={() => ed.openNew()} /> : undefined} />

      {db.crops.length === 0 || db.systems.length === 0 ? (
        <EmptyState icon="batch" title={t('ยังสร้างรอบปลูกไม่ได้', 'You can’t create a batch yet')}
          text={t('รอบปลูกต้องมีชนิดผักและระบบปลูกก่อน', 'A batch needs at least one crop and one growing system.')}
          action={<div className="row-gap">
            {db.crops.length === 0 && <button type="button" className="btn btn-primary" onClick={() => go('crops')}>{t('เพิ่มชนิดผัก', 'Add a crop')}</button>}
            {db.systems.length === 0 && <button type="button" className="btn btn-ghost" onClick={() => go('systems')}>{t('เพิ่มระบบปลูก', 'Add a system')}</button>}
          </div>} />
      ) : (
        <>
          <div className="toolbar">
            <Segmented label={t('กรองสถานะ', 'Filter by status')} value={filter} onChange={setFilter} options={[
              { value: 'active', label: t('กำลังปลูก', 'Active') },
              { value: 'ready', label: `${label('status', 'ready')} (${counts('ready')})` },
              { value: 'harvested', label: `${label('status', 'harvested')} (${counts('harvested')})` },
              { value: 'all', label: t('ทั้งหมด', 'All') },
            ]} />
          </div>
          {list.length === 0 ? (
            <EmptyState icon="batch" title={t('ไม่มีรอบปลูกในกลุ่มนี้', 'No batches in this view')} text={t('สร้างรอบปลูกใหม่ หรือเปลี่ยนตัวกรอง', 'Create a new batch or change the filter.')} action={<AddButton label={t('สร้างรอบปลูก', 'New batch')} onClick={() => ed.openNew()} />} />
          ) : (
            <div className="cards">
              {list.map((b) => {
                const sys = db.systems.find((s) => s.id === b.systemId);
                return (
                  <article key={b.id} className="card batch-card">
                    <button type="button" className="crop-open" onClick={() => setView(b)} aria-label={t(`ดูรายละเอียด ${b.code}`, `View ${b.code}`)}>
                      <div className="crop-top">
                        <div>
                          <h3 className="mono">{b.code}</h3>
                          <div className="muted small">{o.cropName(b.cropId)} · {sys?.name ?? '–'}</div>
                        </div>
                        <Pill tone={tone(b.status)}>{label('status', b.status)}</Pill>
                      </div>
                      {b.status !== 'harvested' && (
                        <div className="batch-progress">
                          <div className="small"><strong>{t(`วันที่ ${batchDay(b)}`, `Day ${batchDay(b)}`)}</strong> <span className="muted">/ {diffDays(b.expectedHarvestDate, b.sowDate)}</span></div>
                          <Progress value={batchProgress(b)} />
                        </div>
                      )}
                      <dl className="kv">
                        <div><dt>{t('ต้นรอด', 'Alive')}</dt><dd>{fmtNum(aliveCount(db, b))}/{fmtNum(b.seedCount)}</dd></div>
                        <div><dt>{t('อัตรารอด', 'Survival')}</dt><dd>{fmtNum(survivalRate(db, b) * 100, 0)}%</dd></div>
                        <div><dt>{t('เก็บเกี่ยว', 'Harvest')}</dt><dd>{fmtDate(b.expectedHarvestDate, lang, { day: 'numeric', month: 'short' })}</dd></div>
                      </dl>
                    </button>
                    <div className="card-foot">
                      <span className="muted small">{t('เพาะ', 'Sown')} {fmtDate(b.sowDate, lang)}</span>
                      <RowActions onEdit={() => ed.openEdit(b)} onDelete={() => ed.askDelete(b.id, b.code)} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {view && <BatchDetail b={view} onClose={() => setView(null)} onEdit={() => { ed.openEdit(view); setView(null); }} go={go} />}
      {ed.element}
    </div>
  );
}

function BatchDetail({ b, onClose, onEdit, go }: { b: PlantingBatch; onClose: () => void; onEdit: () => void; go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t, lang } = useT();
  const label = useLabel();
  const o = useOptions();
  const crop = db.crops.find((c) => c.id === b.cropId);
  const logs = db.logs.filter((l) => l.batchId === b.id).sort((x, y) => x.date.localeCompare(y.date));
  const harvests = db.harvests.filter((h) => h.batchId === b.id);
  const photos = db.photos.filter((p) => p.batchId === b.id).length;
  const steps: [string, string][] = [
    [t('เพาะเมล็ด', 'Sown'), b.sowDate],
    [t('ย้ายปลูก', 'Transplant'), b.transplantDate],
    [t('เก็บเกี่ยว (คาด)', 'Harvest (expected)'), b.expectedHarvestDate],
  ];
  const td = today();
  return (
    <Modal title={`${b.code} · ${o.cropName(b.cropId)}`} onClose={onClose} wide
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={() => go('logs')}>{t('ไปที่บันทึกประจำวัน', 'Open daily logs')}</button>
        <button type="button" className="btn btn-primary" onClick={onEdit}>{t('แก้ไขรอบปลูก', 'Edit batch')}</button>
      </>}>
      <div className="row-gap"><Pill tone={tone(b.status)}>{label('status', b.status)}</Pill><span className="muted small">{db.systems.find((s) => s.id === b.systemId)?.name}</span></div>
      <ol className="steps">
        {steps.map(([n, d]) => (
          <li key={n} className={d && d <= td ? 'done' : ''}><span className="step-dot" aria-hidden="true" /><div><div className="small muted">{n}</div><div>{fmtDate(d, lang)}</div></div></li>
        ))}
      </ol>
      <dl className="detail-grid">
        <div><dt>{t('เมล็ดที่เพาะ', 'Seeds sown')}</dt><dd>{fmtNum(b.seedCount)}</dd></div>
        <div><dt>{t('ต้นที่รอดล่าสุด', 'Alive now')}</dt><dd>{fmtNum(aliveCount(db, b))} ({fmtNum(survivalRate(db, b) * 100, 1)}%)</dd></div>
        <div><dt>{t('บันทึก / รูปภาพ', 'Logs / photos')}</dt><dd>{logs.length} / {photos}</dd></div>
        <div><dt>{t('ผลผลิตสุทธิ', 'Net yield')}</dt><dd>{harvests.length ? `${fmtNum(harvests.reduce((s, h) => s + netKg(h), 0), 1)} kg` : '–'}</dd></div>
      </dl>
      {logs.length > 1 && crop ? (
        <>
          <h3 className="section-title">{t('ค่า pH ย้อนหลัง', 'pH history')}</h3>
          <Legend items={[{ name: 'pH', color: 'var(--s1)' }, { name: t(`ช่วงเหมาะสม ${crop.phMin}–${crop.phMax}`, `Target ${crop.phMin}–${crop.phMax}`), color: 'var(--band-strong)' }]} />
          <LineChart labels={logs.map((l) => fmtDate(l.date, lang, { day: 'numeric', month: 'short' }))} ariaLabel="pH history" height={180}
            band={{ min: crop.phMin, max: crop.phMax, label: 'target' }} series={[{ name: 'pH', color: 'var(--s1)', values: logs.map((l) => l.ph) }]} />
        </>
      ) : <p className="muted">{t('ยังไม่มีบันทึกเพียงพอสำหรับกราฟ', 'Not enough logs for a chart yet.')}</p>}
      {b.notes && <p>{b.notes}</p>}
    </Modal>
  );
}
