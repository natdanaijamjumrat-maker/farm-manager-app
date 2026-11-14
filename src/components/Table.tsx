import type { ReactNode } from 'react';

export interface Col<T> { key: string; head: string; cell: (r: T) => ReactNode; num?: boolean; hideSm?: boolean }

/** Desktop: table. Phone: each row becomes a stacked card (via CSS data-label). */
export function Table<T extends { id: string }>({ rows, cols, actions }: { rows: T[]; cols: Col<T>[]; actions?: (r: T) => ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {cols.map((c) => <th key={c.key} className={`${c.num ? 'num' : ''} ${c.hideSm ? 'hide-sm' : ''}`}>{c.head}</th>)}
            {actions && <th className="actions-col"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {cols.map((c) => <td key={c.key} data-label={c.head} className={`${c.num ? 'num' : ''} ${c.hideSm ? 'hide-sm' : ''}`}>{c.cell(r)}</td>)}
              {actions && <td className="actions-col">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
