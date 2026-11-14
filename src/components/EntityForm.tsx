import { useState, type FormEvent } from 'react';
import { useT } from '../i18n';

/**
 * Schema-driven form used by every "Add / Edit" dialog.
 * One field config = one input. The same config can later drive Supabase column validation.
 */

export interface Option { value: string; label: string }
export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'chips';
  options?: Option[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  placeholder?: string;
  half?: boolean; // half width on desktop
}

export type Values = Record<string, unknown>;

interface Props {
  id: string;
  fields: FieldDef[];
  initial: Values;
  onSubmit: (v: Values) => void;
  /** Lets a screen derive one field from another (e.g. harvest date from sow date). */
  onFieldChange?: (key: string, v: Values) => Values;
}

export function EntityForm({ id, fields, initial, onSubmit, onFieldChange }: Props) {
  const { t } = useT();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: unknown) => {
    let next = { ...values, [key]: val };
    if (onFieldChange) next = onFieldChange(key, next);
    setValues(next);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.key];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) e[f.key] = t('กรุณากรอกช่องนี้', 'This field is required');
      else if (f.type === 'number' && !empty) {
        const n = Number(v);
        if (Number.isNaN(n)) e[f.key] = t('ต้องเป็นตัวเลข', 'Must be a number');
        else if (f.min !== undefined && n < f.min) e[f.key] = t(`ต้องไม่น้อยกว่า ${f.min}`, `Must be at least ${f.min}`);
        else if (f.max !== undefined && n > f.max) e[f.key] = t(`ต้องไม่เกิน ${f.max}`, `Must be at most ${f.max}`);
      }
    }
    setErrors(e);
    return Object.values(e).every((x) => !x);
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const out: Values = { ...values };
    for (const f of fields) if (f.type === 'number' && out[f.key] !== '' && out[f.key] !== undefined) out[f.key] = Number(out[f.key]);
    onSubmit(out);
  };

  return (
    <form id={id} className="form-grid" onSubmit={submit} noValidate>
      {fields.map((f) => {
        const fid = `${id}-${f.key}`;
        const v = values[f.key];
        const err = errors[f.key];
        return (
          <div key={f.key} className={`field ${f.half ? 'half' : ''} ${err ? 'has-error' : ''}`}>
            <label htmlFor={fid}>
              {f.label}
              {f.required && <span className="req" aria-hidden="true"> *</span>}
              {f.unit && <span className="unit"> ({f.unit})</span>}
            </label>
            {f.type === 'select' ? (
              <select id={fid} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">{t('— เลือก —', '— Select —')}</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={fid} rows={3} value={String(v ?? '')} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            ) : f.type === 'chips' ? (
              <div className="chips" id={fid} role="group" aria-label={f.label}>
                {f.options?.map((o) => {
                  const arr = (v as string[]) ?? [];
                  const on = arr.includes(o.value);
                  return (
                    <button type="button" key={o.value} className={`chip ${on ? 'on' : ''}`} aria-pressed={on}
                      onClick={() => set(f.key, on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}>
                      {on && '✓ '}{o.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input id={fid} type={f.type} inputMode={f.type === 'number' ? 'decimal' : undefined} step={f.step ?? (f.type === 'number' ? 'any' : undefined)}
                min={f.min} max={f.max} value={String(v ?? '')} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            )}
            {err ? <p className="err">{err}</p> : f.hint ? <p className="hint">{f.hint}</p> : null}
          </div>
        );
      })}
    </form>
  );
}
