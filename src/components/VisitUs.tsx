import { ArrowRight, Clock, MapPin, PhoneCall } from 'lucide-react';
import { Link } from 'react-router';
import { formatIndianMobile, type PublicSettings } from '@goldshop/shared';
import { LotusMark } from './AboutLegacy';
import { Img } from './ui/misc';

/** "Visit us": the store's address, phone and hours with directions, beside a photograph. */
export function VisitUs({ settings: s }: { settings: PublicSettings }) {
  const a = s.store.address;
  if (!a) return null;
  const address = [a.line1, a.line2, a.city].filter(Boolean).join(', ');
  const directions = s.store.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${a.state} ${a.pincode}`)}`;
  const image = s.visitSection.image;
  const circle = 'grid size-14 shrink-0 place-items-center rounded-full bg-gold-pale/60 text-gold-deep';

  return (
    <section className="container-page py-16 md:py-24" aria-labelledby="visit-title">
      <div className="relative grid overflow-hidden border border-gold/70 bg-paper lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.1fr)]">
        <LotusMark className="pointer-events-none absolute -bottom-10 -left-10 w-56 text-gold opacity-[0.1]" />
        {image && (
          <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[24%] [mask-image:linear-gradient(to_right,transparent,black_40%)] xl:block">
            <Img image={image} sizes="34vw" width={960} className="size-full object-cover" />
          </div>
        )}

        <div className="relative px-6 py-10 sm:px-10 lg:py-12 lg:pl-14">
          <span aria-hidden className="flex w-56 items-center gap-2 text-gold">
            <span className="h-px flex-1 bg-gold/60" />
            <LotusMark className="w-8" />
            <span className="h-px flex-1 bg-gold/60" />
          </span>
          <p className="mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">Visit us</p>
          <h2 id="visit-title" className="mt-3 font-display text-[clamp(2.5rem,1.8rem+2.4vw,4rem)] font-semibold leading-[1.02] text-maroon">
            See the pieces
            <em className="block font-semibold italic text-gold-deep">in person</em>
          </h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-ink-2">Try pieces on, check weights on our scale, and ask anything about purity and pricing.</p>
        </div>

        <span aria-hidden className="relative hidden items-center lg:flex">
          <span className="h-3/5 w-px bg-gold/50" />
          <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold bg-paper" />
        </span>

        <div className="relative flex flex-col justify-center gap-5 px-6 pb-10 sm:px-10 lg:py-12 lg:pl-12 xl:pr-[26%]">
          <p className="flex items-center gap-4 text-[1.0625rem] leading-snug text-ink">
            <span className={circle}>
              <MapPin className="size-6" strokeWidth={1.5} aria-hidden />
            </span>
            <span>
              {address},
              <br />
              {a.state} {a.pincode}
            </span>
          </p>
          {s.store.phone && (
            <p className="flex items-center gap-4 text-[1.0625rem] text-ink">
              <span className={circle}>
                <PhoneCall className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <a href={`tel:${s.store.phone.replace(/\s/g, '')}`} className="hover:text-gold-deep">
                {formatIndianMobile(s.store.phone)}
              </a>
            </p>
          )}
          {s.store.hours && (
            <p className="flex items-center gap-4 text-[1.0625rem] text-ink">
              <span className={circle}>
                <Clock className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <span>
                {s.store.hours.split(/\n|;\s*/).filter(Boolean).map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
              </span>
            </p>
          )}
          <div className="cta-row mt-2">
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-14 items-center gap-3 rounded-sm bg-gradient-to-b from-maroon-2 to-maroon px-7 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110"
            >
              Get directions <ArrowRight className="size-4 text-gold-soft" aria-hidden />
            </a>
            <Link to="/contact" className="inline-flex h-14 items-center rounded-sm border border-maroon/70 bg-paper px-7 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-maroon transition-colors hover:bg-maroon hover:text-ivory">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
