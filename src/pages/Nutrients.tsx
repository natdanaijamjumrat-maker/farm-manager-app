import { useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import { AddButton, Card, EmptyState, PageHeader, Pill } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { LineChart, Legend } from '../components/Charts';
import { useOptions } from '../lib/options';
import { fmtDate } from '../lib/date';
import { fmtNum } from '../lib/selectors';
import type { FieldDef } from '../components/EntityForm';

export function Nutrients() {
  const { db } = useStore();
  const { t, lang } = useT();
  const o = useOptions();
  const active = db.batches.filter((b) => b.status !== 'harvested');
  const [batchId, setBatchId] = useState(active[0]?.id ?? db.batches[0]?.id ?? '');
  const [recipeId, setRecipeId] = useState(db.recipes[0]?.id ?? '');
  const [liters, setLiters] = useState('400');

  const fields: FieldDef[] = [
    { key: 'name', label: t('ชื่อสูตร', 'Recipe name'), type: 'text', required: true },
    { key: 'cropId', label: t('ใช้กับผัก', 'For crop'), type: 'select', options: o.crops, half: true },
    { key: 'targetEc', label: t('EC เป้าหมาย', 'Target EC'), type: 'number', unit: 'mS/cm', step: 0.1, min: 0, max: 5, required: true, half: true },
    { key: 'aMlPerL', label: t('ปุ๋ย A', 'Stock A'), type: 'number', unit: 'ml/L', step: 0.1, min: 0, required: true, half: true },
    { key: 'bMlPerL', label: t('ปุ๋ย B', 'Stock B'), type: 'number', unit: 'ml/L', step: 0.1, min: 0, required: true, half: true },
    { key: 'targetPh', label: t('pH เป้าหมาย', 'Target pH'), type: 'number', step: 0.1, min: 3, max: 9, required: true, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];
  const ed = useEditor({ collection: 'recipes', noun: t('สูตรสารอาหาร', 'nutrient recipe'), fields, defaults: () => ({ aMlPerL: 2.5, bMlPerL: 2.5, targetEc: 1.5, targetPh: 6.0 }) });

  const b = db.batches.find((x) => x.id === batchId);
  const crop = db.crops.find((c) => c.id === b?.cropId);
  const logs = db.logs.filter((l) => l.batchId === batchId).sort((x, y) => x.date.localeCompare(y.date));
  const labels = logs.map((l) => fmtDate(l.date, lang, { day: 'numeric', month: 'short' }));
  const recipe = db.recipes.find((r) => r.id === recipeId);
  const L = Number(liters) || 0;

  return (
    <div className="page">
      <PageHeader title={t('น้ำและสารอาหาร', 'Water & Nutrients')} subtitle={t('ติดตามค่า pH / EC และสูตรผสมปุ๋ย', 'Track pH / EC and nutrient mixes')} action={<AddButton label={t('เพิ่มสูตร', 'Add recipe')} onClick={() => ed.openNew()} />} />

      {db.batches.length > 0 && (
        <>
          <div className="toolbar">
            <label className="select-inline">
              <span>{t('รอบปลูก', 'Batch')}</span>
              <select id="nut-batch" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                {o.batches.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </label>
          </div>
          {logs.length < 2 || !crop ? (
            <EmptyState icon="water" title={t('ยังมีบันทึกไม่พอ', 'Not enough readings')} text={t('บันทึกค่า pH และ EC อย่างน้อย 2 วันเพื่อดูกราฟ', 'Log pH and EC on at least 2 days to see the charts.')} />
          ) : (
            <div className="grid-2">
              <Card title={`pH · ${t('ล่าสุด', 'latest')} ${logs[logs.length - 1].ph}`}>
                <Legend items={[{ name: 'pH', color: 'var(--s1)' }, { name: t(`ช่วงเหมาะสม ${crop.phMin}–${crop.phMax}`, `Target ${crop.phMin}–${crop.phMax}`), color: 'var(--band-strong)' }]} />
                <LineChart labels={labels} ariaLabel="pH" band={{ min: crop.phMin, max: crop.phMax, label: 'target' }} series={[{ name: 'pH', color: 'var(--s1)', values: logs.map((l) => l.ph) }]} />
              </Card>
              <Card title={`EC · ${t('ล่าสุด', 'latest')} ${logs[logs.length - 1].ec} mS/cm`}>
                <Legend items={[{ name: 'EC', color: 'var(--s3)' }, { name: t(`ช่วงเหมาะสม ${crop.ecMin}–${crop.ecMax}`, `Target ${crop.ecMin}–${crop.ecMax}`), color: 'var(--band-strong)' }]} />
                <LineChart labels={labels} ariaLabel="EC" unit=" mS/cm" band={{ min: crop.ecMin, max: crop.ecMax, label: 'target' }} series={[{ name: 'EC', color: 'var(--s3)', values: logs.map((l) => l.ec) }]} />
              </Card>
            </div>
          )}
        </>
      )}

      <div className="grid-2">
        <Card title={t('สูตรสารอาหาร', 'Nutrient recipes')}>
          {db.recipes.length === 0 ? (
            <EmptyState icon="water" title={t('ยังไม่มีสูตร', 'No recipes yet')} text={t('เพิ่มสูตรปุ๋ย A/B ที่ใช้ประจำ', 'Add the A/B mixes you use.')} action={<AddButton label={t('เพิ่มสูตร', 'Add recipe')} onClick={() => ed.openNew()} />} />
          ) : (
            <ul className="list">
              {db.recipes.map((r) => (
                <li key={r.id} className="list-row">
                  <div className="list-main">
                    <div className="list-title">{r.name} {r.cropId && <Pill>{o.cropName(r.cropId)}</Pill>}</div>
                    <div className="list-meta">A {r.aMlPerL} + B {r.bMlPerL} ml/L · EC {r.targetEc} · pH {r.targetPh}</div>
                  </div>
                  <RowActions onEdit={() => ed.openEdit(r)} onDelete={() => ed.askDelete(r.id, r.name)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t('คำนวณการผสมปุ๋ย', 'Mixing calculator')}>
          {db.recipes.length === 0 ? <p className="muted">{t('เพิ่มสูตรก่อนเพื่อใช้เครื่องคำนวณ', 'Add a recipe to use the calculator.')}</p> : (
            <div className="calc">
              <div className="form-grid">
                <div className="field half">
                  <label htmlFor="calc-recipe">{t('สูตร', 'Recipe')}</label>
                  <select id="calc-recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                    {db.recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="field half">
                  <label htmlFor="calc-l">{t('ปริมาณน้ำในถัง', 'Water in tank')} <span className="unit">({t('ลิตร', 'L')})</span></label>
                  <input id="calc-l" type="number" inputMode="decimal" min={0} value={liters} onChange={(e) => setLiters(e.target.value)} />
                </div>
              </div>
              {recipe && (
                <div className="calc-out">
                  <div><span className="muted small">{t('ปุ๋ย A', 'Stock A')}</span><strong>{fmtNum((recipe.aMlPerL * L) / 1000, 2)} L</strong><span className="muted small">{fmtNum(recipe.aMlPerL * L)} ml</span></div>
                  <div><span className="muted small">{t('ปุ๋ย B', 'Stock B')}</span><strong>{fmtNum((recipe.bMlPerL * L) / 1000, 2)} L</strong><span className="muted small">{fmtNum(recipe.bMlPerL * L)} ml</span></div>
                  <div><span className="muted small">{t('เป้าหมาย', 'Target')}</span><strong>EC {recipe.targetEc}</strong><span className="muted small">pH {recipe.targetPh}</span></div>
                </div>
              )}
              <p className="hint">{t('ผสม A ให้เข้ากันก่อน แล้วจึงเติม B ห้ามผสม A กับ B เข้มข้นโดยตรง', 'Mix in A first, then B. Never combine concentrated A and B directly.')}</p>
            </div>
          )}
        </Card>
      </div>
      {ed.element}
    </div>
  );
}
