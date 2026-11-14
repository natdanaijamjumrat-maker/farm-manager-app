/**
 * Domain model for Farm Manager.
 * Each interface maps 1:1 to a future Supabase table (see docs/supabase-schema.sql).
 * Field names use camelCase here; the SQL uses snake_case.
 * IDs are strings so they can become UUIDs later without code changes.
 */

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'

export interface Farm {
  id: ID;
  name: string;
  location: string;
  areaSqm: number;
  owner: string;
  notes?: string;
}

export type GreenhouseType = 'greenhouse' | 'vertical' | 'nethouse';
export interface Greenhouse {
  id: ID;
  farmId: ID;
  name: string;
  type: GreenhouseType;
  areaSqm: number;
  notes?: string;
}

export type SystemType = 'NFT' | 'DFT' | 'Tower' | 'DutchBucket' | 'Ebb';
export interface GrowingSystem {
  id: ID;
  greenhouseId: ID;
  name: string;
  type: SystemType;
  capacity: number; // plant sites
  tankLiters: number;
  notes?: string;
}

export type CropCategory = 'lettuce' | 'herb' | 'leafy' | 'fruit';
export interface Crop {
  id: ID;
  nameTh: string;
  nameEn: string;
  variety: string;
  category: CropCategory;
  daysToTransplant: number; // days from sowing
  daysToHarvest: number; // days from sowing
  phMin: number;
  phMax: number;
  ecMin: number; // mS/cm
  ecMax: number;
  tempMin: number; // °C
  tempMax: number;
  expectedYieldG: number; // grams per plant
  notes?: string;
}

export type BatchStatus = 'seedling' | 'growing' | 'ready' | 'harvested';
export interface PlantingBatch {
  id: ID;
  code: string;
  cropId: ID;
  systemId: ID;
  seedCount: number;
  sowDate: ISODate;
  transplantDate: ISODate;
  expectedHarvestDate: ISODate;
  status: BatchStatus;
  notes?: string;
}

export type Activity =
  | 'water'
  | 'nutrient'
  | 'ph_adjust'
  | 'prune'
  | 'pest_check'
  | 'clean'
  | 'transplant';

export interface DailyLog {
  id: ID;
  date: ISODate;
  batchId: ID;
  ph: number;
  ec: number;
  temperature: number;
  humidity: number;
  aliveCount: number;
  activities: Activity[];
  notes?: string;
}

export interface Photo {
  id: ID;
  batchId: ID;
  date: ISODate;
  caption: string;
  /** In the prototype: an object URL from the uploaded file, or empty to show an illustration.
   *  In production: a Supabase Storage path. */
  url?: string;
}

export type Grade = 'A' | 'B' | 'C';
export interface Harvest {
  id: ID;
  batchId: ID;
  date: ISODate;
  plantCount: number;
  totalWeightKg: number;
  wasteWeightKg: number;
  grade: Grade;
  notes?: string;
}

export type InventoryCategory = 'seed' | 'nutrient' | 'media' | 'packaging' | 'equipment';
export interface InventoryItem {
  id: ID;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minLevel: number;
  notes?: string;
}

export type TxType = 'cost' | 'revenue';
export type TxCategory =
  | 'seed'
  | 'nutrient'
  | 'electricity'
  | 'labor'
  | 'packaging'
  | 'equipment'
  | 'sales'
  | 'other';
export interface Transaction {
  id: ID;
  date: ISODate;
  type: TxType;
  category: TxCategory;
  amount: number; // THB
  batchId?: ID;
  note?: string;
}

export interface NutrientRecipe {
  id: ID;
  name: string;
  cropId?: ID;
  aMlPerL: number;
  bMlPerL: number;
  targetEc: number;
  targetPh: number;
  notes?: string;
}

export interface DB {
  farms: Farm[];
  greenhouses: Greenhouse[];
  systems: GrowingSystem[];
  crops: Crop[];
  batches: PlantingBatch[];
  logs: DailyLog[];
  photos: Photo[];
  harvests: Harvest[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  recipes: NutrientRecipe[];
}

export type Collection = keyof DB;
export type Row<C extends Collection> = DB[C][number];
