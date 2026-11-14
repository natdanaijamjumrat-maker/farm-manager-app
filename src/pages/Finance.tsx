import { useState } from 'react';
import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, Card, EmptyState, PageHeader, Pill, Segmented, Stat } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Table, type Col } from '../components/Table';
import { BarChart, Legend } from '../components/Charts';
import { useOptions } from '../lib/options';
import { fmtDate, monthKey, today } from '../lib/date';
import { fmtTHB } from '../lib/selectors';
import type { FieldDef } from '../components/EntityForm';
import type { Transaction } from '../types';

export function Finance() {
  const { db } = useStore();
  const { t, lang } = useT();
  const label = useLabel();
  const o = useOptions();
  const [type, setType] = useState<'all' | 'cost' | 'revenue'>('all');
  const fields: FieldDef[] = [
    { key: 'type', label: t('ประเภท', 'Type'), type: 'select', options: [{ value: 'cost', label: t('ต้นทุน / รายจ่าย', 'Cost / expense') }, { value: 'revenue', label: t('รายได้', 'Revenue') }], required: true, half: true },
    { key: 'date', label: t('วันที่', 'Date'), type: 'date', required: true, half: true },
    { key: 'category', label: t('หมวดหมู่', 'Category'), type: 'select', options: o.fromLabels('txCategory'), required: true, half: true },
    { key: 'amount', label: t('จำนวนเงิน', 'Amount'), type: 'number', unit: t('บาท', 'THB'), min: 0, required: true, half: true },
    { key: 'batchId', label: t('ผูกกับรอบปลูก (ไม่บังคับ)', 'Linked batch (optional)'), type: 'select', options: o.batches },
    { key: 'note', label: t('รายละเอียด', 'Description'), type: 'text' },
  ];
  const ed = useEditor({ collection: 'transactions', noun: t('รายการเงิน', 'transaction'), fields, defaults: () => ({ type: 'cost', date: today(), category: 'nutrient' }) });

  const rows = db.transactions.filter((x) => type === 'all' || x.type === type).sort((a, b) => b.date.localeCompare(a.date));
  const cost = db.transactions.filter((x) => x.type === 'cost').reduce((s, x) => s + x.amount, 0);
  const rev = db.transactions.filter((x) => x.type === 'revenue').reduce((s, x) => s + x.amount, 0);
  const months = [...new Set(db.transactions.map((x) => monthKey(x.date)))].sort().slice(-6);
  const sum = (k: string, ty: 'cost' | 'revenue') => db.transactions.filter((x) => x.type === ty && monthKey(x.date) === k).reduce((s, x) => s + x.amount, 0);

  const byCat = Object.entries(db.transactions.filter((x) => x.type === 'cost').reduce<Record<string, number>>((m, x) => ({ ...m, [x.category]: (m[x.category] ?? 0) + x.amount }), {})).sort((a, b) => b[1] - a[1]);

  const cols: Col<Transaction>[] = [
    { key: 'date', head: t('วันที่', 'Date'), cell: (x) => fmtDate(x.date, lang) },
    { key: 'type', head: t('ประเภท', 'Type'), cell: (x) => x.type === 'cost' ? <Pill tone="warn">{t('ต้นทุน', 'Cost')}</Pill> : <Pill tone="good">{t('รายได้', 'Revenue')}</Pill> },
    { key: 'cat', head: t('หมวด', 'Category'), cell: (x) => label('txCategory', x.category) },
    { key: 'note', head: t('รายละเอียด', 'Description'), cell: (x) => <>{x.note || '–'}{x.batchId && <div className="mono small muted">{o.batchCode(x.batchId)}</div>}</> },
    { key: 'amt', head: t('จำนวนเงิน', 'Amount'), num: true, cell: (x) => <strong className={x.type === 'cost' ? 'neg' : 'pos'}>{x.type === 'cost' ? '−' : '+'}{fmtTHB(x.amount)}</strong> },
  ];

  return (
    <div className="page">
      <PageHeader title={t('ต้นทุนและรายได้', 'Costs & Revenue')} subtitle={t('บันทึกรายรับรายจ่ายของฟาร์ม', 'Track farm income and spending')} action={<AddButton label={t('เพิ่มรายการ', 'Add entry')} onClick={() => ed.openNew()} />} />
      {db.transactions.length === 0 ? (
        <EmptyState icon="money" title={t('ยังไม่มีรายการเงิน', 'No entries yet')} text={t('บันทึกค่าเมล็ด ปุ๋ย ค่าไฟ และรายได้จากการขาย เพื่อดูกำไร', 'Record seeds, nutrients, power and sales to see your profit.')} action={<AddButton label={t('เพิ่มรายการ', 'Add entry')} onClick={() => ed.openNew()} />} />
      ) : (
        <>
          <div className="stats">
            <Stat label={t('รายได้รวม', 'Total revenue')} value={fmtTHB(rev)} />
            <Stat label={t('ต้นทุนรวม', 'Total cost')} value={fmtTHB(cost)} />
            <Stat label={t('กำไรสุทธิ', 'Net profit')} value={fmtTHB(rev - cost)} sub={rev - cost >= 0 ? t('มีกำไร', 'Profitable') : t('ขาดทุน', 'Loss')} tone={rev - cost >= 0 ? 'good' : 'bad'} />
          </div>
          <div className="grid-2">
            <Card title={t('รายเดือน', 'By month')}>
              <Legend items={[{ name: t('ต้นทุน', 'Cost'), color: 'var(--s2)' }, { name: t('รายได้', 'Revenue'), color: 'var(--s1)' }]} />
              <BarChart labels={months.map((k) => fmtDate(`${k}-01`, lang, { month: 'short' }))} ariaLabel="Monthly cost and revenue" valueFmt={fmtTHB}
                series={[{ name: t('ต้นทุน', 'Cost'), color: 'var(--s2)', values: months.map((k) => sum(k, 'cost')) }, { name: t('รายได้', 'Revenue'), color: 'var(--s1)', values: months.map((k) => sum(k, 'revenue')) }]} />
            </Card>
            <Card title={t('ต้นทุนแยกตามหมวด', 'Cost by category')}>
              <ul className="bars">
                {byCat.map(([k, v]) => (
                  <li key={k}>
                    <div className="bars-label"><span>{label('txCategory', k as Transaction['category'])}</span><span className="num">{fmtTHB(v)} <span className="muted">({Math.round((v / cost) * 100)}%)</span></span></div>
                    <div className="bars-track"><span style={{ width: `${(v / byCat[0][1]) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="toolbar">
            <Segmented label={t('ประเภท', 'Type')} value={type} onChange={setType} options={[{ value: 'all', label: t('ทั้งหมด', 'All') }, { value: 'cost', label: t('ต้นทุน', 'Costs') }, { value: 'revenue', label: t('รายได้', 'Revenue') }]} />
          </div>
          <Table rows={rows} cols={cols} actions={(x) => <RowActions onEdit={() => ed.openEdit(x)} onDelete={() => ed.askDelete(x.id, `${label('txCategory', x.category)} ${fmtTHB(x.amount)}`)} />} />
        </>
      )}
      {ed.element}
    </div>
  );
}
