import { useStore } from '../store';
import { useT, useLabel } from '../i18n';
import { AddButton, EmptyState, PageHeader, Pill, Progress } from '../components/ui';
import { useEditor, RowActions } from '../components/useEditor';
import { Table, type Col } from '../components/Table';
import { useOptions } from '../lib/options';
import { aliveCount, fmtNum } from '../lib/selectors';
import type { FieldDef } from '../components/EntityForm';
import type { Farm, Greenhouse, GrowingSystem } from '../types';
import type { RouteId } from '../routes';

export function Farms() {
  const { db } = useStore();
  const { t } = useT();
  const fields: FieldDef[] = [
    { key: 'name', label: t('ชื่อฟาร์ม', 'Farm name'), type: 'text', required: true },
    { key: 'location', label: t('ที่ตั้ง', 'Location'), type: 'text', required: true, half: true, placeholder: t('อำเภอ, จังหวัด', 'District, Province') },
    { key: 'owner', label: t('ผู้ดูแล', 'Manager'), type: 'text', half: true },
    { key: 'areaSqm', label: t('พื้นที่', 'Area'), type: 'number', unit: t('ตร.ม.', 'm²'), min: 0, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];
  const ed = useEditor({ collection: 'farms', noun: t('ฟาร์ม', 'farm'), fields, defaults: () => ({}) });
  const cols: Col<Farm>[] = [
    { key: 'name', head: t('ชื่อฟาร์ม', 'Farm'), cell: (f) => <strong>{f.name}</strong> },
    { key: 'loc', head: t('ที่ตั้ง', 'Location'), cell: (f) => f.location },
    { key: 'owner', head: t('ผู้ดูแล', 'Manager'), cell: (f) => f.owner || '–' },
    { key: 'area', head: t('พื้นที่ (ตร.ม.)', 'Area (m²)'), num: true, cell: (f) => fmtNum(f.areaSqm || 0) },
    { key: 'gh', head: t('โรงเรือน', 'Greenhouses'), num: true, cell: (f) => db.greenhouses.filter((g) => g.farmId === f.id).length },
  ];
  return (
    <div className="page">
      <PageHeader title={t('ฟาร์ม', 'Farms')} subtitle={t('ข้อมูลสถานที่ปลูก', 'Your growing sites')} action={<AddButton label={t('เพิ่มฟาร์ม', 'Add farm')} onClick={() => ed.openNew()} />} />
      {db.farms.length === 0
        ? <EmptyState icon="farm" title={t('ยังไม่มีฟาร์ม', 'No farms yet')} text={t('เพิ่มฟาร์มแรกเพื่อเริ่มจัดโรงเรือนและระบบปลูก', 'Add your first farm to organise greenhouses and systems.')} action={<AddButton label={t('เพิ่มฟาร์ม', 'Add farm')} onClick={() => ed.openNew()} />} />
        : <Table rows={db.farms} cols={cols} actions={(f) => <RowActions onEdit={() => ed.openEdit(f)} onDelete={() => ed.askDelete(f.id, f.name)} />} />}
      {ed.element}
    </div>
  );
}

export function Greenhouses({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t } = useT();
  const label = useLabel();
  const o = useOptions();
  const fields: FieldDef[] = [
    { key: 'name', label: t('ชื่อโรงเรือน', 'Name'), type: 'text', required: true, half: true },
    { key: 'farmId', label: t('ฟาร์ม', 'Farm'), type: 'select', options: o.farms, required: true, half: true },
    { key: 'type', label: t('ประเภท', 'Type'), type: 'select', options: o.fromLabels('ghType'), required: true, half: true },
    { key: 'areaSqm', label: t('พื้นที่', 'Area'), type: 'number', unit: t('ตร.ม.', 'm²'), min: 0, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea', placeholder: t('เช่น ระบบพัดลม แสง LED', 'e.g. cooling, LED lighting') },
  ];
  const ed = useEditor({ collection: 'greenhouses', noun: t('โรงเรือน', 'greenhouse'), fields, defaults: () => ({ type: 'greenhouse', farmId: db.farms[0]?.id ?? '' }) });
  return (
    <div className="page">
      <PageHeader title={t('โรงเรือน', 'Greenhouses')} subtitle={t('โรงเรือนและห้องปลูกแนวตั้ง', 'Greenhouses and vertical farm rooms')}
        action={db.farms.length ? <AddButton label={t('เพิ่มโรงเรือน', 'Add greenhouse')} onClick={() => ed.openNew()} /> : undefined} />
      {db.farms.length === 0 ? (
        <EmptyState icon="greenhouse" title={t('ต้องมีฟาร์มก่อน', 'Add a farm first')} text={t('โรงเรือนต้องอยู่ภายใต้ฟาร์ม', 'Each greenhouse belongs to a farm.')} action={<button type="button" className="btn btn-primary" onClick={() => go('farms')}>{t('ไปที่ฟาร์ม', 'Go to farms')}</button>} />
      ) : db.greenhouses.length === 0 ? (
        <EmptyState icon="greenhouse" title={t('ยังไม่มีโรงเรือน', 'No greenhouses yet')} text={t('เพิ่มโรงเรือนหรือห้อง Vertical Farm', 'Add a greenhouse or vertical farm room.')} action={<AddButton label={t('เพิ่มโรงเรือน', 'Add greenhouse')} onClick={() => ed.openNew()} />} />
      ) : (
        <div className="cards">
          {db.greenhouses.map((g: Greenhouse) => {
            const sys = db.systems.filter((s) => s.greenhouseId === g.id);
            const cap = sys.reduce((s, x) => s + x.capacity, 0);
            const used = db.batches.filter((b) => b.status !== 'harvested' && sys.some((s) => s.id === b.systemId)).reduce((s, b) => s + aliveCount(db, b), 0);
            return (
              <article key={g.id} className="card">
                <div className="crop-top">
                  <div><h3>{g.name}</h3><div className="muted small">{db.farms.find((f) => f.id === g.farmId)?.name} · {fmtNum(g.areaSqm || 0)} {t('ตร.ม.', 'm²')}</div></div>
                  <Pill tone="accent">{label('ghType', g.type)}</Pill>
                </div>
                <div className="small">{t('ใช้พื้นที่ปลูก', 'Plant sites in use')}: <strong>{fmtNum(used)}</strong> / {fmtNum(cap)}</div>
                <Progress value={cap ? used / cap : 0} />
                <div className="muted small">{sys.length} {t('ระบบปลูก', 'systems')}{g.notes ? ` · ${g.notes}` : ''}</div>
                <div className="card-foot"><span /><RowActions onEdit={() => ed.openEdit(g)} onDelete={() => ed.askDelete(g.id, g.name)} /></div>
              </article>
            );
          })}
        </div>
      )}
      {ed.element}
    </div>
  );
}

export function Systems({ go }: { go: (r: RouteId) => void }) {
  const { db } = useStore();
  const { t } = useT();
  const label = useLabel();
  const o = useOptions();
  const fields: FieldDef[] = [
    { key: 'name', label: t('ชื่อระบบ', 'Name'), type: 'text', required: true, half: true, placeholder: 'NFT Rack A3' },
    { key: 'greenhouseId', label: t('โรงเรือน', 'Greenhouse'), type: 'select', options: o.greenhouses, required: true, half: true },
    { key: 'type', label: t('ประเภทระบบ', 'System type'), type: 'select', options: o.fromLabels('systemType'), required: true, half: true },
    { key: 'capacity', label: t('จำนวนช่องปลูก', 'Plant sites'), type: 'number', min: 1, required: true, half: true },
    { key: 'tankLiters', label: t('ขนาดถังสารละลาย', 'Reservoir size'), type: 'number', unit: t('ลิตร', 'L'), min: 0, half: true },
    { key: 'notes', label: t('หมายเหตุ', 'Notes'), type: 'textarea' },
  ];
  const ed = useEditor({ collection: 'systems', noun: t('ระบบปลูก', 'growing system'), fields, defaults: () => ({ type: 'NFT', greenhouseId: db.greenhouses[0]?.id ?? '' }) });
  const cols: Col<GrowingSystem>[] = [
    { key: 'name', head: t('ชื่อระบบ', 'System'), cell: (s) => <strong>{s.name}</strong> },
    { key: 'type', head: t('ประเภท', 'Type'), cell: (s) => <Pill>{label('systemType', s.type)}</Pill> },
    { key: 'gh', head: t('โรงเรือน', 'Greenhouse'), cell: (s) => db.greenhouses.find((g) => g.id === s.greenhouseId)?.name ?? '–' },
    { key: 'cap', head: t('ช่องปลูก', 'Sites'), num: true, cell: (s) => fmtNum(s.capacity) },
    { key: 'tank', head: t('ถัง (ลิตร)', 'Tank (L)'), num: true, cell: (s) => fmtNum(s.tankLiters || 0) },
    { key: 'now', head: t('กำลังปลูก', 'Now growing'), cell: (s) => {
      const bs = db.batches.filter((b) => b.systemId === s.id && b.status !== 'harvested');
      return bs.length ? bs.map((b) => <div key={b.id} className="mono small">{b.code}</div>) : <span className="muted">{t('ว่าง', 'Empty')}</span>;
    } },
  ];
  return (
    <div className="page">
      <PageHeader title={t('ระบบปลูก', 'Growing Systems')} subtitle={t('ราง NFT, บ่อ DFT, หอปลูกแนวตั้ง', 'NFT channels, DFT ponds, vertical towers')}
        action={db.greenhouses.length ? <AddButton label={t('เพิ่มระบบปลูก', 'Add system')} onClick={() => ed.openNew()} /> : undefined} />
      {db.greenhouses.length === 0 ? (
        <EmptyState icon="system" title={t('ต้องมีโรงเรือนก่อน', 'Add a greenhouse first')} text={t('ระบบปลูกต้องติดตั้งอยู่ในโรงเรือน', 'Each system sits inside a greenhouse.')} action={<button type="button" className="btn btn-primary" onClick={() => go('greenhouses')}>{t('ไปที่โรงเรือน', 'Go to greenhouses')}</button>} />
      ) : db.systems.length === 0 ? (
        <EmptyState icon="system" title={t('ยังไม่มีระบบปลูก', 'No systems yet')} text={t('เพิ่มระบบปลูกเพื่อใช้กับรอบปลูก', 'Add a system to use it for batches.')} action={<AddButton label={t('เพิ่มระบบปลูก', 'Add system')} onClick={() => ed.openNew()} />} />
      ) : <Table rows={db.systems} cols={cols} actions={(s) => <RowActions onEdit={() => ed.openEdit(s)} onDelete={() => ed.askDelete(s.id, s.name)} />} />}
      {ed.element}
    </div>
  );
}
