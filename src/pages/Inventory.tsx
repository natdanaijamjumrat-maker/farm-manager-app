import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, EmptyState, PageHeader, Pill, Segmented } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Table, type Col } from '../components/Table';
import { useOptions } from '../lib/options';
import { fmtNum } from '../lib/selectors';
import type { FieldDef } from '../components/EntityForm';
import type { InventoryItem } from '../types';

export function Inventory() {
  const { db, upsert, notify } = useStore();
  const { t } = useT();
  const label = useLabel();
  const o = useOptions();
  const [show, setShow] = useState<'all' | 'low'>('all');
  const fields: FieldDef[] = [
    { key: 'name', label: t('ชื่อรายการ', 'Item name'), type: 'text', required: true },
    { key: 'category', label: t('หมวดหมู่', 'Category'), type: 'select', options: o.fromLabels('invCategory'), required: true, half: true },
    { key: 'unit', label: t('หน่วย', 'Unit'), type: 'text', required: true, half: true, placeholder: t('เช่น ลิตร, เมล็ด, ชิ้น', 'e.g. L, seeds, pcs') },
    { key: 'quantity', label: t('คงเหลือ', 'In stock'), type: 'number', min: 0, required: true, half: true },
    { key: 'minLevel', label: t('จุดสั่งซื้อขั้นต่ำ', 'Reorder level'), type: 'number', min: 0, half: true, hint: t('แจ้งเตือนเมื่อต่ำกว่าค่านี้', 'Warn when stock falls below this') },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];
  const ed = useEditor({ collection: 'inventory', noun: t('รายการวัสดุ', 'item'), fields, defaults: () => ({ category: 'seed', minLevel: 0 }) });
  const low = (i: InventoryItem) => i.quantity < i.minLevel;
  const rows = db.inventory.filter((i) => show === 'all' || low(i));
  const adjust = (i: InventoryItem, d: number) => { upsert('inventory', { ...i, quantity: Math.max(0, Number((i.quantity + d).toFixed(2))) }); notify(t('ปรับจำนวนแล้ว', 'Quantity updated')); };
  const step = (i: InventoryItem) => (i.quantity >= 500 ? 100 : i.quantity >= 50 ? 10 : 1);

  const cols: Col<InventoryItem>[] = [
    { key: 'name', head: t('รายการ', 'Item'), cell: (i) => <strong>{i.name}</strong> },
    { key: 'cat', head: t('หมวด', 'Category'), cell: (i) => label('invCategory', i.category) },
    { key: 'qty', head: t('คงเหลือ', 'In stock'), num: true, cell: (i) => (
      <div className="qty">
        <button type="button" className="icon-btn sm" onClick={() => adjust(i, -step(i))} aria-label={t(`ลด ${step(i)}`, `Decrease by ${step(i)}`)}>−</button>
        <span>{fmtNum(i.quantity, i.quantity % 1 ? 1 : 0)} <span className="muted small">{i.unit}</span></span>
        <button type="button" className="icon-btn sm" onClick={() => adjust(i, step(i))} aria-label={t(`เพิ่ม ${step(i)}`, `Increase by ${step(i)}`)}>+</button>
      </div>
    ) },
    { key: 'min', head: t('ขั้นต่ำ', 'Reorder at'), num: true, cell: (i) => `${fmtNum(i.minLevel)} ${i.unit}` },
    { key: 'st', head: t('สถานะ', 'Status'), cell: (i) => (low(i) ? <Pill tone="warn">⚠ {t('ใกล้หมด', 'Low stock')}</Pill> : <Pill tone="good">✓ {t('เพียงพอ', 'OK')}</Pill>) },
  ];
  return (
    <div className="page">
      <PageHeader title={t('คลังวัสดุ', 'Inventory')} subtitle={t('เมล็ดพันธุ์ ปุ๋ย วัสดุปลูก และบรรจุภัณฑ์', 'Seeds, nutrients, media and packaging')} action={<AddButton label={t('เพิ่มรายการ', 'Add item')} onClick={() => ed.openNew()} />} />
      {db.inventory.length === 0 ? (
        <EmptyState icon="inventory" title={t('ยังไม่มีรายการในคลัง', 'No inventory items')} text={t('เพิ่มวัสดุและตั้งจุดสั่งซื้อ เพื่อให้ระบบเตือนเมื่อใกล้หมด', 'Add items with a reorder level to get low-stock warnings.')} action={<AddButton label={t('เพิ่มรายการ', 'Add item')} onClick={() => ed.openNew()} />} />
      ) : (
        <>
          <div className="toolbar">
            <Segmented label={t('ตัวกรอง', 'Filter')} value={show} onChange={setShow} options={[{ value: 'all', label: t(`ทั้งหมด (${db.inventory.length})`, `All (${db.inventory.length})`) }, { value: 'low', label: t(`ใกล้หมด (${db.inventory.filter(low).length})`, `Low stock (${db.inventory.filter(low).length})`) }]} />
          </div>
          {rows.length === 0 ? <EmptyState icon="check" title={t('ไม่มีรายการใกล้หมด', 'Nothing is low')} text={t('สต็อกทุกรายการอยู่เหนือจุดสั่งซื้อ', 'Every item is above its reorder level.')} />
            : <Table rows={rows} cols={cols} actions={(i) => <RowActions onEdit={() => ed.openEdit(i)} onDelete={() => ed.askDelete(i.id, i.name)} />} />}
        </>
      )}
      {ed.element}
    </div>
  );
}
