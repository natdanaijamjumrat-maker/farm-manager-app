import { useStore } from '../store';
import { useT } from '../i18n';
import { AddButton, Card, EmptyState, PageHeader, Pill, Stat } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Table, type Col } from '../components/Table';
import { useOptions } from '../lib/options';
import { fmtDate, today } from '../lib/date';
import { aliveCount, fmtNum, netKg } from '../lib/selectors';
import type { FieldDef, Values } from '../components/EntityForm';
import type { Harvest as H } from '../types';
import type { RouteId } from '../routes';

export function Harvest({ go }: { go: (r: RouteId) => void }) {
  const { db, upsert } = useStore();
  const { t, lang } = useT();
  const o = useOptions();

  const fields: FieldDef[] = [
    { key: 'batchId', label: t('รอบปลูก (Batch)', 'Batch'), type: 'select', options: o.batches, required: true, half: true },
    { key: 'date', label: t('วันที่เก็บเกี่ยว', 'Harvest date'), type: 'date', required: true, half: true },
    { key: 'plantCount', label: t('จำนวนต้นที่เก็บ', 'Plants harvested'), type: 'number', unit: t('ต้น', 'plants'), min: 1, required: true, half: true },
    { key: 'totalWeightKg', label: t('น้ำหนักรวม', 'Total weight'), type: 'number', unit: t('กก.', 'kg'), step: 0.1, min: 0, required: true, half: true },
    { key: 'wasteWeightKg', label: t('น้ำหนักเสีย/ตัดทิ้ง', 'Waste weight'), type: 'number', unit: t('กก.', 'kg'), step: 0.1, min: 0, required: true, half: true, hint: t('ใบเสีย ราก หรือส่วนที่ขายไม่ได้', 'Damaged leaves, roots or unsellable parts') },
    { key: 'grade', label: t('คุณภาพ', 'Quality'), type: 'select', options: o.fromLabels('grade'), required: true, half: true },
    { key: 'markHarvested', label: t('เปลี่ยนสถานะรอบปลูกเป็น “เก็บเกี่ยวแล้ว”', 'Mark the batch as “Harvested”'), type: 'select', options: [{ value: 'yes', label: t('ใช่', 'Yes') }, { value: 'no', label: t('ไม่ใช่ (เก็บบางส่วน)', 'No (partial harvest)') }], half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];

  const prefill = (key: string, v: Values): Values => {
    if (key !== 'batchId') return v;
    const b = db.batches.find((x) => x.id === v.batchId);
    return b ? { ...v, plantCount: aliveCount(db, b) } : v;
  };

  const ed = useEditor({
    collection: 'harvests', noun: t('การเก็บเกี่ยว', 'harvest'), fields, onFieldChange: prefill,
    defaults: () => {
      const b = db.batches.find((x) => x.status === 'ready');
      return { date: today(), grade: 'A', markHarvested: 'yes', batchId: b?.id ?? '', plantCount: b ? aliveCount(db, b) : '' };
    },
    toRow: (v) => {
      if (v.markHarvested === 'yes') {
        const b = db.batches.find((x) => x.id === v.batchId);
        if (b) upsert('batches', { ...b, status: 'harvested' });
      }
      const { markHarvested: _ignored, ...rest } = v;
      void _ignored;
      return rest;
    },
  });

  const rows = [...db.harvests].sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, h) => s + h.totalWeightKg, 0);
  const waste = rows.reduce((s, h) => s + h.wasteWeightKg, 0);
  const plants = rows.reduce((s, h) => s + h.plantCount, 0);
  const net = total - waste;
  const ready = db.batches.filter((b) => b.status === 'ready');

  const cols: Col<H>[] = [
    { key: 'date', head: t('วันที่', 'Date'), cell: (h) => fmtDate(h.date, lang) },
    { key: 'batch', head: 'Batch', cell: (h) => <><span className="mono">{o.batchCode(h.batchId)}</span><div className="muted small">{o.cropName(db.batches.find((b) => b.id === h.batchId)?.cropId)}</div></> },
    { key: 'plants', head: t('ต้น', 'Plants'), num: true, cell: (h) => fmtNum(h.plantCount) },
    { key: 'total', head: t('รวม (กก.)', 'Total (kg)'), num: true, cell: (h) => fmtNum(h.totalWeightKg, 1) },
    { key: 'waste', head: t('เสีย (กก.)', 'Waste (kg)'), num: true, cell: (h) => <>{fmtNum(h.wasteWeightKg, 1)} <span className="muted small">({fmtNum((h.wasteWeightKg / (h.totalWeightKg || 1)) * 100, 0)}%)</span></> },
    { key: 'net', head: t('สุทธิ (กก.)', 'Net (kg)'), num: true, cell: (h) => <strong>{fmtNum(netKg(h), 1)}</strong> },
    { key: 'avg', head: t('กรัม/ต้น', 'g / plant'), num: true, cell: (h) => fmtNum((netKg(h) * 1000) / (h.plantCount || 1)) },
    { key: 'grade', head: t('คุณภาพ', 'Quality'), cell: (h) => <Pill tone={h.grade === 'A' ? 'good' : h.grade === 'B' ? 'info' : 'warn'}>{t('เกรด', 'Grade')} {h.grade}</Pill> },
  ];

  return (
    <div className="page">
      <PageHeader title={t('เก็บเกี่ยวและผลผลิต', 'Harvest & Yield')} subtitle={t('บันทึกจำนวนต้น น้ำหนัก ของเสีย และคุณภาพ', 'Record plants, weight, waste and quality')}
        action={db.batches.length > 0 ? <AddButton label={t('บันทึกการเก็บเกี่ยว', 'Record harvest')} onClick={() => ed.openNew()} /> : undefined} />

      {ready.length > 0 && (
        <div className="callout callout-accent">
          <strong>{t('พร้อมเก็บเกี่ยว:', 'Ready to harvest:')}</strong>
          <div className="pill-row">
            {ready.map((b) => (
              <button key={b.id} type="button" className="chip" onClick={() => ed.openNew({ batchId: b.id, plantCount: aliveCount(db, b) })}>
                + <span className="mono">{b.code}</span> · {o.cropName(b.cropId)}
              </button>
            ))}
          </div>
        </div>
      )}

      {db.batches.length === 0 ? (
        <EmptyState icon="harvest" title={t('ยังไม่มีรอบปลูก', 'No batches yet')} text={t('การเก็บเกี่ยวต้องผูกกับรอบปลูก', 'Each harvest belongs to a planting batch.')} action={<button type="button" className="btn btn-primary" onClick={() => go('batches')}>{t('ไปที่รอบการปลูก', 'Go to batches')}</button>} />
      ) : rows.length === 0 ? (
        <EmptyState icon="harvest" title={t('ยังไม่มีการเก็บเกี่ยว', 'No harvests yet')} text={t('เมื่อเก็บผักแล้ว ให้บันทึกน้ำหนักและคุณภาพที่นี่', 'When you harvest, record the weight and quality here.')} action={<AddButton label={t('บันทึกการเก็บเกี่ยว', 'Record harvest')} onClick={() => ed.openNew()} />} />
      ) : (
        <>
          <div className="stats">
            <Stat label={t('น้ำหนักสุทธิ', 'Net weight')} value={fmtNum(net, 1)} unit={t('กก.', 'kg')} sub={t(`รวม ${fmtNum(total, 1)} กก.`, `of ${fmtNum(total, 1)} kg total`)} />
            <Stat label={t('ของเสีย', 'Waste')} value={fmtNum((waste / (total || 1)) * 100, 1)} unit="%" sub={`${fmtNum(waste, 1)} ${t('กก.', 'kg')}`} tone={waste / (total || 1) > 0.1 ? 'warn' : 'good'} />
            <Stat label={t('ต้นที่เก็บ', 'Plants harvested')} value={fmtNum(plants)} />
            <Stat label={t('เฉลี่ยต่อต้น', 'Average per plant')} value={fmtNum((net * 1000) / (plants || 1))} unit={t('กรัม', 'g')} />
          </div>
          <Card title={t('ประวัติการเก็บเกี่ยว', 'Harvest history')}>
            <Table rows={rows} cols={cols} actions={(h) => <RowActions onEdit={() => ed.openEdit(h)} onDelete={() => ed.askDelete(h.id, `${o.batchCode(h.batchId)} ${fmtDate(h.date, lang)}`)} />} />
          </Card>
        </>
      )}
      {ed.element}
    </div>
  );
}
