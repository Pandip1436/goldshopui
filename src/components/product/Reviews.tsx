import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { reviewSchema, type ReviewInput, type ReviewsResponse } from '@goldshop/shared';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Field, FormError, Input, Textarea } from '../ui/Form';
import { Alert, Stars } from '../ui/misc';

export function Reviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['reviews', slug, page],
    queryFn: () => api<ReviewsResponse>(`/products/${slug}/reviews`, { query: { page } }),
    staleTime: 60_000,
  });
  const [writing, setWriting] = useState(false);
  const [thanks, setThanks] = useState<string | null>(null);

  if (!data) return null;
  // Reviews come only from verified purchases; with none yet, the section stays out of the way.
  if (data.ratingCount === 0 && !data.canReview && !thanks) return null;

  return (
    <section aria-labelledby="reviews-title" className="border-t border-line pt-12">
      <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
        <div>
          <h2 id="reviews-title" className="display-sm">
            Customer reviews
          </h2>
          {data.ratingCount > 0 ? (
            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-semibold">{data.ratingAvg.toFixed(1)}</span>
                <Stars value={data.ratingAvg} size={16} />
              </div>
              <p className="mt-1 text-sm text-muted">From {data.ratingCount} verified {data.ratingCount === 1 ? 'purchase' : 'purchases'}</p>
              <dl className="mt-5 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((r) => (
                  <div key={r} className="flex items-center gap-3 text-xs">
                    <dt className="w-8 text-muted">{r} ★</dt>
                    <dd className="h-1.5 flex-1 bg-sand">
                      <div className="h-full bg-gold" style={{ width: `${data.ratingCount ? (data.distribution[r] / data.ratingCount) * 100 : 0}%` }} />
                    </dd>
                    <span className="w-6 text-right tabular text-muted">{data.distribution[r]}</span>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No reviews yet.</p>
          )}
          {data.canReview && !writing && !thanks && (
            <Button variant="secondary" size="sm" className="mt-6" onClick={() => setWriting(true)}>
              Write a review
            </Button>
          )}
        </div>
        <div>
          {thanks && <Alert tone="success" className="mb-6">{thanks}</Alert>}
          {writing && (
            <ReviewForm
              slug={slug}
              onDone={(msg) => {
                setWriting(false);
                setThanks(msg);
                qc.invalidateQueries({ queryKey: ['reviews', slug] });
              }}
            />
          )}
          <ul className="divide-y divide-line">
            {data.items.map((r) => (
              <li key={r.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} size={13} />
                  {r.title && <p className="font-semibold">{r.title}</p>}
                </div>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{r.body}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                  {r.authorName} · {formatDate(r.createdAt)}
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="size-3.5" /> Verified purchase
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="mt-4 flex gap-3">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Newer
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Older
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ slug, onDone }: { slug: string; onDone: (msg: string) => void }) {
  const [rating, setRating] = useState(5);
  const form = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5, title: '', body: '' } });
  const submit = useMutation({
    mutationFn: (v: ReviewInput) => api<{ message: string }>(`/products/${slug}/reviews`, { body: { ...v, rating } }),
    onSuccess: (r) => onDone(r.message),
  });
  return (
    <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="mb-10 space-y-4 border border-line bg-paper p-5">
      <fieldset>
        <legend className="text-[0.8125rem] font-semibold text-ink-2">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-pressed={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="text-2xl text-gold">
              {n <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Title" optional>
        <Input {...form.register('title')} maxLength={100} />
      </Field>
      <Field label="Your review" error={form.formState.errors.body?.message}>
        <Textarea {...form.register('body')} rows={4} />
      </Field>
      <FormError>{submit.isError ? errorMessage(submit.error) : null}</FormError>
      <Button type="submit" loading={submit.isPending}>
        Submit review
      </Button>
    </form>
  );
}
