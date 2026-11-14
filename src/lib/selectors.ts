import type { DB, PlantingBatch } from '../types';
import { diffDays, today } from './date';

/** Derived values computed from raw data. In Supabase these could become SQL views. */

export const latestLog = (db: DB, batchId: string) =>
  db.logs.filter((l) => l.batchId === batchId).sort((a, b) => b.date.localeCompare(a.date))[0];

export const aliveCount = (db: DB, b: PlantingBatch) => latestLog(db, b.id)?.aliveCount ?? b.seedCount;

export const survivalRate = (db: DB, b: PlantingBatch) => (b.seedCount ? aliveCount(db, b) / b.seedCount : 0);

export const isActive = (b: PlantingBatch) => b.status !== 'harvested';

export const batchDay = (b: PlantingBatch) => Math.max(0, diffDays(today(), b.sowDate));

export const batchProgress = (b: PlantingBatch) => {
  const total = Math.max(1, diffDays(b.expectedHarvestDate, b.sowDate));
  return Math.min(1, Math.max(0, batchDay(b) / total));
};

export const netKg = (h: { totalWeightKg: number; wasteWeightKg: number }) =>
  Math.max(0, h.totalWeightKg - h.wasteWeightKg);

export const fmtNum = (n: number, dp = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const fmtTHB = (n: number) => `฿${fmtNum(Math.round(n))}`;
