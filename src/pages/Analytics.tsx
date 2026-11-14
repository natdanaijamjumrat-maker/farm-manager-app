import { useStore } from '../store';
import { useT } from '../i18n';
import { Card, EmptyState, PageHeader, Stat } from '../components/ui';
import { BarChart, Legend } from '../components/Charts';
import { useOptions } from '../lib/options';
import { fmtNum, fmtTHB, netKg, survivalRate } from '../lib/selectors';
import type { RouteId } from '../routes';

export function Analytics({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t } = useT();
  const o = useOptions();

  const cropYield = db.crops.map((c) => {
    const hs = db.harvests.filter((h) => db.batches.find((b) => b.id === h.batchId)?.cropId === c.id);
    const net = hs.reduce((s, h) => s + netKg(h), 0);
    const plants = hs.reduce((s, h) => s + h.plantCount, 0);
    return { c, net, gPerPlant: plants ? (net * 1000) / plants : 0, expected: c.expectedYieldG };
  }).filter((x) => x.net > 0);

  const batches = [...db.batches].sort((a, b) => a.sowDate.localeCompare(b.sowDate));
  const cost = db.transactions.filter((x) => x.type === 'cost').reduce((s, x) => s + x.amount, 0);
  const rev = db.transactions.filter((x) => x.type === 'revenue').reduce((s, x) => s + x.amount, 0);
  const totalNet = db.harvests.reduce((s, h) => s + netKg(h), 0);
  const avgSurv = batches.length ? batches.reduce((s, b) => s + survivalRate(db, b), 0) / batches.length : 0;

  if (db.batches.length === 0) {
    return (
      <div className="page">
        <PageHeader title={t('วิเคราะห์ข้อมูล', 'Analytics')} />
        <EmptyState icon="analytics" title={t('ยังไม่มีข้อมูลให้วิเคราะห์', 'Nothing to analyse yet')} text={t('เมื่อมีรอบปลูกและการเก็บเกี่ยว กราฟเปรียบเทียบจะแสดงที่นี่', 'Comparisons appear here once you have batches and harvests.')} action={<button type="button" className="btn btn-primary" onClick={() => go('batches')}>{t('ไปที่รอบการปลูก', 'Go to batches')}</button>} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title={t('วิเคราะห์ข้อมูล', 'Analytics')} subtitle={t('เปรียบเทียบผลผลิต อัตรารอด และต้นทุน', 'Compare yield, survival and cost')} />
      <div className="stats">
        <Stat label={t('ต้นทุนต่อ กก.', 'Cost per kg')} value={totalNet ? fmtTHB(cost / totalNet) : '–'} sub={t('ต้นทุนรวม ÷ ผลผลิตสุทธิ', 'Total cost ÷ net yield')} />
        <Stat label={t('รายได้ต่อ กก.', 'Revenue per kg')} value={totalNet ? fmtTHB(rev / totalNet) : '–'} />
        <Stat label={t('อัตรารอดเฉลี่ย', 'Average survival')} value={fmtNum(avgSurv * 100, 1)} unit="%" tone={avgSurv >= 0.9 ? 'good' : 'warn'} sub={t(`${batches.length} รอบปลูก`, `${batches.length} batches`)} />
      </div>
      <div className="grid-2">
        <Card title={t('อัตรารอดแต่ละรอบปลูก (%)', 'Survival by batch (%)')}>
          <BarChart labels={batches.map((b) => b.code)} ariaLabel="Survival by batch" unit="%"
            series={[{ name: t('อัตรารอด', 'Survival'), color: 'var(--accent)', values: batches.map((b) => Number((survivalRate(db, b) * 100).toFixed(1))) }]} />
        </Card>
        <Card title={t('น้ำหนักต่อต้น: จริง vs คาดการณ์ (กรัม)', 'Grams per plant: actual vs expected')}>
          {cropYield.length === 0 ? <p className="muted">{t('ยังไม่มีการเก็บเกี่ยว', 'No harvests yet.')}</p> : (
            <>
              <Legend items={[{ name: t('จริง', 'Actual'), color: 'var(--s1)' }, { name: t('คาดการณ์', 'Expected'), color: 'var(--s3)' }]} />
              <BarChart labels={cropYield.map((x) => o.cropName(x.c.id))} ariaLabel="Yield per plant" unit=" g"
                series={[{ name: t('จริง', 'Actual'), color: 'var(--s1)', values: cropYield.map((x) => Math.round(x.gPerPlant)) }, { name: t('คาดการณ์', 'Expected'), color: 'var(--s3)', values: cropYield.map((x) => x.expected) }]} />
            </>
          )}
        </Card>
      </div>
      <Card title={t('ผลผลิตสุทธิตามชนิดผัก (กก.)', 'Net yield by crop (kg)')}>
        {cropYield.length === 0 ? <p className="muted">{t('ยังไม่มีการเก็บเกี่ยว', 'No harvests yet.')}</p> : (
          <ul className="bars">
            {cropYield.sort((a, b) => b.net - a.net).map((x) => (
              <li key={x.c.id}>
                <div className="bars-label"><span>{o.cropName(x.c.id)}</span><span className="num">{fmtNum(x.net, 1)} kg</span></div>
                <div className="bars-track"><span style={{ width: `${(x.net / cropYield[0].net) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
