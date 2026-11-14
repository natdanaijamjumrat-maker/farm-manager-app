import { useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import { Card, EmptyState, PageHeader, Segmented, Stat } from '../components/ui';
import { LineChart, Legend } from '../components/Charts';
import { addDays, fmtDate, today } from '../lib/date';
import type { RouteId } from '../routes';

export function Environment({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t, lang } = useT();
  const [gh, setGh] = useState(db.greenhouses[0]?.id ?? '');
  const [range, setRange] = useState<'7' | '14' | '21'>('14');
  const td = today();
  const sysIds = db.systems.filter((s) => s.greenhouseId === gh).map((s) => s.id);
  const batchIds = db.batches.filter((b) => sysIds.includes(b.systemId)).map((b) => b.id);
  const logs = db.logs.filter((l) => batchIds.includes(l.batchId));
  const days = Array.from({ length: Number(range) }, (_, i) => addDays(td, i - Number(range) + 1));
  const avg = (d: string, f: 'temperature' | 'humidity') => {
    const ls = logs.filter((l) => l.date === d);
    return ls.length ? Number((ls.reduce((s, l) => s + l[f], 0) / ls.length).toFixed(1)) : null;
  };
  const temps = days.map((d) => avg(d, 'temperature'));
  const hums = days.map((d) => avg(d, 'humidity'));
  const last = <T,>(a: (T | null)[]) => [...a].reverse().find((x) => x !== null) ?? null;
  const vals = temps.filter((x): x is number => x !== null);
  const crops = db.crops.filter((c) => db.batches.some((b) => batchIds.includes(b.id) && b.status !== 'harvested' && b.cropId === c.id));
  const tMin = crops.length ? Math.max(...crops.map((c) => c.tempMin)) : 18;
  const tMax = crops.length ? Math.min(...crops.map((c) => c.tempMax)) : 28;
  const curT = last(temps);
  const curH = last(hums);

  return (
    <div className="page">
      <PageHeader title={t('สภาพแวดล้อม', 'Environment Monitoring')} subtitle={t('อุณหภูมิและความชื้นจากบันทึกประจำวัน', 'Temperature and humidity from daily logs')} />
      <p className="muted small">{t('ต้นแบบนี้ใช้ค่าจากบันทึกประจำวัน ในอนาคตสามารถเชื่อมเซ็นเซอร์ IoT ได้', 'This prototype uses values from daily logs. Live IoT sensors can be connected later.')}</p>
      {db.greenhouses.length === 0 ? (
        <EmptyState icon="env" title={t('ยังไม่มีโรงเรือน', 'No greenhouses yet')} text={t('เพิ่มโรงเรือนเพื่อดูข้อมูลสภาพแวดล้อม', 'Add a greenhouse to see its environment.')} action={<button type="button" className="btn btn-primary" onClick={() => go('greenhouses')}>{t('ไปที่โรงเรือน', 'Go to greenhouses')}</button>} />
      ) : (
        <>
          <div className="toolbar">
            <Segmented label={t('โรงเรือน', 'Greenhouse')} value={gh} onChange={setGh} options={db.greenhouses.map((g) => ({ value: g.id, label: g.name }))} />
            <Segmented label={t('ช่วงเวลา', 'Range')} value={range} onChange={setRange} options={[{ value: '7', label: t('7 วัน', '7 days') }, { value: '14', label: t('14 วัน', '14 days') }, { value: '21', label: t('21 วัน', '21 days') }]} />
          </div>
          {vals.length === 0 ? (
            <EmptyState icon="env" title={t('ไม่มีข้อมูลในช่วงนี้', 'No readings in this range')} text={t('บันทึกอุณหภูมิและความชื้นในหน้า “บันทึกประจำวัน”', 'Record temperature and humidity on the Daily Logs page.')} action={<button type="button" className="btn btn-primary" onClick={() => go('logs')}>{t('ไปที่บันทึกประจำวัน', 'Go to daily logs')}</button>} />
          ) : (
            <>
              <div className="stats">
                <Stat label={t('อุณหภูมิล่าสุด', 'Latest temperature')} value={curT === null ? '–' : String(curT)} unit="°C" sub={curT !== null && (curT < tMin || curT > tMax) ? t(`นอกช่วง ${tMin}–${tMax}°C`, `Outside ${tMin}–${tMax}°C`) : t(`อยู่ในช่วง ${tMin}–${tMax}°C`, `Within ${tMin}–${tMax}°C`)} tone={curT !== null && (curT < tMin || curT > tMax) ? 'warn' : 'good'} />
                <Stat label={t('ความชื้นล่าสุด', 'Latest humidity')} value={curH === null ? '–' : String(curH)} unit="%" sub={curH !== null && curH > 85 ? t('สูง เสี่ยงโรคเชื้อรา', 'High: fungal risk') : t('ปกติ (50–85%)', 'Normal (50–85%)')} tone={curH !== null && curH > 85 ? 'warn' : 'good'} />
                <Stat label={t('สูงสุด / ต่ำสุด', 'High / low')} value={`${Math.max(...vals)} / ${Math.min(...vals)}`} unit="°C" sub={t(`${range} วันล่าสุด`, `Last ${range} days`)} />
              </div>
              <div className="grid-2">
                <Card title={t('อุณหภูมิ (°C)', 'Temperature (°C)')}>
                  <Legend items={[{ name: t('อุณหภูมิเฉลี่ย', 'Average temperature'), color: 'var(--s2)' }, { name: t(`ช่วงเหมาะสม ${tMin}–${tMax}°C`, `Target ${tMin}–${tMax}°C`), color: 'var(--band-strong)' }]} />
                  <LineChart labels={days.map((d) => fmtDate(d, lang, { day: 'numeric', month: 'short' }))} ariaLabel="Temperature" unit="°C" band={{ min: tMin, max: tMax, label: 'target' }} series={[{ name: t('อุณหภูมิ', 'Temperature'), color: 'var(--s2)', values: temps }]} />
                </Card>
                <Card title={t('ความชื้นสัมพัทธ์ (%)', 'Relative humidity (%)')}>
                  <Legend items={[{ name: t('ความชื้นเฉลี่ย', 'Average humidity'), color: 'var(--s1)' }, { name: t('ช่วงปกติ 50–85%', 'Normal 50–85%'), color: 'var(--band-strong)' }]} />
                  <LineChart labels={days.map((d) => fmtDate(d, lang, { day: 'numeric', month: 'short' }))} ariaLabel="Humidity" unit="%" band={{ min: 50, max: 85, label: 'normal' }} series={[{ name: t('ความชื้น', 'Humidity'), color: 'var(--s1)', values: hums }]} />
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
