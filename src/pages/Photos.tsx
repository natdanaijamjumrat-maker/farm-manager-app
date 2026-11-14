import { useState, type ChangeEvent } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import { AddButton, EmptyState, PageHeader } from '../components/ui';
import { Modal, ConfirmDialog } from '../components/Modal';
import { PlantArt } from '../components/PlantArt';
import { useOptions } from '../lib/options';
import { diffDays, fmtDate, today } from '../lib/date';
import { newId } from '../lib/id';
import type { Photo } from '../types';
import type { RouteId } from '../routes';
import { Icon } from '../components/Icon';

export function Photos({ go }: { go: (r: RouteId) => void }) {
  const { db, upsert, remove, notify } = useStore();
  const { t, lang } = useT();
  const o = useOptions();
  const [batch, setBatch] = useState('');
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<Photo | null>(null);
  const [del, setDel] = useState<Photo | null>(null);
  const [form, setForm] = useState({ batchId: '', date: today(), caption: '', url: '' });
  const [err, setErr] = useState('');

  const hueFor = (batchId: string): 'green' | 'red' | 'herb' => {
    const c = db.crops.find((x) => x.id === db.batches.find((b) => b.id === batchId)?.cropId);
    return c?.id === 'crop_ro' ? 'red' : c?.category === 'herb' ? 'herb' : 'green';
  };
  const dayOf = (p: Photo) => {
    const b = db.batches.find((x) => x.id === p.batchId);
    return b ? Math.max(0, diffDays(p.date, b.sowDate)) : 0;
  };

  const photos = db.photos.filter((p) => !batch || p.batchId === batch);
  const groups = db.batches
    .map((b) => ({ b, items: photos.filter((p) => p.batchId === b.id).sort((x, y) => y.date.localeCompare(x.date)) }))
    .filter((g) => g.items.length > 0);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr(t('กรุณาเลือกไฟล์รูปภาพ', 'Please choose an image file')); return; }
    setForm((s) => ({ ...s, url: URL.createObjectURL(f) }));
    setErr('');
  };

  const save = () => {
    if (!form.batchId) { setErr(t('กรุณาเลือกรอบปลูก', 'Please choose a batch')); return; }
    upsert('photos', { id: newId('photo'), batchId: form.batchId, date: form.date, caption: form.caption || t('ภาพการเติบโต', 'Growth photo'), url: form.url || undefined });
    notify(t('เพิ่มรูปภาพแล้ว (ในต้นแบบนี้)', 'Photo added (in this prototype)'));
    setAdding(false);
  };

  const openAdd = () => { setForm({ batchId: batch || db.batches.find((b) => b.status !== 'harvested')?.id || '', date: today(), caption: '', url: '' }); setErr(''); setAdding(true); };

  const Thumb = ({ p }: { p: Photo }) => p.url
    ? <img src={p.url} alt={p.caption} className="photo-img" />
    : <PlantArt day={dayOf(p)} hue={hueFor(p.batchId)} label={`${o.batchCode(p.batchId)} ${p.caption}`} />;

  return (
    <div className="page">
      <PageHeader title={t('คลังภาพการเติบโต', 'Photo Gallery')} subtitle={t('ภาพพืชแยกตามรอบปลูกและวันที่', 'Plant photos by batch and date')}
        action={db.batches.length > 0 ? <AddButton label={t('เพิ่มรูปภาพ', 'Add photo')} onClick={openAdd} /> : undefined} />

      {db.batches.length === 0 ? (
        <EmptyState icon="photo" title={t('ยังไม่มีรอบปลูก', 'No batches yet')} text={t('รูปภาพจะถูกจัดกลุ่มตามรอบปลูก สร้างรอบปลูกก่อน', 'Photos are grouped by batch. Create a batch first.')}
          action={<button type="button" className="btn btn-primary" onClick={() => go('batches')}>{t('ไปที่รอบการปลูก', 'Go to batches')}</button>} />
      ) : (
        <>
          <div className="toolbar">
            <label className="select-inline">
              <span>{t('รอบปลูก', 'Batch')}</span>
              <select id="photo-filter" value={batch} onChange={(e) => setBatch(e.target.value)}>
                <option value="">{t('ทุกรอบ', 'All batches')}</option>
                {o.batches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <span className="muted small">{t('ภาพวาดจำลองแทนภาพจริงในข้อมูลตัวอย่าง', 'Sample entries use illustrations instead of real photos')}</span>
          </div>
          {groups.length === 0 ? (
            <EmptyState icon="photo" title={t('ยังไม่มีรูปภาพ', 'No photos yet')} text={t('อัปโหลดรูปจากมือถือหรือคอมพิวเตอร์ เพื่อติดตามการเติบโต', 'Upload a photo from your phone or computer to track growth.')} action={<AddButton label={t('เพิ่มรูปภาพ', 'Add photo')} onClick={openAdd} />} />
          ) : groups.map(({ b, items }) => (
            <section key={b.id} className="photo-group">
              <h2 className="section-title"><span className="mono">{b.code}</span> <span className="muted">· {o.cropName(b.cropId)} · {items.length} {t('รูป', 'photos')}</span></h2>
              <div className="photo-grid">
                {items.map((p) => (
                  <button type="button" key={p.id} className="photo" onClick={() => setView(p)}>
                    <Thumb p={p} />
                    <span className="photo-cap">
                      <strong>{t(`วันที่ ${dayOf(p)}`, `Day ${dayOf(p)}`)}</strong>
                      <span>{fmtDate(p.date, lang, { day: 'numeric', month: 'short' })}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {adding && (
        <Modal title={t('เพิ่มรูปภาพ', 'Add photo')} onClose={() => setAdding(false)}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>{t('ยกเลิก', 'Cancel')}</button><button type="button" className="btn btn-primary" onClick={save}>{t('บันทึก', 'Save')}</button></>}>
          <div className="form-grid">
            <div className="field half">
              <label htmlFor="ph-batch">{t('รอบปลูก', 'Batch')}<span className="req"> *</span></label>
              <select id="ph-batch" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
                <option value="">{t('— เลือก —', '— Select —')}</option>
                {o.batches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="field half">
              <label htmlFor="ph-date">{t('วันที่ถ่าย', 'Date taken')}</label>
              <input id="ph-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="ph-cap">{t('คำบรรยาย', 'Caption')}</label>
              <input id="ph-cap" type="text" value={form.caption} placeholder={t('เช่น ใบเริ่มห่อ', 'e.g. heads starting to form')} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="field">
              <span className="label-text">{t('ไฟล์รูปภาพ', 'Image file')}</span>
              <label htmlFor="ph-file" className="upload">
                {form.url ? <img src={form.url} alt="" /> : <><Icon name="upload" size={24} /><span>{t('แตะเพื่อเลือกรูป หรือถ่ายรูป', 'Tap to choose or take a photo')}</span></>}
              </label>
              <input id="ph-file" className="sr-only" type="file" accept="image/*" onChange={onFile} />
              <p className="hint">{t('ไม่บังคับ ถ้าไม่เลือกจะแสดงภาพวาดจำลอง รูปจะอยู่ในหน้านี้ชั่วคราวเท่านั้น', 'Optional. Without a file an illustration is shown. The image stays in this tab only.')}</p>
            </div>
            {err && <p className="err">{err}</p>}
          </div>
        </Modal>
      )}

      {view && (
        <Modal title={`${o.batchCode(view.batchId)} · ${t(`วันที่ ${dayOf(view)}`, `Day ${dayOf(view)}`)}`} onClose={() => setView(null)}
          footer={<><button type="button" className="btn btn-danger" onClick={() => { setDel(view); setView(null); }}>{t('ลบรูป', 'Delete photo')}</button><button type="button" className="btn btn-primary" onClick={() => setView(null)}>{t('ปิด', 'Close')}</button></>}>
          <div className="photo-large"><Thumb p={view} /></div>
          <p><strong>{view.caption}</strong></p>
          <p className="muted">{o.cropName(db.batches.find((b) => b.id === view.batchId)?.cropId)} · {fmtDate(view.date, lang)}</p>
        </Modal>
      )}
      {del && <ConfirmDialog title={t('ลบรูปนี้?', 'Delete this photo?')} message={t('รูปจะถูกลบออกจากต้นแบบนี้', 'The photo will be removed from this prototype.')} confirmLabel={t('ลบ', 'Delete')} danger
        onCancel={() => setDel(null)} onConfirm={() => { remove('photos', del.id); notify(t('ลบแล้ว', 'Deleted')); setDel(null); }} />}
    </div>
  );
}
