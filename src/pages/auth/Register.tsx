import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { registerSchema, type RegisterInput } from '@goldshop/shared';
import { Seo } from '../../components/Seo';
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { Checkbox, Field, FormError, IconInput, PasswordInput } from '../../components/ui/Form';
import { api, errorMessage } from '../../lib/api';
import { useAfterSignIn } from '../../lib/hooks';
import { cn, safeNext } from '../../lib/utils';
import { AuthShell, authLink, authSubmit } from './AuthShell';

export default function Register() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const afterSignIn = useAfterSignIn();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', marketingConsent: false },
  });
  const errs = form.formState.errors;

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await api('/auth/register', { body: v });
      await afterSignIn();
      navigate(safeNext(sp.get('next')), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell
      title="Create an account"
      subtitle="Track orders, save addresses and keep a wishlist."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={cn(authLink, 'inline-flex items-center gap-2')}>
            Sign in <ArrowRight className="size-4" aria-hidden />
          </Link>
        </>
      }
    >
      <Seo title="Create an account" noindex />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError>{error}</FormError>
        <Field label="Full name" error={errs.name?.message}>
          <IconInput icon={UserRound} autoComplete="name" placeholder="Enter your full name" {...form.register('name')} />
        </Field>
        <Field label="Email" error={errs.email?.message}>
          <IconInput icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="Enter your email address" {...form.register('email')} />
        </Field>
        <Field label="Mobile number" optional error={errs.phone?.message}>
          <IconInput icon={Phone} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="10-digit mobile number" {...form.register('phone')} />
        </Field>
        <Field label="Password" error={errs.password?.message} hint="At least 8 characters.">
          <PasswordInput icon={LockKeyhole} autoComplete="new-password" placeholder="Choose a password" {...form.register('password')} />
        </Field>
        <Checkbox label="Email me about new arrivals and offers" description="Optional — you can change this any time." {...form.register('marketingConsent')} />
        <button type="submit" disabled={form.formState.isSubmitting} className={authSubmit}>
          {form.formState.isSubmitting ? 'Creating…' : 'Create account'} <ArrowRight className="size-5 text-gold-soft" aria-hidden />
        </button>
        <p className="text-center text-xs text-muted">
          By creating an account you agree to our <Link to="/policies/terms" className="underline">terms</Link> and{' '}
          <Link to="/policies/privacy-policy" className="underline">privacy policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
