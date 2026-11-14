import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'th' | 'en';

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Pick the Thai or English string. Keeps translations next to where they are used. */
  t: (th: string, en: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('fm-lang') as Lang) || 'th';
    } catch {
      return 'th';
    }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('fm-lang', l);
    } catch {
      /* storage unavailable: language just won't be remembered */
    }
  };
  const t = (th: string, en: string) => (lang === 'th' ? th : en);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useT outside provider');
  return v;
};

/** Shared option labels used in several screens. */
export const LABELS = {
  status: {
    seedling: ['ต้นกล้า', 'Seedling'],
    growing: ['กำลังเติบโต', 'Growing'],
    ready: ['พร้อมเก็บเกี่ยว', 'Ready to harvest'],
    harvested: ['เก็บเกี่ยวแล้ว', 'Harvested'],
  },
  activity: {
    water: ['เติมน้ำ', 'Water top-up'],
    nutrient: ['เติมปุ๋ย', 'Nutrient top-up'],
    ph_adjust: ['ปรับ pH', 'pH adjust'],
    prune: ['ตัดแต่งใบ', 'Pruning'],
    pest_check: ['ตรวจแมลง/โรค', 'Pest check'],
    clean: ['ทำความสะอาด', 'Cleaning'],
    transplant: ['ย้ายปลูก', 'Transplant'],
  },
  cropCategory: {
    lettuce: ['ผักสลัด', 'Lettuce'],
    herb: ['สมุนไพร', 'Herb'],
    leafy: ['ผักใบ', 'Leafy green'],
    fruit: ['ผักผล', 'Fruiting'],
  },
  ghType: {
    greenhouse: ['โรงเรือน', 'Greenhouse'],
    vertical: ['Vertical Farm', 'Vertical farm'],
    nethouse: ['โรงเรือนตาข่าย', 'Net house'],
  },
  systemType: {
    NFT: ['NFT (รางน้ำไหลบาง)', 'NFT'],
    DFT: ['DFT (น้ำลึก)', 'DFT'],
    Tower: ['Tower (แนวตั้ง)', 'Vertical tower'],
    DutchBucket: ['Dutch Bucket', 'Dutch bucket'],
    Ebb: ['Ebb & Flow', 'Ebb & flow'],
  },
  invCategory: {
    seed: ['เมล็ดพันธุ์', 'Seeds'],
    nutrient: ['ปุ๋ย/สารละลาย', 'Nutrients'],
    media: ['วัสดุปลูก', 'Growing media'],
    packaging: ['บรรจุภัณฑ์', 'Packaging'],
    equipment: ['อุปกรณ์', 'Equipment'],
  },
  txCategory: {
    seed: ['เมล็ดพันธุ์', 'Seeds'],
    nutrient: ['ปุ๋ย', 'Nutrients'],
    electricity: ['ค่าไฟ', 'Electricity'],
    labor: ['ค่าแรง', 'Labor'],
    packaging: ['บรรจุภัณฑ์', 'Packaging'],
    equipment: ['อุปกรณ์', 'Equipment'],
    sales: ['ขายผลผลิต', 'Produce sales'],
    other: ['อื่น ๆ', 'Other'],
  },
  grade: {
    A: ['เกรด A (ดีมาก)', 'Grade A (premium)'],
    B: ['เกรด B (ดี)', 'Grade B (standard)'],
    C: ['เกรด C (ตกเกรด)', 'Grade C (low)'],
  },
} as const;

export function useLabel() {
  const { lang } = useT();
  return <G extends keyof typeof LABELS>(group: G, key: keyof (typeof LABELS)[G]) => {
    const pair = (LABELS[group] as Record<string, readonly [string, string]>)[key as string];
    return pair ? pair[lang === 'th' ? 0 : 1] : String(key);
  };
}
