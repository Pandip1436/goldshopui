import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Eye, FileText, Globe, Images, IndianRupee, ListChecks, ListTree, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { PURITIES, PURITY_KEYS, type ImageRef, type PriceBreakdown } from '@goldshop/shared';
import { Field } from '../../components/ui/Form';
import { Skeleton } from '../../components/ui/misc';
import { ApiError, api, errorMessage } from '../../lib/api';
import { useDebounced } from '../../lib/hooks';
import { inr } from '../../lib/utils';
import { grams, mg, paise, rupees } from '../lib';
import { AdminSelect, Alert, Button, Card, ConfirmButton, FormError, ImagesField, PageHeader, Textarea, Toggle, adminInput } from '../ui';

interface VariantForm {
  id?: string;
  sku: string;
  label: string;
  attributes: Record<string, string>;
  netWeight: string;
  grossWeight: string;
  stone: string;
  fixedPrice: string;
  compareAt: string;
  stock: string;
  isActive: boolean;
  existingStock?: number;
}

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  collections: string[];
  tags: string;
  purity: string;
  pricingMode: 'weight' | 'fixed';
  makingType: 'percent' | 'per_gram' | 'flat';
  makingValue: string;
  makingDiscountPercent: string;
  optionNames: string[];
  variants: VariantForm[];
  specs: { label: string; value: string }[];
  images: ImageRef[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
}

const emptyVariant = (): VariantForm => ({ sku: '', label: 'Standard', attributes: {}, netWeight: '', grossWeight: '', stone: '', fixedPrice: '', compareAt: '', stock: '1', isActive: true });

const blank: FormState = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  collections: [],
  tags: '',
  purity: 'gold22',
  pricingMode: 'weight',
  makingType: 'percent',
  makingValue: '12',
  makingDiscountPercent: '0',
  optionNames: [],
  variants: [emptyVariant()],
  specs: [],
  images: [],
  isActive: true,
  isFeatured: false,
  sortOrder: '0',
  seoTitle: '',
  seoDescription: '',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function fromApi(p: any): FormState {
  return {
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    category: String(p.category),
    collections: (p.collections ?? []).map(String),
    tags: (p.tags ?? []).join(', '),
    purity: p.purity ?? '',
    pricingMode: p.pricingMode,
    makingType: p.making?.type ?? 'percent',
    makingValue: String(p.making?.type === 'percent' ? p.making.value : rupees(p.making?.value)),
    makingDiscountPercent: String(p.makingDiscountPercent ?? 0),
    optionNames: p.optionNames ?? [],
    variants: p.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      attributes: v.attributes ?? {},
      netWeight: v.netWeightMg ? String(grams(v.netWeightMg)) : '',
      grossWeight: v.grossWeightMg ? String(grams(v.grossWeightMg)) : '',
      stone: v.stoneCharge ? String(rupees(v.stoneCharge)) : '',
      fixedPrice: v.fixedPrice ? String(rupees(v.fixedPrice)) : '',
      compareAt: v.compareAtPrice ? String(rupees(v.compareAtPrice)) : '',
      stock: String(v.stock),
      existingStock: v.stock,
      isActive: v.isActive,
    })),
    specs: p.specs ?? [],
    images: p.images ?? [],
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    sortOrder: String(p.sortOrder ?? 0),
    seoTitle: p.seo?.title ?? '',
    seoDescription: p.seo?.description ?? '',
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function makingValueForApi(f: FormState): number {
  return f.makingType === 'percent' ? Number(f.makingValue || 0) : paise(f.makingValue);
}

function toApi(f: FormState) {
  return {
    name: f.name,
    slug: f.slug || undefined,
    shortDescription: f.shortDescription,
    description: f.description,
    category: f.category,
    collections: f.collections,
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    purity: f.purity || null,
    pricingMode: f.pricingMode,
    making: { type: f.makingType, value: makingValueForApi(f) },
    makingDiscountPercent: Number(f.makingDiscountPercent || 0),
    optionNames: f.optionNames.filter(Boolean),
    variants: f.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label || Object.values(v.attributes).filter(Boolean).join(' / ') || 'Standard',
      attributes: Object.fromEntries(f.optionNames.filter(Boolean).map((n) => [n, v.attributes[n] ?? ''])),
      netWeightMg: mg(v.netWeight),
      grossWeightMg: mg(v.grossWeight || v.netWeight),
      stoneCharge: paise(v.stone),
      fixedPrice: paise(v.fixedPrice),
      compareAtPrice: paise(v.compareAt),
      stock: Number(v.stock || 0),
      isActive: v.isActive,
    })),
    specs: f.specs.filter((s) => s.label && s.value),
    images: f.images,
    isActive: f.isActive,
    isFeatured: f.isFeatured,
    sortOrder: Number(f.sortOrder || 0),
    seo: { title: f.seoTitle || undefined, description: f.seoDescription || undefined },
  };
}

