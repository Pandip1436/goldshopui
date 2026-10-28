import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Seo } from '../../components/Seo';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Input } from '../../components/ui/Form';
import { Alert } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { AuthShell } from './AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const send = useMutation({ mutationFn: () => api<{ message: string }>('/auth/forgot-password', { body: { email } }) });
  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new one." footer={<Link to="/login" className="underline underline-offset-4">Back to sign in</Link>}>
      <Seo title="Reset password" noindex />
      {send.isSuccess ? (
        <Alert tone="success">{send.data.message}</Alert>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <FormError>{send.isError ? errorMessage(send.error) : null}</FormError>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <Button type="submit" block size="lg" loading={send.isPending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
