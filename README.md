# Farm Manager (Prototype)

ต้นแบบเว็บแอปสำหรับจัดการการปลูกผักในโรงเรือนและ Vertical Farm ใช้งานได้ทั้ง iPhone และคอมพิวเตอร์ รองรับภาษาไทยและอังกฤษ

An interactive prototype for managing greenhouse and vertical-farm vegetable production.

> **Prototype only.** Data is sample data held in memory in the browser tab. Nothing is saved to a database, and everything resets when you reload the page.

## Run it

```bash
npm install
npm run dev          # open the printed http://localhost:5173 link
npm run build        # production build in dist/
npm run build:single # one self-contained HTML file in dist-single/index.html
```

## Modules

| # | Module | What you can do in the prototype |
|---|--------|----------------------------------|
| 1 | Dashboard | Plants growing, active batches, survival rate, yield, cost; cost/revenue and temperature charts; alerts |
| 2 | Farms | Add / edit / delete farms |
| 3 | Greenhouses | Greenhouses and vertical rooms, plant-site usage |
| 4 | Growing Systems | NFT, DFT, towers; what is growing in each |
| 5 | Crop Library | Add / edit crops with pH, EC, temperature and day targets; detail view |
| 6 | Planting Batches | Create batches; transplant and harvest dates fill in from the crop; progress and pH history |
| 7 | Daily Logs | Date, batch, pH, EC, temperature, humidity, plants alive, activities, notes; out-of-range warnings |
| 8 | Water & Nutrients | pH / EC charts against target bands, A/B recipes, mixing calculator |
| 9 | Environment | Temperature and humidity per greenhouse |
| 10 | Photo Gallery | Photos grouped by batch and day; upload from phone camera or files |
| 11 | Harvest & Yield | Plants, total weight, waste, grade; net yield and g/plant |
| 12 | Inventory | Stock levels, reorder warnings, quick +/- |
| 13 | Costs & Revenue | Income and spending, monthly chart, cost by category |
| 14 | Analytics | Survival by batch, actual vs expected yield, cost per kg |

Use **Clear all data** in the menu to see every empty state, and **Reload sample data** to bring the examples back.

## Project structure

```
src/
  types.ts            Domain model (one interface per future Supabase table)
  store.tsx           In-memory store: upsert / remove / reset
  i18n.tsx            Thai / English switch and shared labels
  data/seed.ts        Sample data, generated relative to today
  lib/                Dates, derived values (survival, net yield), select options
  components/         Layout, forms, modal, table, charts, empty state
  pages/              One file per module
docs/supabase-schema.sql  Proposed database schema
```

## Path to React + TypeScript + Supabase

1. Create a Supabase project and run `docs/supabase-schema.sql`.
2. Add `@supabase/supabase-js` and replace the reducer actions in `src/store.tsx` with `supabase.from(table).select / upsert / delete` calls.
3. Upload photos to a Supabase Storage bucket and store the path in `photos.storage_path`.
4. Add Supabase Auth and Row Level Security policies per farm.
5. Optionally replace hash routing in `App.tsx` with `react-router`.
