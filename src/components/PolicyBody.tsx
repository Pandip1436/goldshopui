import DOMPurify from 'dompurify';
import {
  Archive,
  Banknote,
  ClipboardCheck,
  Cookie,
  CreditCard,
  FileText,
  Gavel,
  Info,
  Lock,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Scale,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  UserRound,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';
import { marked, type Token, type Tokens } from 'marked';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

/** An icon for a passage, matched on its words. Order matters: the first match wins. */
const ICONS: [RegExp, LucideIcon][] = [
  [/by us|we may need to cancel/i, ShieldCheck],
  [/unpaid|payment isn|reserv/i, FileText],
  [/cash[- ]on[- ]delivery|\bcod\b|cash/i, Banknote],
  [/card|upi|bank|razorpay|gateway|online payment/i, CreditCard],
  [/ship|dispatch|deliver|courier|track/i, Truck],
  [/return|exchange|buy-?back/i, RefreshCw],
  [/refund/i, PackageCheck],
  [/pack|insur/i, Package],
  [/where we|pin code|address/i, MapPin],
  [/cookie|technical/i, Cookie],
  [/privacy|personal data|data|collect|secure|protect/i, Lock],
  [/details you give|account|your details/i, UserRound],
  [/price|pricing|rate|charge/i, Tag],
  [/law|dispute|liabil|govern|terms/i, Scale],
  [/paid|order/i, ShoppingBag],
  [/we may|cancel/i, ShieldCheck],
];
/** Headings that say plainly what a section is about, checked before the general words. */
const HEADING_ICONS: [RegExp, LucideIcon][] = [
  [/how we use|use of/i, ClipboardCheck],
  [/shar/i, Share2],
  [/retention|how long we keep/i, Archive],
  [/your rights/i, UserRoundCheck],
  [/contact|get in touch|grievance/i, Mail],
  [/governing law|disputes?/i, Gavel],
];
const iconFor = (text: string) => ICONS.find(([rx]) => rx.test(text))?.[1] ?? FileText;
const sectionIcon = (heading: string, text: string) => HEADING_ICONS.find(([rx]) => rx.test(heading))?.[1] ?? ICONS.find(([rx]) => rx.test(heading))?.[1] ?? iconFor(text);

const clean = (html: string) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target', 'rel'] });
const inline = (md: string) => clean(marked.parseInline(md, { async: false }) as string);
const block = (tokens: Token[]) => clean(marked.parser(tokens));

function Html({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function IconCircle({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-pale/45 text-gold-deep sm:size-16">
      <Icon className="size-6 sm:size-7" strokeWidth={1.3} />
    </span>
  );
}

/** "**Title:** rest" or "**Title** rest" → its parts; a lead that runs on into the sentence stays inline. */
function lead(md: string): { title?: string; body: string } {
  const m = /^\*\*(.+?)\*\*\s*(:|—|–|-)?\s*([\s\S]*)$/.exec(md.trim());
  if (!m) return { body: md };
  const [, title, sep, rest] = m;
  const titleEnds = /:$/.test(title) || Boolean(sep);
  // "**Unpaid orders** are cancelled…" reads as one sentence, so it isn't split.
  if (!titleEnds && /^[a-z]/.test(rest)) return { body: md };
  // The sentence after a split-off title starts with a capital.
  return { title: title.replace(/:$/, ''), body: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

function Callout({ token }: { token: Tokens.Blockquote }) {
  const text = token.text.trim();
  const { title, body } = lead(text);
  return (
    <aside className="flex gap-4 rounded-md border border-gold/50 bg-gold-pale/20 px-5 py-4 sm:px-6">
      <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-gold text-ivory">
        <Info className="size-5" strokeWidth={2} />
      </span>
      <div>
        <p className="font-semibold text-maroon">{title ?? 'Important'}</p>
        <Html html={inline(title ? body : text)} className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink-2 [&_a]:text-gold-deep [&_a]:underline" />
      </div>
    </aside>
  );
}

const rowText = 'text-[0.9375rem] leading-relaxed text-ink-2 [&_a]:font-medium [&_a]:text-maroon [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-ink';

function ListRows({ list }: { list: Tokens.List }) {
  const rows = list.items.map((it) => ({ ...lead(it.text), raw: it.text }));
  // Lists of short facts without bold leads read better as a plain list than as icon rows.
  if (list.ordered || rows.every((r) => !r.title && !/^\*\*/.test(r.raw))) {
    return (
      <ul className={cn('space-y-2.5', rowText)}>
        {list.items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-gold" />
            <Html html={inline(it.text)} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-5 py-4 first:pt-1">
          <IconCircle icon={iconFor(r.title ?? r.raw)} />
          <div className="min-w-0">
            {r.title && <p className="font-semibold text-ink">{r.title}</p>}
            <Html html={inline(r.body)} className={cn(rowText, r.title && 'mt-0.5')} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const headingCls = 'font-display text-[clamp(1.75rem,1.4rem+1vw,2.125rem)] font-semibold leading-tight text-maroon';
const prose = 'prose-store !text-[0.9375rem] [&_h3]:!text-base';

function Section({ heading, blocks }: { heading?: Tokens.Heading; blocks: Token[] }) {
  const listAt = blocks.findIndex((t) => t.type === 'list');
  const text = (blocks.find((t) => t.type === 'paragraph') as Tokens.Paragraph | undefined)?.text ?? '';
  const id = heading ? `p-${heading.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined;

  if (listAt >= 0) {
    const before = blocks.slice(0, listAt);
    const after = blocks.slice(listAt + 1);
    return (
      <section aria-labelledby={id} className="space-y-3">
        {heading && (
          <h2 id={id} className={headingCls}>
            {heading.text}
          </h2>
        )}
        {before.length > 0 && <Html html={block(before)} className={prose} />}
        <ListRows list={blocks[listAt] as Tokens.List} />
        {after.length > 0 && <Html html={block(after)} className={prose} />}
      </section>
    );
  }
  if (!heading) return blocks.length ? <Html html={block(blocks)} className={prose} /> : null;
  return (
    // Phones: the icon sits above the heading, so every heading starts at the same edge as the list sections
    // and the text gets the full width; beside it from sm.
    <section aria-labelledby={id} className="flex flex-col gap-3 sm:flex-row sm:gap-5">
      <IconCircle icon={sectionIcon(heading.text, text)} />
      <div className="min-w-0 sm:pt-2">
        <h2 id={id} className={headingCls}>
          {heading.text}
        </h2>
        <Html html={block(blocks)} className={cn(prose, 'mt-2')} />
      </div>
    </section>
  );
}

/**
 * Renders an admin-written policy (Markdown) in the store's policy layout: a quoted note becomes a
 * callout, each "##" heading starts a section, bullet points with a **bold lead** become icon rows,
 * and anything else falls back to ordinary formatted text. Output is sanitised.
 */
export function PolicyBody({ source }: { source: string }) {
  const parts = useMemo(() => {
    const out: { callouts: Tokens.Blockquote[]; sections: { heading?: Tokens.Heading; blocks: Token[] }[] } = { callouts: [], sections: [{ blocks: [] }] };
    for (const t of marked.lexer(source ?? '')) {
      if (t.type === 'space') continue;
      const current = out.sections[out.sections.length - 1];
      if (t.type === 'blockquote' && out.sections.length === 1 && !current.heading) out.callouts.push(t as Tokens.Blockquote);
      else if (t.type === 'heading' && (t as Tokens.Heading).depth <= 2) out.sections.push({ heading: t as Tokens.Heading, blocks: [] });
      else current.blocks.push(t);
    }
    return out;
  }, [source]);

  return (
    <div className="space-y-9">
      {parts.callouts.map((c, i) => (
        <Callout key={i} token={c} />
      ))}
      {parts.sections.map((s, i) => (
        <Section key={i} heading={s.heading} blocks={s.blocks} />
      ))}
    </div>
  );
}
