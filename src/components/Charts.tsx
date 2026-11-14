import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Lightweight SVG charts (no chart library). Colors come from CSS tokens (--s1..--s3, --accent). */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { lo, hi, ticks, step };
}

const fmt = (v: number, step: number) => (step < 1 ? v.toFixed(step < 0.1 ? 2 : 1) : Math.round(v).toLocaleString('en-US'));

export interface Series { name: string; color: string; values: (number | null)[] }

export function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.name} className="legend-item">
          <span className={`legend-swatch ${i.dashed ? 'dashed' : ''}`} style={{ background: i.dashed ? 'transparent' : i.color, borderColor: i.color }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

export function LineChart({ labels, series, band, height = 220, unit = '', yMin, yMax, ariaLabel }: {
  labels: string[]; series: Series[]; band?: { min: number; max: number; label: string }; height?: number; unit?: string; yMin?: number; yMax?: number; ariaLabel: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 44, r: 14, t: 12, b: 28 };
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (band) all.push(band.min, band.max);
  const { lo, hi, ticks, step } = niceTicks(yMin ?? Math.min(...all), yMax ?? Math.max(...all));
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const every = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 70)));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round((px / r.width) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };

  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {band && (
          <g>
            <rect x={pad.l} width={iw} y={y(band.max)} height={Math.max(0, y(band.min) - y(band.max))} fill="var(--band)" />
          </g>
        )}
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={pad.l} x2={w - pad.r} y1={y(tk)} y2={y(tk)} stroke="var(--grid)" strokeWidth={1} />
            <text x={pad.l - 8} y={y(tk)} dy="0.32em" textAnchor="end" className="axis-text">{fmt(tk, step)}</text>
          </g>
        ))}
        {labels.map((l, i) => i % every === 0 ? (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="axis-text">{l}</text>
        ) : null)}
        {series.map((s) => {
          let d = '';
          s.values.forEach((v, i) => {
            if (v === null) return;
            d += `${d && s.values[i - 1] !== null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
          });
          const lastI = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {lastI !== undefined && <circle cx={x(lastI)} cy={y(s.values[lastI] as number)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />}
            </g>
          );
        })}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" strokeDasharray="3 3" />
            {series.map((s) => s.values[hover] !== null && (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] as number)} r={5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        )}
        <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} w={w}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <div key={s.name} className="tt-row"><span className="tt-dot" style={{ background: s.color }} />{s.name}<b>{s.values[hover] ?? '–'}{unit}</b></div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

function Tooltip({ x, w, children }: { x: number; w: number; children: ReactNode }) {
  const left = x > w / 2 ? undefined : x + 12;
  const right = x > w / 2 ? w - x + 12 : undefined;
  return <div className="tooltip" style={{ left, right }}>{children}</div>;
}

export function BarChart({ labels, series, height = 220, unit = '', ariaLabel, valueFmt = (v: number) => v.toLocaleString('en-US') }: {
  labels: string[]; series: Series[]; height?: number; unit?: string; ariaLabel: string; valueFmt?: (v: number) => string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 52, r: 10, t: 12, b: 30 };
  const all = series.flatMap((s) => s.values.map((v) => v ?? 0));
  const { hi, ticks, step } = niceTicks(0, Math.max(1, ...all));
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const groupW = iw / Math.max(1, labels.length);
  const gap = 2;
  const barW = Math.min(36, (groupW * 0.7 - gap * (series.length - 1)) / series.length);
  const y = (v: number) => pad.t + ih - (v / (hi || 1)) * ih;
  const r = Math.min(4, barW / 2);

  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={pad.l} x2={w - pad.r} y1={y(tk)} y2={y(tk)} stroke="var(--grid)" />
            <text x={pad.l - 8} y={y(tk)} dy="0.32em" textAnchor="end" className="axis-text">{fmt(tk, step)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const gx = pad.l + i * groupW + (groupW - (barW * series.length + gap * (series.length - 1))) / 2;
          return (
            <g key={l + i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={pad.l + i * groupW} y={pad.t} width={groupW} height={ih} fill={hover === i ? 'var(--hover)' : 'transparent'} />
              {series.map((s, si) => {
                const v = s.values[i] ?? 0;
                const bx = gx + si * (barW + gap);
                const top = y(v);
                const h = pad.t + ih - top;
                if (h <= 0) return null;
                const rr = Math.min(r, h);
                return (
                  <path key={s.name}
                    d={`M${bx},${pad.t + ih}V${top + rr}Q${bx},${top} ${bx + rr},${top}H${bx + barW - rr}Q${bx + barW},${top} ${bx + barW},${top + rr}V${pad.t + ih}Z`}
                    fill={s.color} />
                );
              })}
              <text x={pad.l + i * groupW + groupW / 2} y={height - 10} textAnchor="middle" className="axis-text">{l.length > 10 && groupW < 80 ? `${l.slice(0, 8)}…` : l}</text>
            </g>
          );
        })}
        <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="var(--axis)" />
      </svg>
      {hover !== null && (
        <Tooltip x={pad.l + hover * groupW + groupW / 2} w={w}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <div key={s.name} className="tt-row"><span className="tt-dot" style={{ background: s.color }} />{s.name}<b>{valueFmt(s.values[hover] ?? 0)}{unit}</b></div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}
