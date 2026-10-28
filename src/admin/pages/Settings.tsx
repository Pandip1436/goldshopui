import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BookOpen,
  Camera,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  ExternalLink,
  FileText,
  Gem,
  Globe,
  Hash,
  Heart,
  House,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  LifeBuoy,
  ListOrdered,
  MapPin,
  Megaphone,
  Newspaper,
  PanelBottom,
  Phone,
  PiggyBank,
  Plug,
  Plus,
  Receipt,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Upload,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useBlocker, useSearchParams, type Blocker } from 'react-router';
import { toast } from 'sonner';
import { DEFAULT_JOURNAL_SCRIPT, INDIAN_STATES, PURITIES, PURITY_KEYS, type ImageRef, type PurityKey } from '@goldshop/shared';
import { Field } from '../../components/ui/Form';
import { Img, Skeleton } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';
import { qk, useCategories, useCollections } from '../../lib/hooks';
import { ABOUT_ICON_OPTIONS } from '../../components/aboutIcons';
import { AdminSelect, Alert, Button, Card, FormError, ImagesField, Modal, MoneyInput, SwitchRow, Textarea, adminInput } from '../ui';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BENEFIT_ICONS = [
  { value: 'scale', label: 'Price bill' },
  { value: 'trending', label: 'Rate chart' },
  { value: 'shield', label: 'Shield' },
  { value: 'message', label: 'Support headset' },
  { value: '', label: 'Sparkle' },
];

function IconSelect({ value, onChange, 'aria-label': label }: { value: string; onChange: (v: string) => void; 'aria-label': string }) {
  return <AdminSelect value={value ?? ''} onChange={onChange} aria-label={label} options={[{ value: '', label: 'Icon…' }, ...ABOUT_ICON_OPTIONS]} />;
}
type S = any;


interface Section {
  id: string;
  group: 'Store' | 'Selling' | 'Website pages';
  label: string;
  icon: LucideIcon;
  /** The settings blocks the section edits — for its unsaved-changes dot. */
  keys: string[];
  description: string;
  /** Extra words the section search should find. */
  words: string;
  view?: string;
  links?: { to: string; label: string }[];
}

const SECTIONS: Section[] = [
  { id: 'store', group: 'Store', label: 'Store details', icon: Store, keys: ['store', 'brand'], view: '/contact', words: 'logo symbol mark brand name phone whatsapp email address hours map instagram facebook youtube pinterest gstin legal description tagline', description: 'Your logo, name, contact details, address, hours and social links — shown in the header, footer, contact page, emails and invoices.' },
  { id: 'seo', group: 'Store', label: 'Search engines', icon: Search, keys: ['seo'], words: 'seo google title description', description: 'How your store’s pages are described in Google and other search results.' },
  { id: 'checkout', group: 'Selling', label: 'Checkout & payments', icon: CreditCard, keys: ['checkout'], words: 'cod cash on delivery guest razorpay order prefix returns', description: 'Guest checkout, cash on delivery, order numbers and returns — and which payment and email services are connected.' },
  { id: 'shipping', group: 'Selling', label: 'Shipping', icon: Truck, keys: ['shipping'], words: 'delivery zone pin rates free', description: 'Delivery zones by state and PIN code, their charges, free-delivery thresholds and delivery times.' },
  { id: 'tax', group: 'Selling', label: 'Tax (GST)', icon: Receipt, keys: ['tax'], words: 'gst hsn tax invoice', description: 'The GST rate and HSN code used on prices and invoices.' },
  { id: 'header', group: 'Website pages', label: 'Header & announcement', icon: Megaphone, keys: ['announcement', 'displayRates'], view: '/', words: 'rate bar announcement top', description: 'The gold-rate bar at the top of every page, which rates it shows, and the announcement beside it.' },
  { id: 'home', group: 'Website pages', label: 'Homepage', icon: House, keys: ['homePage', 'benefits'], view: '/', links: [{ to: '/admin/content/banners', label: 'Edit hero slides' }], words: 'circles categories trust tiles promises hero', description: 'The category circles, the row of trust points, the three tiles and the promise strip. The large slides at the top are edited under Website content.' },
  { id: 'story', group: 'Website pages', label: 'Our story', icon: BookOpen, keys: ['about', 'stats', 'storyChapters', 'storePhotos'], view: '/about', words: 'about brand story figures chapters store photos showroom', description: 'Your brand story (also shown on the homepage), the figures under it, the story chapters and photos of your shop.' },
  { id: 'gold-rate', group: 'Website pages', label: 'Gold rate page', icon: ChartNoAxesColumnIncreasing, keys: ['goldRatePage'], view: '/gold-rate', links: [{ to: '/admin/gold-rates', label: 'Set today’s rates' }], words: 'rate card pictures highlights calculator', description: 'The page’s photo, script words, rate-card pictures and highlights. The rates themselves are set under Gold rates.' },
  { id: 'savings', group: 'Website pages', label: 'Savings plan', icon: PiggyBank, keys: ['savingsPlan'], view: '/gold-savings-plan', words: 'scheme plans monthly', description: 'Whether the savings plan page shows, its heading, photos, plans and points.' },
  { id: 'contact', group: 'Website pages', label: 'Contact page', icon: Phone, keys: ['contactPage'], view: '/contact', words: 'storefront reply band', description: 'The photo, introduction, reply note and band on the contact page. Phone, email and address come from Store details.' },
  { id: 'shop', group: 'Website pages', label: 'Shop & collections', icon: ShoppingBag, keys: ['shopPage', 'collectionsPage'], view: '/shop', words: 'banner listing', description: 'The banners at the top of the shop and collections pages.' },
  { id: 'journal', group: 'Website pages', label: 'Journal page', icon: Newspaper, keys: ['journalPage'], view: '/journal', words: 'blog articles banner script', description: 'The journal banner photo and its script words. Articles are written under Website content.' },
  { id: 'account', group: 'Website pages', label: 'Account & help pages', icon: UserRound, keys: ['wishlistPage', 'accountPage', 'helpPage', 'visitSection'], view: '/faq', words: 'wishlist account faq track order visit us banner', description: 'Banners for the wishlist, account, track-order and FAQ pages, and the “Visit us” photo.' },
  { id: 'footer', group: 'Website pages', label: 'Footer', icon: PanelBottom, keys: ['footer'], view: '/', words: 'band bottom', description: 'The band of points above the footer and the footer photo.' },
];

/** Tidies a block before it is saved: rows left empty in the editors are dropped. */
const CLEAN: Record<string, (v: S) => S> = {
  about: (v) => ({ ...v, features: v.features.filter((f: S) => f?.label) }),
  goldRatePage: (v) => ({ ...v, highlights: v.highlights.filter((h: S) => h?.title) }),
  shopPage: (v) => ({ ...v, features: v.features.filter((f: S) => f?.title) }),
  contactPage: (v) => ({ ...v, highlights: v.highlights.filter((h: S) => h?.title) }),
  footer: (v) => ({ ...v, highlights: v.highlights.filter((h: S) => h?.title) }),
  homePage: (v) => ({
    ...v,
    trust: v.trust.filter((x: S) => x?.title),
    promos: v.promos.filter((x: S) => x.title.trim() && x.href.trim()),
    circles: v.circles.filter((c: S) => (c.kind === 'link' ? c.label.trim() && c.href.trim() : c.ref)),
  }),
  storyChapters: (v) => v.map((c: S) => ({ ...c, features: c.features.filter((f: S) => f.label.trim()) })),
  savingsPlan: (v) => ({
    ...v,
    features: v.features.filter((f: S) => f?.title),
    highlights: v.highlights.filter((h: S) => h?.title),
    schemes: v.schemes.filter((c: S) => c.title.trim()).map((c: S) => ({ ...c, points: c.points.filter((x: string) => x.trim()) })),
  }),
};

