import { useStore } from '../store';
import { useT, LABELS } from '../i18n';
import type { Option } from '../components/EntityForm';

export function useOptions() {
  const { db } = useStore();
  const { t, lang } = useT();
  const fromLabels = (g: keyof typeof LABELS): Option[] =>
    Object.entries(LABELS[g]).map(([value, pair]) => ({ value, label: (pair as readonly string[])[lang === 'th' ? 0 : 1] }));
  const cropName = (id?: string) => {
    const c = db.crops.find((x) => x.id === id);
    return c ? t(c.nameTh, c.nameEn) : t('ไม่ระบุ', 'Unknown');
  };
  return {
    crops: db.crops.map((c) => ({ value: c.id, label: t(c.nameTh, c.nameEn) })),
    batches: db.batches.map((b) => ({ value: b.id, label: `${b.code} · ${cropName(b.cropId)}` })),
    systems: db.systems.map((s) => ({ value: s.id, label: s.name })),
    greenhouses: db.greenhouses.map((g) => ({ value: g.id, label: g.name })),
    farms: db.farms.map((f) => ({ value: f.id, label: f.name })),
    fromLabels,
    cropName,
    batchCode: (id?: string) => db.batches.find((b) => b.id === id)?.code ?? t('ไม่ระบุ', 'Unknown'),
  };
}
