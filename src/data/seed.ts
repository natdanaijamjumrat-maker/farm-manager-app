import type { Activity, DB, DailyLog, Photo, PlantingBatch, Transaction } from '../types';
import { addDays, diffDays, today } from '../lib/date';

/**
 * Sample data for the prototype. Dates are generated relative to today so the
 * demo always looks current. Nothing here is saved anywhere: it is rebuilt on every page load.
 */

// Small deterministic random generator so the demo looks the same every load.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildSeed(): DB {
  const t = today();
  const r = rng(42);
  const jitter = (base: number, spread: number, dp = 1) =>
    Number((base + (r() - 0.5) * 2 * spread).toFixed(dp));

  const farms: DB['farms'] = [
    { id: 'farm_1', name: 'Green Leaf Farm', location: 'Mae Rim, Chiang Mai', areaSqm: 3200, owner: 'Somchai K.', notes: 'Main production site' },
  ];

  const greenhouses: DB['greenhouses'] = [
    { id: 'gh_a', farmId: 'farm_1', name: 'Greenhouse A', type: 'greenhouse', areaSqm: 480, notes: 'Evaporative cooling pad + fan' },
    { id: 'gh_v', farmId: 'farm_1', name: 'Vertical Room V1', type: 'vertical', areaSqm: 60, notes: 'LED full spectrum, 16h photoperiod' },
  ];

  const systems: DB['systems'] = [
    { id: 'sys_nft1', greenhouseId: 'gh_a', name: 'NFT Rack A1', type: 'NFT', capacity: 360, tankLiters: 400 },
    { id: 'sys_dft1', greenhouseId: 'gh_a', name: 'DFT Pond A2', type: 'DFT', capacity: 240, tankLiters: 1200 },
    { id: 'sys_tw1', greenhouseId: 'gh_v', name: 'Vertical Tower V1-1', type: 'Tower', capacity: 288, tankLiters: 200 },
  ];

  const crops: DB['crops'] = [
    { id: 'crop_go', nameTh: 'กรีนโอ๊ค', nameEn: 'Green Oak', variety: 'Green Oak Leaf', category: 'lettuce', daysToTransplant: 14, daysToHarvest: 45, phMin: 5.8, phMax: 6.5, ecMin: 1.2, ecMax: 1.8, tempMin: 18, tempMax: 28, expectedYieldG: 150, notes: 'Tolerates heat better than butterhead.' },
    { id: 'crop_ro', nameTh: 'เรดโอ๊ค', nameEn: 'Red Oak', variety: 'Red Oak Leaf', category: 'lettuce', daysToTransplant: 14, daysToHarvest: 48, phMin: 5.8, phMax: 6.5, ecMin: 1.2, ecMax: 1.8, tempMin: 18, tempMax: 27, expectedYieldG: 130, notes: 'Red color deepens with stronger light.' },
    { id: 'crop_bh', nameTh: 'บัตเตอร์เฮด', nameEn: 'Butterhead', variety: 'Butterhead', category: 'lettuce', daysToTransplant: 14, daysToHarvest: 45, phMin: 5.8, phMax: 6.3, ecMin: 1.0, ecMax: 1.6, tempMin: 16, tempMax: 25, expectedYieldG: 160 },
    { id: 'crop_cos', nameTh: 'คอส', nameEn: 'Cos (Romaine)', variety: 'Romaine', category: 'lettuce', daysToTransplant: 15, daysToHarvest: 50, phMin: 5.8, phMax: 6.5, ecMin: 1.2, ecMax: 1.8, tempMin: 18, tempMax: 27, expectedYieldG: 180 },
    { id: 'crop_bs', nameTh: 'โหระพา', nameEn: 'Thai Basil', variety: 'Horapha', category: 'herb', daysToTransplant: 18, daysToHarvest: 40, phMin: 5.5, phMax: 6.5, ecMin: 1.0, ecMax: 1.6, tempMin: 22, tempMax: 32, expectedYieldG: 90 },
    { id: 'crop_kl', nameTh: 'เคล', nameEn: 'Kale', variety: 'Curly Kale', category: 'leafy', daysToTransplant: 18, daysToHarvest: 55, phMin: 5.5, phMax: 6.5, ecMin: 1.4, ecMax: 2.2, tempMin: 15, tempMax: 26, expectedYieldG: 200 },
  ];

  // Batches at different stages.
  const mk = (id: string, code: string, cropId: string, systemId: string, seeds: number, daysAgo: number, status: PlantingBatch['status']): PlantingBatch => {
    const crop = crops.find((c) => c.id === cropId)!;
    const sow = addDays(t, -daysAgo);
    return {
      id, code, cropId, systemId, seedCount: seeds, sowDate: sow,
      transplantDate: addDays(sow, crop.daysToTransplant),
      expectedHarvestDate: addDays(sow, crop.daysToHarvest),
      status,
    };
  };
  const batches: PlantingBatch[] = [
    mk('b1', 'GO-A1-01', 'crop_go', 'sys_nft1', 180, 42, 'ready'),
    mk('b2', 'RO-A1-02', 'crop_ro', 'sys_nft1', 150, 28, 'growing'),
    mk('b3', 'BH-V1-01', 'crop_bh', 'sys_tw1', 200, 20, 'growing'),
    mk('b4', 'CS-A2-01', 'crop_cos', 'sys_dft1', 120, 9, 'seedling'),
    mk('b5', 'BS-V1-02', 'crop_bs', 'sys_tw1', 100, 58, 'harvested'),
    mk('b6', 'GO-A2-00', 'crop_go', 'sys_dft1', 160, 75, 'harvested'),
  ];
  batches[0].notes = 'Heads look uniform. Plan harvest this week.';

  // Daily logs: last up-to-21 days for each batch that is not harvested,
  // plus a few older ones for harvested batches.
  const activityPool: Activity[] = ['water', 'nutrient', 'ph_adjust', 'prune', 'pest_check', 'clean'];
  const logs: DailyLog[] = [];
  for (const b of batches) {
    const crop = crops.find((c) => c.id === b.cropId)!;
    const age = diffDays(t, b.sowDate);
    const end = b.status === 'harvested' ? age - crop.daysToHarvest : 0; // days ago
    const span = Math.min(21, age - (b.status === 'harvested' ? end : 0));
    let alive = b.seedCount - Math.round(b.seedCount * 0.04);
    const isVertical = b.systemId === 'sys_tw1';
    for (let i = span; i >= Math.max(end, 0); i -= 1) {
      const date = addDays(t, -i);
      if (r() < 0.12) alive -= 1 + Math.floor(r() * 2);
      const acts: Activity[] = [];
      for (const a of activityPool) if (r() < 0.25) acts.push(a);
      if (!acts.length) acts.push('water');
      // A small pH drift a few days ago on b2 to make an alert visible.
      const ph = b.id === 'b2' && i <= 1 ? 6.9 : jitter((crop.phMin + crop.phMax) / 2, 0.25);
      logs.push({
        id: `log_${b.id}_${i}`,
        date,
        batchId: b.id,
        ph,
        ec: jitter((crop.ecMin + crop.ecMax) / 2, 0.2),
        temperature: isVertical ? jitter(23, 1.2) : jitter(27, 2.5),
        humidity: isVertical ? jitter(68, 4, 0) : jitter(74, 8, 0),
        aliveCount: alive,
        activities: acts,
        notes: b.id === 'b2' && i === 1 ? 'pH rising. Added pH Down 20 ml.' : undefined,
      });
    }
  }

  const photos: Photo[] = [];
  for (const b of batches.filter((x) => x.status !== 'harvested')) {
    const age = diffDays(t, b.sowDate);
    for (let d = 3; d <= age; d += 7) {
      photos.push({ id: `ph_${b.id}_${d}`, batchId: b.id, date: addDays(b.sowDate, d), caption: `Day ${d}` });
    }
  }

  const harvests: DB['harvests'] = [
    { id: 'hv1', batchId: 'b6', date: addDays(t, -30), plantCount: 148, totalWeightKg: 23.4, wasteWeightKg: 1.6, grade: 'A', notes: 'Sold to local supermarket' },
    { id: 'hv2', batchId: 'b5', date: addDays(t, -18), plantCount: 88, totalWeightKg: 8.2, wasteWeightKg: 0.9, grade: 'B', notes: 'Some leaves yellow at the base' },
  ];

  const inventory: DB['inventory'] = [
    { id: 'inv1', name: 'Green Oak seeds (pelleted)', category: 'seed', quantity: 1200, unit: 'seeds', minLevel: 500 },
    { id: 'inv2', name: 'Butterhead seeds', category: 'seed', quantity: 300, unit: 'seeds', minLevel: 500 },
    { id: 'inv3', name: 'Nutrient A (stock)', category: 'nutrient', quantity: 18, unit: 'L', minLevel: 10 },
    { id: 'inv4', name: 'Nutrient B (stock)', category: 'nutrient', quantity: 6, unit: 'L', minLevel: 10 },
    { id: 'inv5', name: 'pH Down', category: 'nutrient', quantity: 3.5, unit: 'L', minLevel: 1 },
    { id: 'inv6', name: 'Sponge cubes', category: 'media', quantity: 2400, unit: 'pcs', minLevel: 1000 },
    { id: 'inv7', name: 'Clear PP bags 8x12"', category: 'packaging', quantity: 850, unit: 'pcs', minLevel: 300 },
  ];

  const tx: Transaction[] = [];
  let n = 0;
  for (let m = 3; m >= 0; m -= 1) {
    const base = addDays(t, -m * 30);
    const add = (offset: number, type: Transaction['type'], category: Transaction['category'], amount: number, note?: string, batchId?: string) =>
      tx.push({ id: `tx${n++}`, date: addDays(base, -offset), type, category, amount, note, batchId });
    add(2, 'cost', 'seed', 650 + Math.round(r() * 300), 'Seeds');
    add(5, 'cost', 'nutrient', 1400 + Math.round(r() * 500), 'Nutrient A+B');
    add(8, 'cost', 'electricity', 3200 + Math.round(r() * 900), 'LED + pumps');
    add(10, 'cost', 'labor', 9000, 'Part-time staff');
    add(12, 'cost', 'packaging', 400 + Math.round(r() * 200), 'Bags & labels');
    if (m < 3) add(14, 'revenue', 'sales', 11000 + Math.round(r() * 7000), 'Weekly wholesale');
    if (m < 2) add(1, 'revenue', 'sales', 4500 + Math.round(r() * 3000), 'Farmers market');
  }

  const recipes: DB['recipes'] = [
    { id: 'rc1', name: 'Lettuce standard', cropId: 'crop_go', aMlPerL: 2.5, bMlPerL: 2.5, targetEc: 1.5, targetPh: 6.0, notes: 'Use for all leaf lettuce after transplant' },
    { id: 'rc2', name: 'Seedling mild', aMlPerL: 1.0, bMlPerL: 1.0, targetEc: 0.8, targetPh: 5.8, notes: 'First 14 days' },
    { id: 'rc3', name: 'Kale high EC', cropId: 'crop_kl', aMlPerL: 3.2, bMlPerL: 3.2, targetEc: 2.0, targetPh: 6.0 },
  ];

  return { farms, greenhouses, systems, crops, batches, logs, photos, harvests, inventory, transactions: tx, recipes };
}

export const emptyDB = (): DB => ({
  farms: [], greenhouses: [], systems: [], crops: [], batches: [], logs: [], photos: [],
  harvests: [], inventory: [], transactions: [], recipes: [],
});