/** The section list: grouped, searchable, with a dot on sections that have unsaved changes. On phones, a dropdown. */
function SettingsNav({ current, onSelect, dirty }: { current: string; onSelect: (id: string) => void; dirty: Section[] }) {
  const [q, setQ] = useState('');
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = SECTIONS.filter((x) => words.every((w) => `${x.label} ${x.group} ${x.description} ${x.words}`.toLowerCase().includes(w)));
  const groups = (['Store', 'Selling', 'Website pages'] as const).map((g) => ({ g, items: shown.filter((x) => x.group === g) })).filter((x) => x.items.length);
  return (
    <>
      <div className="lg:hidden">
        <AdminSelect
          aria-label="Settings section"
          value={current}
          onChange={onSelect}
          options={SECTIONS.map((x) => ({ value: x.id, label: `${x.label}${dirty.includes(x) ? ' •' : ''}`, hint: x.group }))}
        />
      </div>
      <nav aria-label="Settings sections" className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-hairline bg-white p-3 lg:block">
        <label className="relative block">
          <span className="sr-only">Find a setting</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting…" className={cn(adminInput, 'h-10 pl-9')} />
        </label>
        {groups.length === 0 && <p className="px-2 py-4 text-sm text-muted">Nothing matches “{q}”.</p>}
        {groups.map(({ g, items }) => (
          <div key={g} className="mt-4">
            <p className="px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{g}</p>
            <ul className="mt-1.5 space-y-0.5">
              {items.map((x) => {
                const on = x.id === current;
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(x.id)}
                      aria-current={on ? 'page' : undefined}
                      className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.875rem] transition-colors', on ? 'bg-wine font-semibold text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink')}
                    >
                      <x.icon className={cn('size-4 shrink-0', on ? 'text-white' : 'text-gold-deep')} strokeWidth={1.7} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{x.label}</span>
                      {dirty.includes(x) && <span className={cn('size-2 shrink-0 rounded-full', on ? 'bg-gold-soft' : 'bg-gold')} title="Unsaved changes" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function SectionHeader({ section }: { section: Section }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-hairline bg-white px-5 py-4">
      <div className="flex min-w-0 gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream text-wine">
          <section.icon className="size-5" strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[1.5rem] font-semibold leading-tight text-ink">{section.label}</h2>
          <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-muted">{section.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {section.links?.map((l) => (
          <Link key={l.to} to={l.to} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 text-[0.8125rem] font-semibold text-ink hover:border-gold">
            {l.label} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ))}
        {section.view && (
          <a href={section.view} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 text-[0.8125rem] font-semibold text-wine hover:border-wine">
            View on website <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * One image, the same everywhere in these settings: a label and where it shows, the image shown
 * whole (on a checkerboard for logos, so a transparent background is visible), its size, Change /
 * Remove buttons and, for photos, a short description for screen readers.
 */
function ImageSlot({
  label,
  hint,
  noun = 'photo',
  kind = 'photo',
  folder,
  alt,
  value,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  noun?: string;
  /** logo and mark: shown on a checkerboard, described automatically; portrait: a tall preview. */
  kind?: 'photo' | 'portrait' | 'logo' | 'mark';
  folder: string;
  /** The description given to a logo or symbol (photos are described by the admin). */
  alt?: string;
  value: ImageRef | null | undefined;
  onChange: (v: ImageRef | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const brand = kind === 'logo' || kind === 'mark';
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('files', file);
      return api<ImageRef[]>('/admin/uploads', { form, query: { folder } });
    },
    // photos start without a description (not the file name); logos are described for the admin
    onSuccess: (imgs) => imgs[0] && onChange({ ...imgs[0], alt: brand ? (alt ?? '') : (value?.alt ?? '') }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-white p-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div
        className={cn(
          'relative mt-3 grid place-items-center overflow-hidden rounded-lg border border-hairline',
          kind === 'portrait' ? 'aspect-[4/5] max-h-72' : 'aspect-[5/2]',
          brand ? 'bg-[repeating-conic-gradient(#f4efe6_0_25%,#ffffff_0_50%)] bg-[length:18px_18px]' : 'bg-canvas',
        )}
      >
        {value ? (
          <Img image={value} alt={`Current ${noun}`} sizes="360px" width={960} className={cn('absolute inset-0 size-full object-contain', brand && 'p-4')} />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-xs text-muted">
            <ImagePlus className="size-6 text-gold-deep" strokeWidth={1.5} aria-hidden />
            No {noun} yet
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">{value?.width ? `${value.width} × ${value.height} px` : 'PNG, JPEG, WebP or AVIF, up to 10 MB'}</p>
      {value && !brand && (
        <input
          className={cn(adminInput, 'mt-2 h-9 text-[0.8125rem]')}
          value={value.alt}
          placeholder="Describe the photo (read out by screen readers)"
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          aria-label={`Description of the ${noun}`}
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" icon={<Upload className="size-3.5" />} loading={upload.isPending} onClick={() => input.current?.click()}>
          {value ? `Change ${noun}` : `Upload ${noun}`}
        </Button>
        {value && (
          <Button size="sm" variant="secondary" icon={<Trash2 className="size-3.5" />} onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** How the logo and symbol will look in the header and footer — before saving — with tips. */
function LogoPreview({ logo, mark, name }: { logo: ImageRef | null; mark: ImageRef | null; name: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Preview</p>
      <p className="mt-3 text-xs font-medium text-ink-2">Header</p>
      <div className="mt-1.5 grid h-16 place-items-center rounded-lg border border-hairline bg-[#f7f1e6] px-4">
        {logo ? <Img image={logo} alt="" sizes="240px" width={480} className="max-h-12 w-auto max-w-full object-contain" /> : <span className="font-display text-lg tracking-[0.18em] text-ink">{name.toUpperCase()}</span>}
      </div>
      <p className="mt-3 text-xs font-medium text-ink-2">Footer</p>
      <div className="mt-1.5 flex h-16 items-center justify-center gap-2.5 rounded-lg bg-maroon px-4">
        {mark && <Img image={mark} alt="" sizes="96px" width={480} className="max-h-10 w-auto object-contain" />}
        <span className="truncate font-display text-[0.9375rem] tracking-[0.16em] text-ivory">{name.toUpperCase()}</span>
      </div>
      <p className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Tips for best results</p>
      <ul className="mt-2 space-y-1.5 text-xs text-ink-2">
        {['PNG with a transparent background', 'Full logo at least 1200 px wide', 'Symbol roughly square and clear when small', 'Changes show on the website once saved'].map((tip) => (
          <li key={tip} className="flex gap-2">
            <CheckCircle2 className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One save for everything changed, kept in view at the foot of the screen while there is anything to save. */
function SaveBar({ sections, saving, error, onSave, onDiscard }: { sections: Section[]; saving: boolean; error: string | null; onSave: () => void; onDiscard: () => void }) {
  const clean = sections.length === 0 && !saving;
  return (
    <div role="region" aria-label={clean ? 'Saved' : 'Unsaved changes'} className={cn('sticky bottom-4 z-30 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/95 px-5 py-3.5 shadow-[0_20px_44px_-22px_rgba(63,18,21,.55)] backdrop-blur', clean ? 'border-hairline' : 'border-gold/40')}>
      <div className="min-w-0 text-sm">
        {clean ? (
          <p className="flex items-center gap-2 font-medium text-ink-2">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            All changes saved
          </p>
        ) : (
          <p className="flex items-center gap-2 font-semibold text-ink">
            <span aria-hidden className="size-2 rounded-full bg-gold" />
            {saving ? 'Saving…' : 'Unsaved changes'}
          </p>
        )}
        {sections.length > 0 && <p className="mt-0.5 text-[0.8125rem] text-muted">In {sections.map((x) => x.label).join(', ')}</p>}
        {error && <FormError>{error}</FormError>}
      </div>
      <div className="flex items-center gap-2">
        {!clean && (
          <Button variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        )}
        <Button loading={saving} onClick={onSave} disabled={clean}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

/** Asks before leaving the page with unsaved changes. */
function LeaveGuard({ blocker, sections }: { blocker: Blocker; sections: Section[] }) {
  return (
    <Modal
      open={blocker.state === 'blocked'}
      onOpenChange={(v) => !v && blocker.reset?.()}
      title="Leave without saving?"
      description={`Your changes in ${sections.map((x) => x.label).join(', ') || 'these settings'} haven’t been saved and will be lost.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => blocker.reset?.()}>
            Stay and save
          </Button>
          <Button variant="danger" onClick={() => blocker.proceed?.()}>
            Leave without saving
          </Button>
        </>
      }
    />
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const current = SECTIONS.find((x) => x.id === sp.get('section')) ?? SECTIONS[0];
  const top = useRef<HTMLDivElement>(null);
  const pick = (id: string) => {
    setSp({ section: id }, { replace: true });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api<S>('/admin/settings') });
  // for choosing the homepage circles
  const { data: catTree } = useCategories();
  const { data: collectionList } = useCollections();
  const [s, setS] = useState<S | null>(null);
  const [base, setBase] = useState<S | null>(null);
  useEffect(() => {
    // Older settings documents have no brand-story or gold-rate page block yet; start them empty.
    if (!data) return;
    const loaded = {
          ...data,
          about: { enabled: false, eyebrow: 'About us', title: '', highlight: '', tagline: '', body: '', badge: '', features: [], image: null, insetImage: null, ...(data.about ?? {}) },
          goldRatePage: { image: null, script: '', highlights: [], purityImages: {}, ...(data.goldRatePage ?? {}) },
          journalPage: { image: null, script: DEFAULT_JOURNAL_SCRIPT, ...(data.journalPage ?? {}) },
          footer: { highlights: [], image: null, ...(data.footer ?? {}) },
          shopPage: { image: null, tagline: '', features: [], ...(data.shopPage ?? {}) },
          collectionsPage: { image: null, subtitle: '', ...(data.collectionsPage ?? {}) },
          contactPage: { image: null, subtitle: '', replyNote: '', highlights: [], ...(data.contactPage ?? {}) },
          wishlistPage: { image: null, ...(data.wishlistPage ?? {}) },
          accountPage: { image: null, ...(data.accountPage ?? {}) },
          helpPage: { image: null, ...(data.helpPage ?? {}) },
          homePage: { pricingImage: null, savingsImage: null, trust: [], ...(data.homePage ?? {}), promos: [0, 1, 2].map((j) => ({ title: '', text: '', ctaLabel: '', href: '', image: null, ...(data.homePage?.promos?.[j] ?? {}) })), circles: data.homePage?.circles ?? [] },
          brand: { logo: null, mark: null, ...(data.brand ?? {}) },
          visitSection: { image: null, ...(data.visitSection ?? {}) },
          storePhotos: { title: '', subtitle: '', images: [], ...(data.storePhotos ?? {}) },
          // three fixed point slots per chapter, so typing in the second never shifts it into the first
          storyChapters: (data.storyChapters ?? []).map((c: S) => ({ ...c, features: [0, 1, 2].map((j) => c.features?.[j] ?? { icon: '', value: '', label: '' }) })),
          savingsPlan: {
            enabled: false,
            summary: '',
            tagline: '',
            script: '',
            image: null,
            stepsImage: null,
            features: [],
            highlights: [],
            ...(data.savingsPlan ?? {}),
            // four fixed plan slots with three point slots each, so filling one never shifts another
            schemes: [0, 1, 2, 3].map((j) => {
              const c = data.savingsPlan?.schemes?.[j] ?? {};
              return { title: '', eyebrow: '', details: '', image: null, ...c, points: [0, 1, 2].map((p) => c.points?.[p] ?? '') };
            }),
          },
        };
    setS(structuredClone(loaded));
    setBase(structuredClone(loaded));
  }, [data]);
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/admin/settings', { method: 'PATCH', body }),
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: qk.settings });
      qc.invalidateQueries({ queryKey: qk.goldRates });
    },
  });

  // Top-level settings blocks edited since the last load or save.
  const dirtyKeys = s && base ? Object.keys(s).filter((k) => k !== 'integrations' && JSON.stringify(s[k]) !== JSON.stringify(base[k])) : [];
  const dirtySections = SECTIONS.filter((x) => x.keys.some((k) => dirtyKeys.includes(k)));
  const saveAll = () => {
    if (!s || dirtyKeys.length === 0 || save.isPending) return;
    const saved = structuredClone(s);
    save.mutate(Object.fromEntries(dirtyKeys.map((k) => [k, CLEAN[k] ? CLEAN[k](s[k]) : s[k]])), { onSuccess: () => setBase(saved) });
  };
  const discard = () => {
    save.reset();
    setS(structuredClone(base));
  };
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyKeys.length > 0 && currentLocation.pathname !== nextLocation.pathname);
  // A reload or closing the tab asks first too; Ctrl+S (⌘S) saves.
  const dirty = dirtyKeys.length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const saveRef = useRef(saveAll);
  saveRef.current = saveAll;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (isLoading || !s) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const upd = (path: string, value: unknown) =>
    setS((prev: S) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let o = next;
      for (const k of keys.slice(0, -1)) o = o[k] ??= {};
      o[keys.at(-1)!] = value;
      return next;
    });
  const text = (path: string, label: string, opts: { hint?: string; placeholder?: string; optional?: boolean; required?: boolean } = {}) => {
    const value = path.split('.').reduce((o: S, k) => o?.[k], s) ?? '';
    return (
      <Field label={label} hint={opts.hint} optional={opts.optional} required={opts.required}>
        <input className={adminInput} value={value} placeholder={opts.placeholder} onChange={(e) => upd(path, e.target.value)} />
      </Field>
    );
  };
  const i = s.integrations;
  const flatCats = (catTree ?? []).flatMap((c) => [{ node: c, child: false }, ...c.children.map((ch) => ({ node: ch, child: true }))]);
  const circleCats = flatCats.map(({ node, child }) => ({
    value: node.slug,
    label: child ? `— ${node.name}` : node.name,
    hint: node.productCount ? `${node.productCount} ${node.productCount === 1 ? 'piece' : 'pieces'}` : 'No pieces yet — hidden on the site until it has some',
  }));

  return (
    <div>
      <h1 className="sr-only">Website settings</h1>
      <div className="grid gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
        <SettingsNav current={current.id} onSelect={pick} dirty={dirtySections} />
        <div ref={top} className="min-w-0 scroll-mt-24">
          <SectionHeader section={current} />
          {current.id === 'store' && (
            <div className="space-y-6">
              <Card title="Logo" icon={ImageIcon}>
                <p className="mb-5 text-sm text-muted">Use a PNG with a transparent background. Until a logo is uploaded, the store name is shown as text.</p>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
                  <div className="grid gap-5 md:grid-cols-2">
                    <ImageSlot label="Full logo" noun="logo" kind="logo" folder="brand" hint="Header, checkout and invoices" alt={s.store.name} value={s.brand.logo} onChange={(v) => upd('brand.logo', v)} />
                    <ImageSlot label="Symbol only" noun="symbol" kind="mark" folder="brand" hint="Phone header, footer, menu and loading screen" alt={`${s.store.name} symbol`} value={s.brand.mark} onChange={(v) => upd('brand.mark', v)} />
                  </div>
                  <LogoPreview logo={s.brand.logo} mark={s.brand.mark} name={s.store.name} />
                </div>
              </Card>
              <Card title="Business details" icon={Store}>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('store.name', 'Store name', { required: true, hint: 'Shown in the logo, page titles, emails and invoices.' })}
                  {text('store.legalName', 'Legal business name', { optional: true, hint: 'Printed on invoices.' })}
                  {text('store.tagline', 'Tagline', { hint: 'A short line shown with your name in the header and footer.' })}
                  {text('store.gstin', 'GSTIN', { optional: true, hint: 'Invoices become GST tax invoices once this is set.' })}
                </div>
              </Card>
              <Card title="Store description" icon={FileText}>
                <Field label="Description" hint={`Shown in the footer and used by search engines when a page has no description of its own. ${s.store.description.length}/600`}>
                  <Textarea rows={3} maxLength={600} value={s.store.description} onChange={(e) => upd('store.description', e.target.value)} />
                </Field>
              </Card>
              <Card title="Contact information" icon={Phone}>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('store.phone', 'Phone', { required: true, placeholder: '98765 43210', hint: 'On the contact page and in the footer; customers can tap to call.' })}
                  {text('store.whatsapp', 'WhatsApp number', { hint: 'Shows the WhatsApp button across the site.', optional: true })}
                  {text('store.email', 'Email', { required: true, hint: 'Customers reply here; new-order alerts go here unless ORDER_NOTIFY_EMAIL is set.' })}
                  {text('store.hours', 'Opening hours', { placeholder: 'Mon–Sat 9:30 AM – 9:00 PM; Sunday 10:00 AM – 6:00 PM', optional: true, hint: 'Separate lines with a semicolon.' })}
                </div>
              </Card>
              <Card title="Address" icon={MapPin}>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('store.address.line1', 'Address line 1', { required: true })}
                  {text('store.address.line2', 'Address line 2', { optional: true })}
                  {text('store.address.city', 'City', { required: true })}
                  <Field label="State" required hint="Used to decide CGST+SGST vs IGST.">
                    <AdminSelect value={s.store.address.state} onChange={(v) => upd('store.address.state', v)} placeholder="Choose…" options={INDIAN_STATES.map((x) => ({ value: x, label: x }))} />
                  </Field>
                  {text('store.address.pincode', 'PIN code', { required: true })}
                  {text('store.mapUrl', 'Google Maps link', { optional: true, hint: 'Paste the Share link from Google Maps for exact directions.' })}
                </div>
              </Card>
              <Card title="Social media links" icon={Share2}>
                <p className="mb-4 text-sm text-muted">Each link you fill in shows its icon in the footer.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('store.social.instagram', 'Instagram URL', { optional: true, placeholder: 'https://www.instagram.com/yourstore' })}
                  {text('store.social.facebook', 'Facebook URL', { optional: true, placeholder: 'https://www.facebook.com/yourstore' })}
                  {text('store.social.youtube', 'YouTube URL', { optional: true, placeholder: 'https://www.youtube.com/@yourstore' })}
                  {text('store.social.pinterest', 'Pinterest URL', { optional: true, placeholder: 'https://www.pinterest.com/yourstore' })}
                </div>
              </Card>
            </div>
          )}
          {current.id === 'seo' && (
            <div className="space-y-6">
              <Card title="Search results" icon={Search}>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('seo.titleSuffix', 'Title suffix', { hint: 'Appended to page titles. Leave blank to use the store name.', optional: true })}
                  <Field label="Default description" className="md:col-span-2"><Textarea rows={2} value={s.seo.defaultDescription} onChange={(e) => upd('seo.defaultDescription', e.target.value)} /></Field>
                </div>
              </Card>
            </div>
          )}
          {current.id === 'checkout' && (
            <div className="space-y-6">
              <Card title="Payment integrations" icon={Plug}>
                <ul className="space-y-3 text-sm">
                  {[
                    { ok: i.razorpay, label: `Razorpay ${i.razorpayKeyMode === 'live' ? '(live keys)' : i.razorpayKeyMode === 'test' ? '(test keys — no real money)' : ''}`, hint: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.' },
                    { ok: i.razorpayWebhook, label: 'Razorpay webhook', hint: `Add ${i.publicUrl}/api/payments/razorpay/webhook in the Razorpay dashboard (events: payment.captured, payment.failed, order.paid, refund.processed) and set RAZORPAY_WEBHOOK_SECRET.` },
                    { ok: i.email, label: 'Order emails', hint: 'Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM.' },
                    { ok: i.pincodeLookup, label: 'PIN code → city/state autofill', hint: 'Set PINCODE_LOOKUP=true (uses India Post’s public API).' },
                  ].map((x) => (
                    <li key={x.label} className="flex gap-2">
                      {x.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-subtle" />}
                      <span><span className="font-semibold">{x.label}</span><span className="block text-xs text-muted">{x.ok ? 'Configured' : x.hint}</span></span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted">Secrets are configured on the server, never in this dashboard.</p>
              </Card>
              <Card title="Checkout" icon={ShoppingCart}>
                <SwitchRow label="Allow guest checkout" description="Customers can order without creating an account." checked={s.checkout.guestCheckout} onChange={(v) => upd('checkout.guestCheckout', v)} />
                <SwitchRow label="Offer cash on delivery" description="Only where the shipping zone also allows it." checked={s.checkout.codEnabled} onChange={(v) => upd('checkout.codEnabled', v)} />
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="COD order limit" hint="0 = no limit"><MoneyInput value={s.checkout.codMaxOrderValue} onChange={(v) => upd('checkout.codMaxOrderValue', v)} /></Field>
                  <Field label="COD fee"><MoneyInput value={s.checkout.codFee} onChange={(v) => upd('checkout.codFee', v)} /></Field>
                  <Field label="Order number prefix" hint="1–4 letters"><input className={adminInput} value={s.checkout.orderPrefix} maxLength={4} onChange={(e) => upd('checkout.orderPrefix', e.target.value.toUpperCase())} /></Field>
                  <Field label="Return window (days)" hint="Informational; 0 hides it"><input className={adminInput} inputMode="numeric" value={s.checkout.returnWindowDays} onChange={(e) => upd('checkout.returnWindowDays', Number(e.target.value.replace(/\D/g, '') || 0))} /></Field>
                </div>
              </Card>
            </div>
          )}
          {current.id === 'shipping' && <ShippingEditor s={s} upd={upd} />}
          {current.id === 'tax' && (
            <div className="space-y-6">
              <Card title="GST" icon={Receipt}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="GST rate (%)" hint="3% applies to gold jewellery. Changing this re-prices weight-based products.">
                    <input className={adminInput} inputMode="decimal" value={s.tax.gstRateBps / 100} onChange={(e) => upd('tax.gstRateBps', Math.round(Number(e.target.value.replace(/[^0-9.]/g, '') || 0) * 100))} />
                  </Field>
                  {text('tax.hsnCode', 'HSN code', { hint: '7113 = articles of jewellery' })}
                </div>
              </Card>
            </div>
          )}
          {current.id === 'header' && (
            <div className="space-y-6">
              <Card title="Announcement bar" icon={Megaphone}>
                <SwitchRow label="Show announcement" checked={s.announcement.enabled} onChange={(v) => upd('announcement.enabled', v)} />
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {text('announcement.text', 'Text')}
                  {text('announcement.href', 'Link', { optional: true, placeholder: '/collections/wedding-and-festive' })}
                </div>
              </Card>
              <Card title="Rates shown in the header" icon={ChartNoAxesColumnIncreasing}>
                <div className="flex flex-wrap gap-4">
                  {PURITY_KEYS.map((k: PurityKey) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-ink" checked={s.displayRates.includes(k)} onChange={(e) => upd('displayRates', e.target.checked ? [...s.displayRates, k] : s.displayRates.filter((x: string) => x !== k))} />
                      {PURITIES[k].name}
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          )}
          {current.id === 'home' && (
            <div className="space-y-6">
              <Card
                icon={LayoutGrid}
                title="Category circles (homepage)"
                actions={
                  s.homePage.circles.length < 16 && (
                    <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() => upd('homePage.circles', [...s.homePage.circles, { kind: 'category', ref: '', label: '', href: '', image: null }])}>
                      Add circle
                    </Button>
                  )
                }
              >
                <p className="mb-4 text-sm text-muted">
                  Choose what appears in the row of round photos under the hero, in your order — a category, a collection or any link. While this list is empty, every category with pieces is shown automatically.
                  {s.homePage.circles.length === 0 && flatCats.length > 0 && <> Right now that is: {(catTree ?? []).filter((c) => c.productCount).map((c) => c.name).join(', ')}.</>}
                </p>
                <div className="space-y-3">
                  {s.homePage.circles.map((c: S, k: number) => {
                    const at = (field: string) => `homePage.circles.${k}.${field}`;
                    const move = (d: -1 | 1) => {
                      const next = [...s.homePage.circles];
                      const j = k + d;
                      if (j < 0 || j >= next.length) return;
                      [next[k], next[j]] = [next[j], next[k]];
                      upd('homePage.circles', next);
                    };
                    const target =
                      c.kind === 'category' ? flatCats.find((x) => x.node.slug === c.ref)?.node.name : c.kind === 'collection' ? collectionList?.find((x) => x.slug === c.ref)?.name : undefined;
                    return (
                      <div key={k} className="grid gap-3 rounded-xl border border-hairline bg-canvas p-3 md:grid-cols-[minmax(0,1fr)_7rem]">
                        <div className="grid content-start gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)]">
                          <AdminSelect
                            aria-label={`Circle ${k + 1} type`}
                            value={c.kind}
                            onChange={(v) => upd(`homePage.circles.${k}`, { ...c, kind: v, ref: '', href: '' })}
                            options={[
                              { value: 'category', label: 'Category' },
                              { value: 'collection', label: 'Collection' },
                              { value: 'link', label: 'Other link' },
                            ]}
                          />
                          {c.kind === 'link' ? (
                            <input className={adminInput} value={c.href} placeholder="/shop?purity=gold22" onChange={(e) => upd(at('href'), e.target.value)} aria-label={`Circle ${k + 1} link`} />
                          ) : (
                            <AdminSelect
                              aria-label={`Circle ${k + 1} ${c.kind}`}
                              value={c.ref}
                              onChange={(v) => upd(at('ref'), v)}
                              allowEmpty={c.kind === 'category' ? 'Choose a category…' : 'Choose a collection…'}
                              options={c.kind === 'category' ? circleCats : (collectionList ?? []).map((x) => ({ value: x.slug, label: x.name }))}
                            />
                          )}
                          <input
                            className={adminInput}
                            value={c.label}
                            placeholder={c.kind === 'link' ? 'Label (required)' : target ? `Label — default “${target}”` : 'Label (optional)'}
                            onChange={(e) => upd(at('label'), e.target.value)}
                            aria-label={`Circle ${k + 1} label`}
                          />
                          <div className="flex gap-1 sm:col-span-3">
                            <button type="button" onClick={() => move(-1)} disabled={k === 0} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white disabled:opacity-40" aria-label={`Move circle ${k + 1} earlier`}>
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => move(1)} disabled={k === s.homePage.circles.length - 1} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white disabled:opacity-40" aria-label={`Move circle ${k + 1} later`}>
                              <ArrowDown className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => upd('homePage.circles', s.homePage.circles.filter((_: S, j: number) => j !== k))} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white hover:text-danger" aria-label={`Remove circle ${k + 1}`}>
                              <Trash2 className="size-3.5" />
                            </button>
                            <span className="ml-2 self-center text-xs text-muted">Photo: {c.image ? 'your own' : c.kind === 'link' ? 'none — add one' : 'the category’s or collection’s own'}</span>
                          </div>
                        </div>
                        <div>
                          <ImageSlot label="Photo" folder="home" value={c.image} onChange={(v) => upd(at('image'), v)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card title="Trust row, tiles and section photos" icon={BadgeCheck}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="“Priced in the open” band" hint="Right edge" folder="home" value={s.homePage.pricingImage} onChange={(v) => upd('homePage.pricingImage', v)} />
                  </div>
                  <div>
                    <ImageSlot label="Gold savings plan band" hint="Left edge" folder="home" value={s.homePage.savingsImage} onChange={(v) => upd('homePage.savingsImage', v)} />
                  </div>
                </div>
                <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">Row under the hero (up to six)</p>
                <div className="space-y-2">
                  {Array.from({ length: 6 }, (_, k) => {
                    const list: S[] = s.homePage.trust;
                    const item = list[k] ?? { title: '', text: '', icon: '' };
                    const setItem = (patch: S) => {
                      const next = [...list];
                      next[k] = { ...item, ...patch };
                      upd('homePage.trust', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_9rem]">
                        <input className={adminInput} value={item.title} placeholder={['BIS hallmarked gold', 'Transparent pricing', 'Market-linked gold rates', 'Flexible savings plans', 'Secure shopping', 'Expert guidance & support'][k]} onChange={(e) => setItem({ title: e.target.value })} aria-label={`Row under the hero: item ${k + 1}`} />
                        <IconSelect value={item.icon} onChange={(v) => setItem({ icon: v })} aria-label={`Row under the hero: item ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <p className="mb-1 mt-6 text-[0.8125rem] font-semibold text-ink-2">Tiles under the categories (up to three)</p>
                <p className="mb-3 text-xs text-muted">A tile without a title or link is hidden. A tile linking to /gold-rate also shows your current 22K rate.</p>
                <div className="grid gap-4 lg:grid-cols-3">
                  {s.homePage.promos.map((p: S, k: number) => {
                    const at = (field: string) => `homePage.promos.${k}.${field}`;
                    return (
                      <div key={k} className="space-y-2 rounded-xl border border-hairline bg-canvas p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">Tile {k + 1}</p>
                        <input className={adminInput} value={p.title} placeholder={['Traditional collections', 'Today’s gold rate', 'Savings plans'][k]} onChange={(e) => upd(at('title'), e.target.value)} aria-label={`Tile ${k + 1} title`} />
                        <input className={adminInput} value={p.text} placeholder="One short line" onChange={(e) => upd(at('text'), e.target.value)} aria-label={`Tile ${k + 1} text`} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className={adminInput} value={p.ctaLabel} placeholder="Button" onChange={(e) => upd(at('ctaLabel'), e.target.value)} aria-label={`Tile ${k + 1} button`} />
                          <input className={adminInput} value={p.href} placeholder={['/collections', '/gold-rate', '/gold-savings-plan'][k]} onChange={(e) => upd(at('href'), e.target.value)} aria-label={`Tile ${k + 1} link`} />
                        </div>
                        <ImageSlot label="Photo" folder="home" value={p.image} onChange={(v) => upd(at('image'), v)} />
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card title="Promises (benefit strip)" icon={Sparkles} actions={<Button size="sm" variant="light" icon={<Plus className="size-3.5" />} onClick={() => upd('benefits', [...s.benefits, { title: '', text: '', icon: 'shield' }])}>Add</Button>}>
                <p className="mb-3 text-xs text-muted">Only claims you can stand behind — e.g. add “BIS hallmarked” only if every piece is hallmarked.</p>
                <div className="space-y-3">
                  {s.benefits.map((b: S, k: number) => (
                    <div key={k} className="grid gap-2 md:grid-cols-[1fr_2fr_9rem_auto]">
                      <input className={adminInput} value={b.title} placeholder="Title" onChange={(e) => upd('benefits', s.benefits.map((x: S, j: number) => (j === k ? { ...x, title: e.target.value } : x)))} aria-label="Benefit title" />
                      <input className={adminInput} value={b.text} placeholder="Text" onChange={(e) => upd('benefits', s.benefits.map((x: S, j: number) => (j === k ? { ...x, text: e.target.value } : x)))} aria-label="Benefit text" />
                      <AdminSelect value={b.icon} onChange={(v) => upd('benefits', s.benefits.map((x: S, j: number) => (j === k ? { ...x, icon: v } : x)))} aria-label="Icon" options={BENEFIT_ICONS} />
                      <button type="button" onClick={() => upd('benefits', s.benefits.filter((_: S, j: number) => j !== k))} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger" aria-label="Remove"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          {current.id === 'story' && (
            <div className="space-y-6">
              <Card title="About section (homepage & Our story page)" icon={BookOpen}>
                <SwitchRow
                  label="Show the brand story section"
                  description="Replaces the simple “Our story” block on the homepage and opens the Our story page."
                  checked={s.about.enabled}
                  onChange={(v) => upd('about.enabled', v)}
                />
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {text('about.eyebrow', 'Small heading', { placeholder: 'About us' })}
                  {text('about.tagline', 'Tagline', { placeholder: 'Fine gold jewellery, priced in the open', optional: true })}
                  {text('about.title', 'Headline (first line)', { placeholder: 'A Legacy of' })}
                  {text('about.highlight', 'Headline (gold second line)', { placeholder: 'Trust & Timeless Beauty', optional: true })}
                  <Field label="Story" hint="Separate paragraphs with a blank line." className="md:col-span-2">
                    <Textarea rows={6} value={s.about.body} onChange={(e) => upd('about.body', e.target.value)} />
                  </Field>
                  {text('about.badge', 'Seal text (maroon circle)', { placeholder: 'Crafted with care for your precious moments', optional: true })}
                </div>
                <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">Four promises</p>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((k) => {
                    const f = s.about.features[k] ?? { label: '', icon: '' };
                    const setF = (patch: S) => {
                      const next = [...s.about.features];
                      next[k] = { ...f, ...patch };
                      upd('about.features', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid grid-cols-[1fr_9rem] gap-2">
                        <input className={adminInput} value={f.label} placeholder={['Trusted by generations', '100% BIS hallmarked gold', 'Exquisite craftsmanship', 'Customer first approach'][k]} onChange={(e) => setF({ label: e.target.value })} aria-label={`Promise ${k + 1}`} />
                        <IconSelect value={f.icon} onChange={(v) => setF({ icon: v })} aria-label={`Promise ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Main photo" hint="Portrait" kind="portrait" folder="about" value={s.about.image} onChange={(v) => upd('about.image', v)} />
                  </div>
                  <div>
                    <ImageSlot label="Detail photo" hint="Shown in the circle" folder="about" value={s.about.insetImage} onChange={(v) => upd('about.insetImage', v)} />
                  </div>
                </div>
                <Alert tone="warn" className="mt-4">Every claim here (years, hallmarking, “trusted by generations”) must be true for your business — consumer law treats them as promises.</Alert>
              </Card>
              <Card title="Figures (shown under the brand story)" icon={Hash} actions={<Button size="sm" variant="light" icon={<Plus className="size-3.5" />} onClick={() => upd('stats', [...s.stats, { value: '', label: '', icon: '' }])}>Add</Button>}>
                <Alert tone="warn" className="mb-3">Only show figures you can verify (e.g. “25+ years”, “1L+ customers” only if your records support them). Leave empty to hide the band.</Alert>
                <div className="space-y-2">
                  {s.stats.map((x: S, k: number) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr_9rem_auto] gap-2">
                      <input className={adminInput} value={x.value} placeholder="25+" onChange={(e) => upd('stats', s.stats.map((y: S, j: number) => (j === k ? { ...y, value: e.target.value } : y)))} aria-label="Figure value" />
                      <input className={adminInput} value={x.label} placeholder="Years of trust" onChange={(e) => upd('stats', s.stats.map((y: S, j: number) => (j === k ? { ...y, label: e.target.value } : y)))} aria-label="Figure label" />
                      <IconSelect value={x.icon ?? ''} onChange={(v) => upd('stats', s.stats.map((y: S, j: number) => (j === k ? { ...y, icon: v } : y)))} aria-label="Figure icon" />
                      <button type="button" onClick={() => upd('stats', s.stats.filter((_: S, j: number) => j !== k))} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger" aria-label="Remove"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card
                icon={ListOrdered}
                title="Story chapters (Our story page)"
                actions={
                  s.storyChapters.length < 8 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus className="size-3.5" />}
                      onClick={() => upd('storyChapters', [...s.storyChapters, { title: '', eyebrow: '', body: '', image: null, features: [0, 1, 2].map(() => ({ icon: '', value: '', label: '' })) }])}
                    >
                      Add chapter
                    </Button>
                  )
                }
              >
                <p className="mb-3 text-sm text-muted">Numbered cards, four across on the Our story page (up to eight). A chapter without a title is hidden. The points along the foot of a card are optional.</p>
                <Alert tone="warn" className="mb-4">Figures and claims here (customers, designs, states served, hallmarking) must be true — and should match the figures band above, which shows on the same page.</Alert>
                <div className="space-y-4">
                  {s.storyChapters.map((c: S, k: number) => {
                    const setC = (patch: S) => upd('storyChapters', s.storyChapters.map((x: S, j: number) => (j === k ? { ...x, ...patch } : x)));
                    const move = (d: -1 | 1) => {
                      const next = [...s.storyChapters];
                      const j = k + d;
                      if (j < 0 || j >= next.length) return;
                      [next[k], next[j]] = [next[j], next[k]];
                      upd('storyChapters', next);
                    };
                    const num = String(k + 1).padStart(2, '0');
                    return (
                      <div key={k} className="rounded-xl border border-hairline bg-canvas p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">Chapter {num}</p>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => move(-1)} disabled={k === 0} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white disabled:opacity-40" aria-label={`Move chapter ${num} earlier`}><ArrowUp className="size-3.5" /></button>
                            <button type="button" onClick={() => move(1)} disabled={k === s.storyChapters.length - 1} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white disabled:opacity-40" aria-label={`Move chapter ${num} later`}><ArrowDown className="size-3.5" /></button>
                            <button type="button" onClick={() => upd('storyChapters', s.storyChapters.filter((_: S, j: number) => j !== k))} className="grid size-8 place-items-center rounded-lg border border-hairline bg-white hover:text-danger" aria-label={`Remove chapter ${num}`}><Trash2 className="size-3.5" /></button>
                          </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                          <div className="grid content-start gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Title">
                                <input className={adminInput} value={c.title} placeholder="Our Beginnings" onChange={(e) => setC({ title: e.target.value })} />
                              </Field>
                              <Field label="Small heading" optional>
                                <input className={adminInput} value={c.eyebrow} placeholder="Rooted in tradition, built on trust" onChange={(e) => setC({ eyebrow: e.target.value })} />
                              </Field>
                            </div>
                            <Field label="Text" optional>
                              <Textarea rows={3} value={c.body} onChange={(e) => setC({ body: e.target.value })} />
                            </Field>
                            <div>
                              <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">Points along the foot <span className="font-normal text-subtle">(optional; figure e.g. “28”)</span></p>
                              <div className="space-y-2">
                                {[0, 1, 2].map((fk) => {
                                  const f = c.features[fk];
                                  const setF = (patch: S) => setC({ features: c.features.map((x: S, j: number) => (j === fk ? { ...x, ...patch } : x)) });
                                  return (
                                    <div key={fk} className="grid grid-cols-[8.5rem_5rem_minmax(0,1fr)] gap-2">
                                      <IconSelect value={f.icon} onChange={(v) => setF({ icon: v })} aria-label={`Chapter ${num} point ${fk + 1} icon`} />
                                      <input className={adminInput} value={f.value} placeholder="Figure" onChange={(e) => setF({ value: e.target.value })} aria-label={`Chapter ${num} point ${fk + 1} figure`} />
                                      <input className={adminInput} value={f.label} placeholder="Label" onChange={(e) => setF({ label: e.target.value })} aria-label={`Chapter ${num} point ${fk + 1} label`} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div>
                            <ImageSlot label="Photo" hint="On the right, fades into the card" folder="story" value={c.image} onChange={(v) => setC({ image: v })} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card title="Store photos (Our story page)" icon={Camera}>
                <p className="mb-4 text-sm text-muted">
                  Photographs of your shop — the showroom, counters, entrance. The gallery appears on the Our story page once you add a photo. The first photo is shown largest; the text under each
                  photo is its caption.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {text('storePhotos.title', 'Heading', { placeholder: 'Step inside our store', optional: true })}
                  {text('storePhotos.subtitle', 'Short line under the heading', { placeholder: 'Our showroom in Sivakasi, where every piece can be seen and weighed.', optional: true })}
                </div>
                <div className="mt-5">
                  <ImagesField folder="store" max={12} blankAlt altPlaceholder="Caption, e.g. Our showroom" value={s.storePhotos.images} onChange={(v) => upd('storePhotos.images', v)} />
                </div>
              </Card>
            </div>
          )}
          {current.id === 'gold-rate' && (
            <div className="space-y-6">
              <Card title="Photo, card pictures and highlights" icon={ChartNoAxesColumnIncreasing}>
                <p className="mb-4 text-sm text-muted">The rates themselves are set under Gold rates. Here you choose the page’s photo and the highlights shown under the calculator.</p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Banner photo" hint="Wide, subject on the right" folder="gold-rate" value={s.goldRatePage.image} onChange={(v) => upd('goldRatePage.image', v)} />
                  </div>
                  <Field label="Script words over the photo" hint="One short line each, up to four. Leave empty if your photo already has text." optional>
                    <Textarea rows={3} value={s.goldRatePage.script} placeholder={'Pure Gold\nTimeless\nValue'} onChange={(e) => upd('goldRatePage.script', e.target.value)} />
                  </Field>
                </div>
                <p className="mb-1 mt-6 text-[0.8125rem] font-semibold text-ink-2">Rate card photos</p>
                <p className="mb-3 text-xs text-muted">One per purity, on a light background (it blends into the card). A purity without a photo shows a gold coin.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {PURITY_KEYS.map((k: PurityKey) => (
                    <div key={k}>
                      <ImageSlot label={PURITIES[k].name} folder="gold-rate" value={s.goldRatePage.purityImages?.[k]} onChange={(v) => upd(`goldRatePage.purityImages.${k}`, v)} />
                    </div>
                  ))}
                </div>
                <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">Highlights (up to six)</p>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5].map((k) => {
                    const h = s.goldRatePage.highlights[k] ?? { title: '', text: '', icon: '' };
                    const setH = (patch: S) => {
                      const next = [...s.goldRatePage.highlights];
                      next[k] = { ...h, ...patch };
                      upd('goldRatePage.highlights', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                        <input className={adminInput} value={h.title} placeholder={['Transparent pricing', 'Price locked at order', 'BIS hallmarked gold', 'Trusted by generations', 'Expert guidance', 'No hidden charges'][k]} onChange={(e) => setH({ title: e.target.value })} aria-label={`Highlight ${k + 1} title`} />
                        <input className={adminInput} value={h.text} placeholder={['Metal, making and GST shown on every piece', 'The rate when you order is the rate you pay', 'Guaranteed purity', 'Quality you can rely on', 'Ask us anything', 'Every charge itemised'][k]} onChange={(e) => setH({ text: e.target.value })} aria-label={`Highlight ${k + 1} text`} />
                        <IconSelect value={h.icon} onChange={(v) => setH({ icon: v })} aria-label={`Highlight ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <Alert tone="warn" className="mt-4">Only promise what you do: “updated multiple times a day” only if you really update the rate that often, “BIS hallmarked” only if every piece you sell is. Leave a row empty to hide it.</Alert>
              </Card>
            </div>
          )}
          {current.id === 'savings' && (
            <div className="space-y-6">
              <Card title="Plan page content" icon={PiggyBank}>
                <SwitchRow label="Show the savings plan page and enquiry form" checked={s.savingsPlan.enabled} onChange={(v) => upd('savingsPlan.enabled', v)} />
                <Field label="Summary" hint="Shown beside “How it works” and on the homepage." className="mt-3"><Textarea rows={3} value={s.savingsPlan.summary} onChange={(e) => upd('savingsPlan.summary', e.target.value)} /></Field>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {text('savingsPlan.tagline', 'Line under the heading', { placeholder: 'Plan Today | Save Easily | Own Your Dream Jewellery', optional: true })}
                  <Field label="Script words over the photo" hint="One short line each, up to five." optional>
                    <Textarea rows={5} value={s.savingsPlan.script} onChange={(e) => upd('savingsPlan.script', e.target.value)} placeholder={'Save Today\nfor a\nShining\nTomorrow'} />
                  </Field>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Main photo" hint="Portrait, beside the heading" kind="portrait" folder="savings" value={s.savingsPlan.image} onChange={(v) => upd('savingsPlan.image', v)} />
                  </div>
                  <div>
                    <ImageSlot label="“How it works” photo" folder="savings" value={s.savingsPlan.stepsImage} onChange={(v) => upd('savingsPlan.stepsImage', v)} />
                  </div>
                </div>
                {(
                  [
                    { key: 'features', label: 'Points under the heading (up to four)', max: 4, ph: [['Easy monthly savings', ''], ['Flexible plans', ''], ['Transparent terms', ''], ['Make your dreams come true', '']] },
                    { key: 'highlights', label: 'Band under the plans (up to six)', max: 6, ph: [['Transparent pricing', ''], ['No hidden charges', ''], ['Flexible payment options', ''], ['Wide jewellery collections', ''], ['Expert guidance & support', ''], ['Redeem for any piece', '']] },
                  ] as const
                ).map((group) => (
                  <div key={group.key}>
                    <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">{group.label}</p>
                    <div className="space-y-2">
                      {Array.from({ length: group.max }, (_, k) => {
                        const list: S[] = s.savingsPlan[group.key];
                        const item = list[k] ?? { title: '', text: '', icon: '' };
                        const setItem = (patch: S) => {
                          const next = [...list];
                          next[k] = { ...item, ...patch };
                          upd(`savingsPlan.${group.key}`, next.filter(Boolean));
                        };
                        return (
                          <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                            <input className={adminInput} value={item.title} placeholder={group.ph[k][0]} onChange={(e) => setItem({ title: e.target.value })} aria-label={`${group.label}: item ${k + 1} title`} />
                            <input className={adminInput} value={item.text} placeholder={group.ph[k][1]} onChange={(e) => setItem({ text: e.target.value })} aria-label={`${group.label}: item ${k + 1} text`} />
                            <IconSelect value={item.icon} onChange={(v) => setItem({ icon: v })} aria-label={`${group.label}: item ${k + 1} icon`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="mb-1 mt-6 text-[0.8125rem] font-semibold text-ink-2">Plans (up to four cards)</p>
                <p className="mb-3 text-xs text-muted">A plan with no title is hidden. Write the plan’s terms in “Details” to give its card a “View plan details” button; without them the button asks about the plan through the call-back form.</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  {s.savingsPlan.schemes.map((c: S, k: number) => {
                    const at = (field: string) => `savingsPlan.schemes.${k}.${field}`;
                    return (
                      <div key={k} className="rounded-xl border border-hairline bg-canvas p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">Plan {k + 1}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Title"><input className={adminInput} value={c.title} placeholder="Monthly Savings Scheme" onChange={(e) => upd(at('title'), e.target.value)} /></Field>
                          <Field label="Small heading" optional><input className={adminInput} value={c.eyebrow} placeholder="Small steps, big dreams" onChange={(e) => upd(at('eyebrow'), e.target.value)} /></Field>
                        </div>
                        <div className="mt-3 space-y-2">
                          {[0, 1, 2].map((p) => (
                            <input key={p} className={adminInput} value={c.points[p]} placeholder={`Point ${p + 1}`} onChange={(e) => upd(at(`points.${p}`), e.target.value)} aria-label={`Plan ${k + 1} point ${p + 1}`} />
                          ))}
                        </div>
                        <Field label="Details (terms)" optional className="mt-3">
                          <Textarea rows={3} value={c.details} placeholder="Duration, monthly amount, what you can redeem, any benefit — exactly as your plan terms state." onChange={(e) => upd(at('details'), e.target.value)} />
                        </Field>
                        <ImageSlot label="Photo" hint="Wide" folder="savings" value={c.image} onChange={(v) => upd(at('image'), v)} />
                      </div>
                    );
                  })}
                </div>
                <Alert tone="warn" className="mt-4">
                  Savings schemes are regulated. Only state what your plan actually offers — avoid “100% safe”, “guaranteed” or “redeem anytime” unless your plan terms say exactly that, and keep figures like “thousands of families” to what your records show. Leave a row empty to hide it.
                </Alert>
              </Card>
            </div>
          )}
          {current.id === 'contact' && (
            <div className="space-y-6">
              <Card title="Photo, introduction and band" icon={Phone}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Photo beside the form" hint="Your storefront works well" folder="contact" value={s.contactPage.image} onChange={(v) => upd('contactPage.image', v)} />
                  </div>
                  <Field label="Line under “We’re here for you”" hint="If you promise a reply time here, make sure you can keep it." optional>
                    <Textarea rows={3} value={s.contactPage.subtitle} placeholder="Ask about a piece, sizing, custom work, an order, or how our prices are calculated. We usually reply the same working day." onChange={(e) => upd('contactPage.subtitle', e.target.value)} />
                  </Field>
                </div>
                <div className="mt-4 max-w-md">{text('contactPage.replyNote', 'Note under the email card', { placeholder: 'We usually reply within 24 hours', hint: 'Only a reply time you can keep. Empty shows “Write to us any time”.', optional: true })}</div>
                <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">Band at the foot of the page (up to six)</p>
                <div className="space-y-2">
                  {Array.from({ length: 6 }, (_, k) => {
                    const list: S[] = s.contactPage.highlights;
                    const item = list[k] ?? { title: '', text: '', icon: '' };
                    const setItem = (patch: S) => {
                      const next = [...list];
                      next[k] = { ...item, ...patch };
                      upd('contactPage.highlights', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_9rem]">
                        <input className={adminInput} value={item.title} placeholder={['Wide range of collections', 'Expert guidance & support', 'Hallmarked gold', 'Transparent pricing', 'Cash on delivery', 'Visit our showroom'][k]} onChange={(e) => setItem({ title: e.target.value })} aria-label={`Contact band item ${k + 1}`} />
                        <IconSelect value={item.icon} onChange={(v) => setItem({ icon: v })} aria-label={`Contact band item ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted">Phone, WhatsApp, email, address, map link and hours come from the Store tab; each card shows only when its detail is filled in. While this band has items, the footer’s band is left off this page so the two don’t repeat.</p>
              </Card>
            </div>
          )}
          {current.id === 'shop' && (
            <div className="space-y-6">
              <Card title="Shop page banner" icon={ShoppingBag}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Banner photo" hint="Wide, subject on the right" folder="shop" value={s.shopPage.image} onChange={(v) => upd('shopPage.image', v)} />
                    <p className="mt-1.5 text-xs text-muted">Category and collection pages use their own photo when they have one.</p>
                  </div>
                  {text('shopPage.tagline', 'Tagline under “All Jewellery”', { placeholder: 'Timeless designs for every occasion', optional: true })}
                </div>
                <p className="mb-2 mt-6 text-[0.8125rem] font-semibold text-ink-2">Points beside the heading (up to three)</p>
                <div className="space-y-2">
                  {[0, 1, 2].map((k) => {
                    const f = s.shopPage.features[k] ?? { title: '', text: '', icon: '' };
                    const setF = (patch: S) => {
                      const next = [...s.shopPage.features];
                      next[k] = { ...f, ...patch };
                      upd('shopPage.features', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                        <input className={adminInput} value={f.title} placeholder={['BIS hallmarked', 'Transparent pricing', 'Price locked at order'][k]} onChange={(e) => setF({ title: e.target.value })} aria-label={`Shop banner point ${k + 1} title`} />
                        <input className={adminInput} value={f.text} placeholder={['Guaranteed purity', 'No hidden charges', 'The rate you see is the rate you pay'][k]} onChange={(e) => setF({ text: e.target.value })} aria-label={`Shop banner point ${k + 1} text`} />
                        <IconSelect value={f.icon} onChange={(v) => setF({ icon: v })} aria-label={`Shop banner point ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <Alert tone="warn" className="mt-4">These show on every listing page. Keep them to promises that hold for every piece — leave a row empty to hide it.</Alert>
              </Card>
              <Card title="Collections page banner" icon={Gem}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Banner photo" hint="Wide, subject on the right" folder="collections" value={s.collectionsPage.image} onChange={(v) => upd('collectionsPage.image', v)} />
                  </div>
                  {text('collectionsPage.subtitle', 'Line under “Curated for every occasion”', { placeholder: 'Meaningful jewellery for life’s beautiful moments — from temple heritage to everyday gold.', optional: true })}
                </div>
                <p className="mt-4 text-xs text-muted">Each collection’s small heading, tagline and wide photo are set under Catalogue → Collections.</p>
              </Card>
            </div>
          )}
          {current.id === 'journal' && (
            <div className="space-y-6">
              <Card title="Journal page banner" icon={Newspaper}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Banner photo" hint="Wide" folder="journal" value={s.journalPage.image} onChange={(v) => upd('journalPage.image', v)} />
                    <p className="mt-1.5 text-xs text-muted">Without one, a collection photo is used.</p>
                  </div>
                  <Field label="Script words over the photo" hint="One short line each, up to five. Put a word in *asterisks* to set it in gold. Leave empty for none." optional>
                    <Textarea rows={5} value={s.journalPage.script} placeholder={'More\nThan\n*Gold*\nStories\n*That* Last'} onChange={(e) => upd('journalPage.script', e.target.value)} />
                  </Field>
                </div>
              </Card>
            </div>
          )}
          {current.id === 'account' && (
            <div className="space-y-6">
              <Card title="Wishlist page banner" icon={Heart}>
                <div className="max-w-md">
                  <ImageSlot label="Banner photo" hint="Wide, subject on the right" folder="wishlist" value={s.wishlistPage.image} onChange={(v) => upd('wishlistPage.image', v)} />
                </div>
              </Card>
              <Card title="Account pages banner" icon={UserRound}>
                <div className="max-w-md">
                  <ImageSlot label="Banner photo" hint="Wide, subject on the right" folder="account" value={s.accountPage.image} onChange={(v) => upd('accountPage.image', v)} />
                </div>
              </Card>
              <Card title="Help pages and Visit us photos" icon={LifeBuoy}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ImageSlot label="Track order & FAQ banner" hint="Wide, subject on the right" folder="help" value={s.helpPage.image} onChange={(v) => upd('helpPage.image', v)} />
                  </div>
                  <div>
                    <ImageSlot label="“Visit us” section on the Our story page" folder="about" value={s.visitSection.image} onChange={(v) => upd('visitSection.image', v)} />
                  </div>
                </div>
              </Card>
            </div>
          )}
          {current.id === 'footer' && (
            <div className="space-y-6">
              <Card title="Footer band and photo" icon={PanelBottom}>
                <p className="mb-2 text-[0.8125rem] font-semibold text-ink-2">Band above the footer (up to four)</p>
                <p className="mb-3 text-xs text-muted">
                  Write <code className="rounded-xs bg-sand px-1">{'{freeShippingAbove}'}</code> or <code className="rounded-xs bg-sand px-1">{'{returnDays}'}</code> to use the figure from your shipping and returns settings — the item is hidden whenever that figure doesn’t apply.
                </p>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((k) => {
                    const h = s.footer.highlights[k] ?? { title: '', text: '', icon: '' };
                    const setH = (patch: S) => {
                      const next = [...s.footer.highlights];
                      next[k] = { ...h, ...patch };
                      upd('footer.highlights', next.filter(Boolean));
                    };
                    return (
                      <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                        <input className={adminInput} value={h.title} placeholder={['BIS hallmarked gold', 'Free shipping over {freeShippingAbove}', 'Easy returns & refunds', 'Dedicated support'][k]} onChange={(e) => setH({ title: e.target.value })} aria-label={`Footer band item ${k + 1} title`} />
                        <input className={adminInput} value={h.text} placeholder={['Guaranteed purity', 'Delivered across India', 'Within {returnDays} days of delivery', 'Call, WhatsApp or email us'][k]} onChange={(e) => setH({ text: e.target.value })} aria-label={`Footer band item ${k + 1} text`} />
                        <IconSelect value={h.icon} onChange={(v) => setH({ icon: v })} aria-label={`Footer band item ${k + 1} icon`} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 max-w-sm">
                  <ImageSlot label="Corner photo" hint="Shown on wide screens" folder="footer" value={s.footer.image} onChange={(v) => upd('footer.image', v)} />
                </div>
                <Alert tone="warn" className="mt-4">This band shows on every page. “BIS hallmarked”, “insured” or “free” must be true for every order — leave a row empty to hide it.</Alert>
              </Card>
            </div>
          )}
          <SaveBar sections={dirtySections} saving={save.isPending} error={save.isError ? errorMessage(save.error) : null} onSave={saveAll} onDiscard={discard} />
        </div>
      </div>
      <LeaveGuard blocker={blocker} sections={dirtySections} />
    </div>
  );
}

function ShippingEditor({ s, upd }: { s: S; upd: (p: string, v: unknown) => void }) {
  const zones: S[] = s.shipping.zones;
  const setZone = (k: number, patch: S) => upd('shipping.zones', zones.map((z, j) => (j === k ? { ...z, ...patch } : z)));
  return (
    <div className="space-y-6">
      <Alert>A delivery PIN matches the zone with the longest matching PIN prefix first, then a zone listing its state, then the “rest of India” fallback (if enabled).</Alert>
      {zones.map((z, k) => (
        <Card key={k} icon={Truck} title={z.name || 'New zone'} actions={<button type="button" onClick={() => upd('shipping.zones', zones.filter((_, j) => j !== k))} className="text-xs font-semibold text-danger">Remove zone</button>}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Zone name"><input className={adminInput} value={z.name} onChange={(e) => setZone(k, { name: e.target.value })} /></Field>
            <Field label="Charge"><MoneyInput value={z.rate} onChange={(v) => setZone(k, { rate: v })} /></Field>
            <Field label="Free above" hint="0 = never free (unless charge is 0)"><MoneyInput value={z.freeAbove} onChange={(v) => setZone(k, { freeAbove: v })} /></Field>
            <Field label="PIN prefixes" hint="Comma-separated, e.g. 600, 641" className="md:col-span-2">
              <input className={adminInput} value={z.pinPrefixes.join(', ')} onChange={(e) => setZone(k, { pinPrefixes: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min days"><input className={adminInput} inputMode="numeric" value={z.etaMinDays} onChange={(e) => setZone(k, { etaMinDays: Number(e.target.value || 0) })} /></Field>
              <Field label="Max days"><input className={adminInput} inputMode="numeric" value={z.etaMaxDays} onChange={(e) => setZone(k, { etaMaxDays: Number(e.target.value || 0) })} /></Field>
            </div>
            <fieldset className="md:col-span-2">
              <legend className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">
                States <span className="font-normal text-muted">({z.states.length} chosen)</span>
              </legend>
              <div className="grid max-h-48 grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto rounded-lg border border-field bg-white p-3 sm:grid-cols-2">
                {INDIAN_STATES.map((x) => (
                  <label key={x} className="flex items-center gap-2.5 text-sm text-ink-2">
                    <input type="checkbox" checked={z.states.includes(x)} onChange={(e) => setZone(k, { states: e.target.checked ? [...z.states, x] : z.states.filter((y: string) => y !== x) })} />
                    {x}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1">
              <SwitchRow label="Cash on delivery" checked={z.codAvailable} onChange={(v) => setZone(k, { codAvailable: v })} />
              <SwitchRow label="Active" checked={z.isActive} onChange={(v) => setZone(k, { isActive: v })} />
            </div>
          </div>
        </Card>
      ))}
      <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => upd('shipping.zones', [...zones, { name: '', states: [], pinPrefixes: [], rate: 0, freeAbove: 0, codAvailable: false, etaMinDays: 3, etaMaxDays: 7, isActive: true }])}>
        Add zone
      </Button>
      <Card title="Rest of India (fallback)" icon={Globe}>
        <SwitchRow label="Deliver to PIN codes outside the zones above" checked={s.shipping.fallbackEnabled} onChange={(v) => upd('shipping.fallbackEnabled', v)} />
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <Field label="Charge"><MoneyInput value={s.shipping.fallbackRate} onChange={(v) => upd('shipping.fallbackRate', v)} /></Field>
          <Field label="Free above"><MoneyInput value={s.shipping.fallbackFreeAbove} onChange={(v) => upd('shipping.fallbackFreeAbove', v)} /></Field>
          <Field label="Min days"><input className={adminInput} inputMode="numeric" value={s.shipping.fallbackEtaMin} onChange={(e) => upd('shipping.fallbackEtaMin', Number(e.target.value || 0))} /></Field>
          <Field label="Max days"><input className={adminInput} inputMode="numeric" value={s.shipping.fallbackEtaMax} onChange={(e) => upd('shipping.fallbackEtaMax', Number(e.target.value || 0))} /></Field>
        </div>
        <SwitchRow label="Cash on delivery for fallback" checked={s.shipping.fallbackCod} onChange={(v) => upd('shipping.fallbackCod', v)} />
        <Field label="Shipping note" optional className="mt-3"><input className={adminInput} value={s.shipping.note} onChange={(e) => upd('shipping.note', e.target.value)} /></Field>
      </Card>
    </div>
  );
}
