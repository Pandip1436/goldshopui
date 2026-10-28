import { useSettings } from '../lib/hooks';

/**
 * Per-page metadata. React 19 hoists these tags into <head>. In production the server also renders
 * them (plus structured data) for crawlers; the client removes those copies once it takes over.
 */
export function Seo({
  title,
  description,
  path,
  image,
  noindex,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}) {
  const { data: settings } = useSettings();
  const store = settings?.store.name ?? '';
  const full = title ? (store ? `${title} | ${store}` : title) : store ? `${store} · ${settings?.store.tagline ?? ''}` : '';
  const desc = description ?? settings?.store.description ?? '';
  const url = path ? `${window.location.origin}${path}` : undefined;
  return (
    <>
      {full && <title>{full}</title>}
      {desc && <meta name="description" content={desc} />}
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {full && <meta property="og:title" content={full} />}
      {desc && <meta property="og:description" content={desc} />}
      {image && <meta property="og:image" content={image.startsWith('http') ? image : `${window.location.origin}${image}`} />}
    </>
  );
}
