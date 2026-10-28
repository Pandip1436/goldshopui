import { Gem } from 'lucide-react';
import type { ReactNode } from 'react';

/* Line drawings for jewellery categories, matched on the category's slug. */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const CATEGORY_GLYPHS: [RegExp, ReactNode][] = [
  [/earring|jhumka|stud/, <><path d="M8 3v3M16 3v3" /><circle cx="8" cy="9" r="2" /><circle cx="16" cy="9" r="2" /><path d="M5 18c0-3 1.3-5 3-6 1.7 1 3 3 3 6zM13 18c0-3 1.3-5 3-6 1.7 1 3 3 3 6z" /><path d="M6 20.5h4M14 20.5h4" /></>],
  [/necklace|chain|pendant|haram|mangal/, <><path d="M4 4c0 7 3.6 11 8 11s8-4 8-11" /><path d="M12 15v1.5" /><path d="M12 16.5l-2.2 2.7L12 22l2.2-2.8z" /></>],
  [/bangle|bracelet|kada/, <><ellipse cx="12" cy="10" rx="9" ry="4.5" /><path d="M3 10v3.5c0 2.5 4 4.5 9 4.5s9-2 9-4.5V10" /></>],
  [/ring/, <><circle cx="12" cy="15" r="6" /><path d="M9.5 9.5 12 5l2.5 4.5" /><path d="M10 5h4" /></>],
  [/coin|bar|bullion/, <><ellipse cx="9" cy="16" rx="6" ry="2.5" /><path d="M3 16v2.5C3 20 5.7 21 9 21s6-1 6-2.5V16" /><path d="M13 5h7l1.5 6H11.5z" /></>],
];
export function CategoryGlyph({ slug, className }: { slug: string; className?: string }) {
  const hit = CATEGORY_GLYPHS.find(([rx]) => rx.test(slug));
  if (!hit) return <Gem className={className} strokeWidth={1.4} aria-hidden />;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      {hit[1]}
    </svg>
  );
}

