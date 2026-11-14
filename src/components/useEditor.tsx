import { useState } from 'react';
import { Modal, ConfirmDialog } from './Modal';
import { EntityForm, type FieldDef, type Values } from './EntityForm';
import { useStore } from '../store';
import { useT } from '../i18n';
import { newId } from '../lib/id';
import type { Collection, Row } from '../types';

/**
 * Add / edit / delete flow shared by all modules.
 * Returns open functions plus the dialog element to render.
 */
export function useEditor<C extends Collection>(opts: {
  collection: C;
  noun: string; // e.g. "crop"
  fields: FieldDef[];
  defaults: () => Values;
  onFieldChange?: (key: string, v: Values) => Values;
  /** Turn form values into a row (e.g. to compute fields). */
  toRow?: (v: Values) => Values;
}) {
  const { upsert, remove, notify } = useStore();
  const { t } = useT();
  const [editing, setEditing] = useState<null | { mode: 'new' | 'edit'; values: Values }>(null);
  const [deleting, setDeleting] = useState<null | { id: string; name: string }>(null);
  const formId = `form-${opts.collection}`;

  const openNew = (preset: Values = {}) => setEditing({ mode: 'new', values: { ...opts.defaults(), ...preset } });
  const openEdit = (row: Row<C>) => setEditing({ mode: 'edit', values: { ...(row as unknown as Values) } });
  const askDelete = (id: string, name: string) => setDeleting({ id, name });

  const element = (
    <>
      {editing && (
        <Modal
          title={editing.mode === 'new' ? `${t('เพิ่ม', 'Add')}${t('', ' ')}${opts.noun}` : `${t('แก้ไข', 'Edit')}${t('', ' ')}${opts.noun}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('ยกเลิก', 'Cancel')}</button>
              <button type="submit" form={formId} className="btn btn-primary">{editing.mode === 'new' ? t('บันทึก', 'Save') : t('บันทึกการแก้ไข', 'Save changes')}</button>
            </>
          }
        >
          <EntityForm
            id={formId}
            fields={opts.fields}
            initial={editing.values}
            onFieldChange={opts.onFieldChange}
            onSubmit={(v) => {
              const base = opts.toRow ? opts.toRow(v) : v;
              const row = { ...base, id: (v.id as string) || newId(opts.collection) };
              upsert(opts.collection, row as unknown as Row<C>);
              notify(editing.mode === 'new' ? t('เพิ่มข้อมูลแล้ว (ในต้นแบบนี้)', 'Added (in this prototype)') : t('บันทึกการแก้ไขแล้ว (ในต้นแบบนี้)', 'Changes saved (in this prototype)'));
              setEditing(null);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={t('ลบรายการนี้?', 'Delete this item?')}
          message={t(`“${deleting.name}” จะถูกลบออกจากต้นแบบนี้`, `“${deleting.name}” will be removed from this prototype.`)}
          confirmLabel={t('ลบ', 'Delete')}
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => { remove(opts.collection, deleting.id); notify(t('ลบแล้ว', 'Deleted')); setDeleting(null); }}
        />
      )}
    </>
  );

  return { openNew, openEdit, askDelete, element };
}

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useT();
  return (
    <div className="row-actions">
      <button type="button" className="icon-btn" onClick={onEdit} aria-label={t('แก้ไข', 'Edit')} title={t('แก้ไข', 'Edit')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" /></svg>
      </button>
      <button type="button" className="icon-btn danger" onClick={onDelete} aria-label={t('ลบ', 'Delete')} title={t('ลบ', 'Delete')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
      </button>
    </div>
  );
}
