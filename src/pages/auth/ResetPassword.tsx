import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Seo } from '../../components/Seo';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input } from '../../components/ui/Form';
import { api, errorMessage } from '../../lib/api';
import { useAfterSignIn } from '../../lib/hooks';
import { AuthShell } from './AuthShell';

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? '';
  const navigate = useNavigate();
  const afterSignIn = useAfterSignIn();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" footer={<Link to="/forgot-password" className="underline">Request a new link</Link>}>
        <p className="text-sm text-muted">This link is missing its security token. Please request a new one.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <Seo title="Choose a new password" noindex />
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (password.length < 8) return setError('Use at least 8 characters.');
          if (password !== confirm) return setError('The passwords don’t match.');
          setBusy(true);
          try {
            await api('/auth/reset-password', { body: { token, password } });
            await afterSignIn();
            navigate('/account', { replace: true });
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormError>{error}</FormError>
        <Field label="New password" hint="At least 8 characters.">
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" block size="lg" loading={busy}>
          Save and sign in
        </Button>
      </form>
    </AuthShell>
  );
}