export default function ProductEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: product, isLoading } = useQuery({ queryKey: ['admin', 'product', id], queryFn: () => api<unknown>(`/admin/products/${id}`), enabled: !isNew });
  const { data: cats } = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => api<{ id: string; name: string; parent: string | null }[]>('/admin/categories') });
  const { data: cols } = useQuery({ queryKey: ['admin', 'collections'], queryFn: () => api<{ id: string; name: string }[]>('/admin/collections') });
  const [f, setF] = useState<FormState>(blank);
  useEffect(() => {
    if (product) setF(fromApi(product));
  }, [product]);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const setVariant = (i: number, patch: Partial<VariantForm>) => setF((s) => ({ ...s, variants: s.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) }));

  // Live price preview from the server's pricing engine.
  const previewInput = JSON.stringify({
    pricingMode: f.pricingMode,
    purity: f.purity || null,
    making: { type: f.makingType, value: makingValueForApi(f) },
    makingDiscountPercent: Number(f.makingDiscountPercent || 0),
    variants: f.variants.map((v) => ({ netWeightMg: mg(v.netWeight), stoneCharge: paise(v.stone), fixedPrice: paise(v.fixedPrice) })),
  });
  const debounced = useDebounced(previewInput, 350);
  const { data: preview } = useQuery({
    queryKey: ['admin', 'preview', debounced],
    queryFn: () => api<(PriceBreakdown | null)[]>('/admin/products/preview-price', { body: JSON.parse(debounced) }),
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: () => (isNew ? api<{ id: string }>('/admin/products', { body: toApi(f) }) : api<{ id: string }>(`/admin/products/${id}`, { method: 'PUT', body: toApi(f) })),
    onSuccess: (r) => {
      toast.success('Product saved');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'product', id] });
      if (isNew) navigate(`/admin/products/${r.id}`, { replace: true });
    },
  });
  const remove = useMutation({
    mutationFn: () => api<{ archived?: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: (r) => {
      toast.success(r.archived ? 'Product has orders, so it was hidden instead of deleted' : 'Product deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      navigate('/admin/products');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const fe = save.error instanceof ApiError ? save.error.fields ?? {} : {};

  const catOptions = useMemo(() => {
    const byParent = new Map<string | null, { id: string; name: string; parent: string | null }[]>();
    for (const c of cats ?? []) byParent.set(c.parent, [...(byParent.get(c.parent) ?? []), c]);
    const out: { id: string; label: string }[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const c of byParent.get(parent) ?? []) {
        out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [cats]);

  if (!isNew && (isLoading || !product)) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const weight = f.pricingMode === 'weight';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      noValidate
    >
      <PageHeader
        back={{ to: '/admin/products', label: 'Products' }}
        title={isNew ? 'New product' : f.name || 'Product'}
        description={!isNew && <a href={`/product/${f.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-wine underline underline-offset-4">View on site</a>}
        actions={
          <>
            {!isNew && <ConfirmButton title="Delete this product?" description="Products that appear in past orders are hidden instead, so order history stays intact." onConfirm={() => remove.mutateAsync()}>Delete</ConfirmButton>}
            <Button type="submit" loading={save.isPending}>Save product</Button>
          </>
        }
      />
      <FormError>{save.isError ? errorMessage(save.error) : null}</FormError>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <div className="space-y-5 lg:space-y-6 xl:col-span-2">
          <Card icon={FileText} title="Basics">
            <div className="grid gap-4">
              <Field label="Name" error={fe.name}><input className={adminInput} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Short description" hint="One or two sentences shown near the price." error={fe.shortDescription}>
                <Textarea rows={2} value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
              </Field>
              <Field label="Full description" optional hint="Markdown supported.">
                <Textarea rows={6} value={f.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card icon={Images} title="Images">
            <ImagesField value={f.images} onChange={(v) => set('images', v)} />
          </Card>

          <Card icon={IndianRupee} title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pricing method">
                <AdminSelect
                  value={f.pricingMode}
                  onChange={(v) => set('pricingMode', v as FormState['pricingMode'])}
                  options={[
                    { value: 'weight', label: 'By weight × today’s rate' },
                    { value: 'fixed', label: 'Fixed price (incl. GST)' },
                  ]}
                />
              </Field>
              <Field label="Metal purity" error={fe.purity} hint={weight ? 'Its rate comes from Gold rates.' : 'Shown on the product page.'}>
                <AdminSelect
                  value={f.purity}
                  onChange={(v) => set('purity', v)}
                  allowEmpty={weight ? undefined : 'Not applicable'}
                  placeholder="Choose a purity"
                  options={PURITY_KEYS.map((k) => ({ value: k, label: PURITIES[k].name }))}
                />
              </Field>
              {weight && (
                <>
                  <Field label="Making charge type">
                    <AdminSelect
                      value={f.makingType}
                      onChange={(v) => set('makingType', v as FormState['makingType'])}
                      options={[
                        { value: 'percent', label: '% of gold value' },
                        { value: 'per_gram', label: '₹ per gram' },
                        { value: 'flat', label: 'Flat ₹ per piece' },
                      ]}
                    />
                  </Field>
                  <Field label={f.makingType === 'percent' ? 'Making charge (%)' : 'Making charge (₹)'} error={fe['making.value']}>
                    <input className={adminInput} inputMode="decimal" value={f.makingValue} onChange={(e) => set('makingValue', e.target.value.replace(/[^0-9.]/g, ''))} />
                  </Field>
                  <Field label="Discount on making charges (%)" hint="A genuine offer shown on the product. Leave 0 for none.">
                    <input className={adminInput} inputMode="decimal" value={f.makingDiscountPercent} onChange={(e) => set('makingDiscountPercent', e.target.value.replace(/[^0-9.]/g, ''))} />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card
            icon={Boxes}
            title="Variants & stock"
            actions={
              <Button size="sm" variant="light" icon={<Plus className="size-3.5" />} onClick={() => set('variants', [...f.variants, { ...emptyVariant(), sku: '' }])}>
                Add variant
              </Button>
            }
          >
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field label="Option name" optional hint="e.g. Size or Length. Leave blank for single-variant pieces." className="min-w-[14rem]">
                <input className={adminInput} value={f.optionNames[0] ?? ''} onChange={(e) => set('optionNames', e.target.value ? [e.target.value] : [])} />
              </Field>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="text-left text-[0.8125rem] text-muted">
                    <th className="pb-2 pr-2 font-semibold">SKU</th>
                    {f.optionNames[0] && <th className="pb-2 pr-2 font-semibold">{f.optionNames[0]}</th>}
                    {weight ? (
                      <>
                        <th className="pb-2 pr-2 font-semibold">Net wt (g)</th>
                        <th className="pb-2 pr-2 font-semibold">Gross wt (g)</th>
                        <th className="pb-2 pr-2 font-semibold">Stones (₹)</th>
                      </>
                    ) : (
                      <>
                        <th className="pb-2 pr-2 font-semibold">Price (₹)</th>
                        <th className="pb-2 pr-2 font-semibold">Was (₹)</th>
                      </>
                    )}
                    <th className="pb-2 pr-2 font-semibold">Stock</th>
                    <th className="pb-2 pr-2 font-semibold">Price now</th>
                    <th className="pb-2 pr-2 font-semibold">Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {f.variants.map((v, i) => {
                    const p = preview?.[i];
                    const cell = 'h-10 w-full rounded-lg border border-field bg-white px-2.5 text-sm tabular focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20';
                    return (
                      <tr key={i} className="border-t border-hairline align-top">
                        <td className="py-2 pr-2">
                          <input className={cell} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} aria-label="SKU" />
                          {fe[`variants.${i}.sku`] && <p className="mt-1 text-xs text-danger">{fe[`variants.${i}.sku`]}</p>}
                        </td>
                        {f.optionNames[0] && (
                          <td className="py-2 pr-2">
                            <input className={cell} value={v.attributes[f.optionNames[0]] ?? ''} onChange={(e) => setVariant(i, { attributes: { ...v.attributes, [f.optionNames[0]]: e.target.value }, label: e.target.value })} aria-label={f.optionNames[0]} />
                          </td>
                        )}
                        {weight ? (
                          <>
                            <td className="py-2 pr-2">
                              <input className={cell} inputMode="decimal" value={v.netWeight} onChange={(e) => setVariant(i, { netWeight: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Net weight in grams" />
                              {fe[`variants.${i}.netWeightMg`] && <p className="mt-1 text-xs text-danger">{fe[`variants.${i}.netWeightMg`]}</p>}
                            </td>
                            <td className="py-2 pr-2"><input className={cell} inputMode="decimal" value={v.grossWeight} placeholder={v.netWeight} onChange={(e) => setVariant(i, { grossWeight: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Gross weight in grams" /></td>
                            <td className="py-2 pr-2"><input className={cell} inputMode="decimal" value={v.stone} onChange={(e) => setVariant(i, { stone: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Stone charges in rupees" /></td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-2">
                              <input className={cell} inputMode="decimal" value={v.fixedPrice} onChange={(e) => setVariant(i, { fixedPrice: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Price in rupees" />
                              {fe[`variants.${i}.fixedPrice`] && <p className="mt-1 text-xs text-danger">{fe[`variants.${i}.fixedPrice`]}</p>}
                            </td>
                            <td className="py-2 pr-2"><input className={cell} inputMode="decimal" value={v.compareAt} onChange={(e) => setVariant(i, { compareAt: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Previous price in rupees" title="Only enter a genuine previous price" /></td>
                          </>
                        )}
                        <td className="py-2 pr-2">
                          {v.id ? (
                            <Link to={`/admin/inventory?q=${encodeURIComponent(v.sku)}`} className="block pt-2.5 text-sm font-semibold text-wine underline underline-offset-4" title="Change stock in Inventory">{v.existingStock}</Link>
                          ) : (
                            <input className={cell} inputMode="numeric" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value.replace(/\D/g, '') })} aria-label="Opening stock" />
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-2 pt-4 font-semibold tabular">{p ? inr(p.total) : <span className="text-xs font-normal text-muted">—</span>}</td>
                        <td className="py-2 pr-2 pt-3"><Toggle checked={v.isActive} label="Variant active" onChange={(val) => setVariant(i, { isActive: val })} /></td>
                        <td className="py-2 pt-2">
                          {f.variants.length > 1 && (
                            <button type="button" onClick={() => set('variants', f.variants.filter((_, k) => k !== i))} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger" aria-label="Remove variant">
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">Stock for existing variants is changed in Inventory, so concurrent orders are never overwritten.</p>
            {preview?.[0] && weight && (
              <div className="mt-4 rounded-xl border border-hairline bg-cream-2 px-4 py-3 text-xs text-ink-2">
                First variant: gold {inr(preview[0].metalValue)} + making {inr(preview[0].making - preview[0].makingDiscount)}
                {preview[0].stone ? ` + stones ${inr(preview[0].stone)}` : ''} + GST {inr(preview[0].gst)} = <span className="font-semibold">{inr(preview[0].total)}</span>
              </div>
            )}
            {weight && preview && preview.some((p) => p === null) && (
              <Alert tone="warn" className="mt-3">Some variants can’t be priced yet — check the weight, and that a rate is set for {f.purity ? PURITIES[f.purity as keyof typeof PURITIES].name : 'this purity'}.</Alert>
            )}
          </Card>

          <Card icon={ListChecks} title="Specifications" actions={<Button size="sm" variant="light" icon={<Plus className="size-3.5" />} onClick={() => set('specs', [...f.specs, { label: '', value: '' }])}>Add</Button>}>
            {f.specs.length === 0 && <p className="text-sm text-muted">E.g. Hallmark / HUID, Stones, Length, Closure.</p>}
            <div className="space-y-2">
              {f.specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <input className={adminInput} value={s.label} placeholder="Label" onChange={(e) => set('specs', f.specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} aria-label="Specification label" />
                  <input className={adminInput} value={s.value} placeholder="Value" onChange={(e) => set('specs', f.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} aria-label="Specification value" />
                  <button type="button" onClick={() => set('specs', f.specs.filter((_, k) => k !== i))} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger" aria-label="Remove specification"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:space-y-6">
          <Card icon={Eye} title="Visibility">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-ink-2">Live on the store</span><Toggle checked={f.isActive} label="Live" onChange={(v) => set('isActive', v)} /></div>
              <div className="flex items-center justify-between"><span className="text-sm text-ink-2">Featured (“Our picks”)</span><Toggle checked={f.isFeatured} label="Featured" onChange={(v) => set('isFeatured', v)} /></div>
              <Field label="Sort order" hint="Lower numbers show first in “Featured” sorting."><input className={adminInput} inputMode="numeric" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value.replace(/[^0-9-]/g, ''))} /></Field>
            </div>
          </Card>
          <Card icon={ListTree} title="Organisation">
            <div className="space-y-4">
              <Field label="Category" error={fe.category}>
                <AdminSelect value={f.category} onChange={(v) => set('category', v)} placeholder="Choose…" options={catOptions.map((c) => ({ value: c.id, label: c.label }))} />
              </Field>
              <fieldset>
                <legend className="mb-2 text-[0.8125rem] font-semibold text-ink-2">Collections</legend>
                <div className="space-y-1.5">
                  {(cols ?? []).map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 text-sm text-ink-2">
                      <input type="checkbox" className="accent-ink" checked={f.collections.includes(c.id)} onChange={(e) => set('collections', e.target.checked ? [...f.collections, c.id] : f.collections.filter((x) => x !== c.id))} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Tags" optional hint="Comma-separated; used by search."><input className={adminInput} value={f.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
            </div>
          </Card>
          <Card icon={Globe} title="Search engines">
            <div className="space-y-4">
              <Field label="URL slug" optional hint="Leave blank to generate from the name."><input className={adminInput} value={f.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="SEO title" optional><input className={adminInput} value={f.seoTitle} maxLength={120} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
              <Field label="SEO description" optional><Textarea rows={3} maxLength={320} value={f.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} /></Field>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
