import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, EmptyState, PageHeader, Pill } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Modal } from '../components/Modal';
import { useOptions } from '../lib/options';
import type { FieldDef } from '../components/EntityForm';
import type { Crop } from '../types';
import { Icon } from '../components/Icon';

export function Crops() {
  const { db } = useStore();
  const { t } = useT();
  const label = useLabel();
  const { fromLabels } = useOptions();
  const [q, setQ] = useState('');
  const [view, setView] = useState<Crop | null>(null);

  const fields: FieldDef[] = [
    { key: 'nameTh', label: t('ชื่อภาษาไทย', 'Thai name'), type: 'text', required: true, half: true, placeholder: 'กรีนโอ๊ค' },
    { key: 'nameEn', label: t('ชื่อภาษาอังกฤษ', 'English name'), type: 'text', required: true, half: true, placeholder: 'Green Oak' },
    { key: 'variety', label: t('สายพันธุ์', 'Variety'), type: 'text', half: true },
    { key: 'category', label: t('ประเภท', 'Category'), type: 'select', options: fromLabels('cropCategory'), required: true, half: true },
    { key: 'daysToTransplant', label: t('วันถึงย้ายปลูก', 'Days to transplant'), type: 'number', unit: t('วัน', 'days'), required: true, min: 1, max: 60, half: true, hint: t('นับจากวันเพาะเมล็ด', 'Counted from sowing') },
    { key: 'daysToHarvest', label: t('วันถึงเก็บเกี่ยว', 'Days to harvest'), type: 'number', unit: t('วัน', 'days'), required: true, min: 7, max: 200, half: true, hint: t('นับจากวันเพาะเมล็ด', 'Counted from sowing') },
    { key: 'phMin', label: 'pH min', type: 'number', min: 3, max: 9, step: 0.1, required: true, half: true },
    { key: 'phMax', label: 'pH max', type: 'number', min: 3, max: 9, step: 0.1, required: true, half: true },
    { key: 'ecMin', label: 'EC min', type: 'number', unit: 'mS/cm', min: 0, max: 5, step: 0.1, required: true, half: true },
    { key: 'ecMax', label: 'EC max', type: 'number', unit: 'mS/cm', min: 0, max: 5, step: 0.1, required: true, half: true },
    { key: 'tempMin', label: t('อุณหภูมิต่ำสุด', 'Min temperature'), type: 'number', unit: '°C', min: 0, max: 45, half: true },
    { key: 'tempMax', label: t('อุณหภูมิสูงสุด', 'Max temperature'), type: 'number', unit: '°C', min: 0, max: 45, half: true },
    { key: 'expectedYieldG', label: t('ผลผลิตคาดการณ์ต่อต้น', 'Expected yield per plant'), type: 'number', unit: t('กรัม', 'g'), min: 1, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];
  const ed = useEditor({
    collection: 'crops', noun: t('ชนิดผัก', 'crop'), fields,
    defaults: () => ({ category: 'lettuce', daysToTransplant: 14, daysToHarvest: 45, phMin: 5.8, phMax: 6.5, ecMin: 1.2, ecMax: 1.8, tempMin: 18, tempMax: 28, expectedYieldG: 150 }),
  });

  const list = db.crops.filter((c) => `${c.nameTh} ${c.nameEn} ${c.variety}`.toLowerCase().includes(q.toLowerCase()));
  const used = (id: string) => db.batches.filter((b) => b.cropId === id).length;

  return (
    <div className="page">
      <PageHeader title={t('คลังข้อมูลพืช', 'Crop Library')} subtitle={t('ชนิดผักและค่ามาตรฐานการปลูก', 'Crop types and their growing targets')} action={<AddButton label={t('เพิ่มชนิดผัก', 'Add crop')} onClick={() => ed.openNew()} />} />
      {db.crops.length > 0 && (
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input id="crop-search" type="search" placeholder={t('ค้นหาชื่อผัก', 'Search crops')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('ค้นหาชื่อผัก', 'Search crops')} />
          </label>
        </div>
      )}
      {db.crops.length === 0 ? (
        <EmptyState icon="crop" title={t('ยังไม่มีชนิดผัก', 'No crops yet')} text={t('เพิ่มชนิดผักพร้อมค่า pH, EC และจำนวนวันปลูก เพื่อใช้สร้างรอบการปลูก', 'Add a crop with its pH, EC and growing days to use it in planting batches.')} action={<AddButton label={t('เพิ่มชนิดผักแรก', 'Add first crop')} onClick={() => ed.openNew()} />} />
      ) : list.length === 0 ? (
        <EmptyState icon="search" title={t('ไม่พบผักที่ค้นหา', 'No matching crops')} text={t('ลองพิมพ์ชื่ออื่น', 'Try a different name.')} />
      ) : (
        <div className="cards">
          {list.map((c) => (
            <article key={c.id} className="card crop-card">
              <button type="button" className="crop-open" onClick={() => setView(c)} aria-label={t(`ดูข้อมูล ${c.nameTh}`, `View ${c.nameEn}`)}>
                <div className="crop-top">
                  <div>
                    <h3>{t(c.nameTh, c.nameEn)}</h3>
                    <div className="muted small">{t(c.nameEn, c.nameTh)} · {c.variety}</div>
                  </div>
                  <Pill tone="accent">{label('cropCategory', c.category)}</Pill>
                </div>
                <dl className="kv">
                  <div><dt>pH</dt><dd>{c.phMin}–{c.phMax}</dd></div>
                  <div><dt>EC</dt><dd>{c.ecMin}–{c.ecMax}</dd></div>
                  <div><dt>{t('เก็บเกี่ยว', 'Harvest')}</dt><dd>{c.daysToHarvest} {t('วัน', 'd')}</dd></div>
                </dl>
              </button>
              <div className="card-foot">
                <span className="muted small">{t(`ใช้ใน ${used(c.id)} รอบปลูก`, `Used in ${used(c.id)} batches`)}</span>
                <RowActions onEdit={() => ed.openEdit(c)} onDelete={() => ed.askDelete(c.id, t(c.nameTh, c.nameEn))} />
              </div>
            </article>
          ))}
        </div>
      )}
      {view && (
        <Modal title={t(view.nameTh, view.nameEn)} onClose={() => setView(null)}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setView(null)}>{t('ปิด', 'Close')}</button><button type="button" className="btn btn-primary" onClick={() => { ed.openEdit(view); setView(null); }}>{t('แก้ไข', 'Edit')}</button></>}>
          <p className="muted">{t(view.nameEn, view.nameTh)} · {view.variety} · {label('cropCategory', view.category)}</p>
          <dl className="detail-grid">
            <div><dt>{t('ช่วง pH', 'pH range')}</dt><dd>{view.phMin} – {view.phMax}</dd></div>
            <div><dt>{t('ช่วง EC', 'EC range')}</dt><dd>{view.ecMin} – {view.ecMax} mS/cm</dd></div>
            <div><dt>{t('อุณหภูมิ', 'Temperature')}</dt><dd>{view.tempMin} – {view.tempMax} °C</dd></div>
            <div><dt>{t('ย้ายปลูก', 'Transplant')}</dt><dd>{t(`วันที่ ${view.daysToTransplant}`, `Day ${view.daysToTransplant}`)}</dd></div>
            <div><dt>{t('เก็บเกี่ยว', 'Harvest')}</dt><dd>{t(`วันที่ ${view.daysToHarvest}`, `Day ${view.daysToHarvest}`)}</dd></div>
            <div><dt>{t('ผลผลิต/ต้น', 'Yield / plant')}</dt><dd>{view.expectedYieldG} g</dd></div>
          </dl>
          <div className="timeline" aria-label={t('ไทม์ไลน์การปลูก', 'Growing timeline')}>
            <div className="tl-bar"><span style={{ width: `${(view.daysToTransplant / view.daysToHarvest) * 100}%` }} /></div>
            <div className="tl-labels">
              <span>{t('เพาะเมล็ด', 'Sow')} · 0</span>
              <span>{t('ย้ายปลูก', 'Transplant')} · {view.daysToTransplant}</span>
              <span>{t('เก็บเกี่ยว', 'Harvest')} · {view.daysToHarvest}</span>
            </div>
          </div>
          {view.notes && <p>{view.notes}</p>}
        </Modal>
      )}
      {ed.element}
    </div>
  );
}
