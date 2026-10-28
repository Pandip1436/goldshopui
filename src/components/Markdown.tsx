import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

marked.setOptions({ gfm: true, breaks: false });

/** Renders admin-authored Markdown. Output is always sanitised before it reaches the DOM. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(source ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true }, ADD_ATTR: ['target', 'rel'] });
  }, [source]);
  return <div className={cn('prose-store', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
