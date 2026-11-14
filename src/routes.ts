import type { IconName } from './components/Icon';

export type RouteId =
  | 'dashboard' | 'farms' | 'greenhouses' | 'systems' | 'crops' | 'batches' | 'logs'
  | 'nutrients' | 'environment' | 'photos' | 'harvest' | 'inventory' | 'finance' | 'analytics';

export interface RouteDef { id: RouteId; icon: IconName; th: string; en: string; group: 'main' | 'grow' | 'setup' | 'business' }

export const ROUTES: RouteDef[] = [
  { id: 'dashboard', icon: 'dashboard', th: 'ภาพรวม', en: 'Dashboard', group: 'main' },
  { id: 'batches', icon: 'batch', th: 'รอบการปลูก', en: 'Planting Batches', group: 'grow' },
  { id: 'logs', icon: 'log', th: 'บันทึกประจำวัน', en: 'Daily Logs', group: 'grow' },
  { id: 'photos', icon: 'photo', th: 'คลังภาพ', en: 'Photo Gallery', group: 'grow' },
  { id: 'harvest', icon: 'harvest', th: 'เก็บเกี่ยวและผลผลิต', en: 'Harvest & Yield', group: 'grow' },
  { id: 'nutrients', icon: 'water', th: 'น้ำและสารอาหาร', en: 'Water & Nutrients', group: 'grow' },
  { id: 'environment', icon: 'env', th: 'สภาพแวดล้อม', en: 'Environment', group: 'grow' },
  { id: 'crops', icon: 'crop', th: 'คลังข้อมูลพืช', en: 'Crop Library', group: 'setup' },
  { id: 'farms', icon: 'farm', th: 'ฟาร์ม', en: 'Farms', group: 'setup' },
  { id: 'greenhouses', icon: 'greenhouse', th: 'โรงเรือน', en: 'Greenhouses', group: 'setup' },
  { id: 'systems', icon: 'system', th: 'ระบบปลูก', en: 'Growing Systems', group: 'setup' },
  { id: 'inventory', icon: 'inventory', th: 'คลังวัสดุ', en: 'Inventory', group: 'business' },
  { id: 'finance', icon: 'money', th: 'ต้นทุนและรายได้', en: 'Costs & Revenue', group: 'business' },
  { id: 'analytics', icon: 'analytics', th: 'วิเคราะห์ข้อมูล', en: 'Analytics', group: 'business' },
];

export const GROUPS: Record<RouteDef['group'], [string, string]> = {
  main: ['หลัก', 'Main'],
  grow: ['การเพาะปลูก', 'Growing'],
  setup: ['ตั้งค่าฟาร์ม', 'Farm setup'],
  business: ['ธุรกิจ', 'Business'],
};

/** Shown in the phone bottom bar; everything else is under "More". */
export const MOBILE_TABS: RouteId[] = ['dashboard', 'batches', 'logs', 'harvest'];

/** Short labels for the phone tab bar. */
export const TAB_LABELS: Partial<Record<RouteId, [string, string]>> = {
  dashboard: ['ภาพรวม', 'Home'],
  batches: ['รอบปลูก', 'Batches'],
  logs: ['บันทึก', 'Logs'],
  harvest: ['เก็บเกี่ยว', 'Harvest'],
};

export const isRoute = (s: string): s is RouteId => ROUTES.some((r) => r.id === s);
