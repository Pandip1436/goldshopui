import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { ImageRef } from '@goldshop/shared';
import { Markdown } from '../components/Markdown';
import { Field } from '../components/ui/Form';
import { ApiError, api, errorMessage } from '../lib/api';
import { cn } from '../lib/utils';
import { DatePicker } from './DatePicker';
import { AdminSelect, Button, ConfirmButton, DataTable, FormError, ImagesField, Modal, MoneyInput, PageHeader, Pager, Textarea, Toggle, adminInput, type Column } from './ui';

export type FieldDef =
  | { name: string; label: string; type: 'text' | 'number' | 'date' | 'tags'; hint?: string; span?: 1 | 2; placeholder?: string }
  | { name: string; label: string; type: 'textarea' | 'markdown'; hint?: string; span?: 1 | 2; rows?: number }
  | { name: string; label: string; type: 'money'; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: 'switch'; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; hint?: string; span?: 1 | 2; allowEmpty?: string }
  | { name: string; label: string; type: 'image'; hint?: string; span?: 1 | 2; folder?: string };

type Row = Record<string, unknown> & { id: string };

interface Props {
  resource: string;
  title: string;
  description?: ReactNode;
  singular: string;
  columns: Column<Row>[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  canWrite: boolean;
  /** Turn a stored record into form values. */
  toForm?: (row: Row) => Record<string, unknown>;
  /** Turn form values into the API payload. */
  toPayload?: (v: Record<string, unknown>) => Record<string, unknown>;
  notice?: ReactNode;
  /** Section tabs shown under the page header. */
  tabs?: ReactNode;
  paginated?: boolean;
}

export function ResourceManager({ resource, title, description, singular, columns, fields, defaults, canWrite, toForm, toPayload, notice, tabs, paginated = true }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', resource, page],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number } | Row[]>(`/admin/${resource}`, { query: paginated ? { page } : undefined }),
    placeholderData: keepPreviousData,
  });
  const rows = Array.isArray(data) ? data : data?.items;
  const del = useMutation({
    mutationFn: (id: string) => api(`/admin/${resource}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', resource] });
      toast.success(`${singular} deleted`);
    },
  });

  const allColumns: Column<Row>[] = canWrite
    ? [
        ...columns,
        {
          key: '_actions',
          header: '',
          className: 'w-px whitespace-nowrap text-right',
          cell: (r) => (
            <span className="inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="light" onClick={() => setEditing(r)}>Edit</Button>
              <ConfirmButton title={`Delete this ${singular.toLowerCase()}?`} description="This cannot be undone." onConfirm={() => del.mutateAsync(r.id)}>
                Delete
              </ConfirmButton>
            </span>
          ),
        },
      ]
    : columns;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={canWrite && <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>New {singular.toLowerCase()}</Button>}
      />
      {tabs}
      {notice}
      <DataTable rows={rows} columns={allColumns} rowKey={(r) => r.id} loading={isLoading} onRowClick={canWrite ? (r) => setEditing(r) : undefined} />
      {!Array.isArray(data) && data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      {editing && (
        <ResourceForm
          resource={resource}
          singular={singular}
          fields={fields}
          initial={editing === 'new' ? defaults : { ...defaults, ...(toForm ? toForm(editing) : editing) }}
          id={editing === 'new' ? undefined : editing.id}
          toPayload={toPayload}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ResourceForm({
  resource,
  singular,
  fields,
  initial,
  id,
  toPayload,
  onClose,
}: {
  resource: string;
  singular: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  id?: string;
  toPayload?: (v: Record<string, unknown>) => Record<string, unknown>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [v, setV] = useState<Record<string, unknown>>(initial);
  const set = (name: string, value: unknown) => setV((s) => ({ ...s, [name]: value }));
  const save = useMutation({
    mutationFn: () => {
      const body = toPayload ? toPayload(v) : v;
      return id ? api(`/admin/${resource}/${id}`, { method: 'PUT', body }) : api(`/admin/${resource}`, { body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', resource] });
      toast.success(`${singular} saved`);
      onClose();
    },
  });
  const fieldErrors = save.error instanceof ApiError ? save.error.fields ?? {} : {};

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <FormError>{save.isError && !Object.keys(fieldErrors).length ? errorMessage(save.error) : save.isError ? errorMessage(save.error) : null}</FormError>
        </div>
        {fields.map((f) => (
          <FieldControl key={f.name} f={f} value={v[f.name]} onChange={(val) => set(f.name, val)} error={fieldErrors[f.name]} />
        ))}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function FieldControl({ f, value, onChange, error }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const [preview, setPreview] = useState(false);
  const span = f.span === 1 ? '' : 'sm:col-span-2';
  switch (f.type) {
    case 'switch':
      return (
        <div className={cn('flex items-center justify-between gap-4 rounded-xl border border-hairline bg-cream-2 px-3.5 py-3', span)}>
          <div>
            <p className="text-sm font-semibold text-ink">{f.label}</p>
            {f.hint && <p className="text-xs text-muted">{f.hint}</p>}
          </div>
          <Toggle checked={Boolean(value)} onChange={onChange} label={f.label} />
        </div>
      );
    case 'image':
      return (
        <div className={span}>
          <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">{f.label}</p>
          <ImagesField single folder={f.folder ?? 'content'} value={value ? [value as ImageRef] : []} onChange={(imgs) => onChange(imgs[0] ?? null)} />
        </div>
      );
    case 'money':
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <MoneyInput value={Number(value ?? 0)} onChange={onChange} />
        </Field>
      );
    case 'select':
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <AdminSelect value={String(value ?? '')} onChange={(v) => onChange(v || null)} options={f.options} allowEmpty={f.allowEmpty} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <Textarea rows={f.rows ?? 3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case 'markdown':
      return (
        <div className={span}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[0.8125rem] font-semibold text-ink-2">{f.label}</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs font-semibold text-wine underline underline-offset-4">
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-hairline bg-cream-2 p-4">
              <Markdown source={String(value ?? '')} className="!text-sm" />
            </div>
          ) : (
            <Textarea rows={f.rows ?? 14} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="font-mono !text-[0.8125rem]" aria-label={f.label} />
          )}
          <p className="mt-1 text-xs text-muted">{f.hint ?? 'Markdown: ## Heading, **bold**, - list item, [link](https://…)'}</p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    case 'tags':
      return (
        <Field label={f.label} hint={f.hint ?? 'Separate with commas'} error={error} className={span}>
          <input
            className={adminInput}
            value={Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
            onChange={(e) => onChange(e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
          />
        </Field>
      );
    case 'number':
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <input className={adminInput} inputMode="decimal" value={value === undefined || value === null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={f.placeholder} />
        </Field>
      );
    case 'date':
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <DatePicker value={String(value ?? '')} onChange={onChange} />
        </Field>
      );
    default:
      return (
        <Field label={f.label} hint={f.hint} error={error} className={span}>
          <input className={adminInput} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
        </Field>
      );
  }
}
