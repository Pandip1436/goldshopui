import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { loginSchema, type LoginInput, type SessionUser } from '@goldshop/shared';
import { Seo } from '../../components/Seo';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Field, FormError, IconInput, PasswordInput } from '../../components/ui/Form';
import { api, errorMessage } from '../../lib/api';
import { useAfterSignIn } from '../../lib/hooks';
import { cn, safeNext } from '../../lib/utils';
import { AuthShell, authLink, authSubmit } from './AuthShell';

export default function Login() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const afterSignIn = useAfterSignIn();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const next = safeNext(sp.get('next'));

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const { user } = await api<{ user: SessionUser }>('/auth/login', { body: v });
      await afterSignIn();
      navigate(user.role !== 'customer' && next === '/account' ? '/admin' : next, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your orders, saved addresses and wishlist."
      footer={
        <>
          New here?{' '}
          <Link to={`/register${sp.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className={cn(authLink, 'inline-flex items-center gap-2')}>
            Create an account <ArrowRight className="size-4" aria-hidden />
          </Link>
        </>
      }
    >
      <Seo title="Sign in" noindex />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError>{error}</FormError>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <IconInput icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="Enter your email address" {...form.register('email')} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <PasswordInput icon={LockKeyhole} autoComplete="current-password" placeholder="Enter your password" {...form.register('password')} />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className={cn(authLink, 'text-sm font-medium')}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={form.formState.isSubmitting} className={authSubmit}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'} <ArrowRight className="size-5 text-gold-soft" aria-hidden />
        </button>
      </form>
    </AuthShell>
  );
}
