import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, UsersRound } from 'lucide-react';
import { Field } from '../../components/ui/Form';
import { api, errorMessage } from '../../lib/api';
import { useMe } from '../../lib/hooks';
import { formatDateTime } from '../../lib/utils';
import { AdminSelect, Alert, Badge, Button, Card, DataTable, FormError, Modal, PageHeader, Toggle, adminInput } from '../ui';

interface Row {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  lastLoginAt?: string;
}

export default function Staff() {
  const { user } = useMe();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'staff'], queryFn: () => api<Row[]>('/admin/staff') });
  const blank = { name: '', email: '', password: '', role: 'staff' };
  const [form, setForm] = useState(blank);
  const [adding, setAdding] = useState(false);
  const close = () => {
    setAdding(false);
    setForm(blank);
    add.reset();
  };
  const add = useMutation({
    mutationFn: () => api<{ promoted?: boolean }>('/admin/staff', { body: { ...form, password: form.password || undefined } }),
    onSuccess: (r) => {
      toast.success(r.promoted ? 'Existing account given access' : 'Staff account created');
      close();
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; role?: string; isActive?: boolean }) => api(`/admin/staff/${v.id}`, { method: 'PATCH', body: { role: v.role, isActive: v.isActive } }),
    onSuccess: () => {
      toast.success('Access updated');
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin users"
        description="Who can sign in to this admin, and what each person may change."
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            Add team member
          </Button>
        }
      />
      <Alert>
        <strong>Admin</strong> can do everything. <strong>Staff</strong> can manage products, stock, gold rates, orders, content, reviews and enquiries — but not settings, coupons, refunds, reports or staff. These limits are enforced by the server.
      </Alert>
      <Card
        icon={UsersRound}
        title="Team"
        padded={false}
        actions={
          <Button size="sm" variant="light" icon={<UserPlus className="size-3.5" />} onClick={() => setAdding(true)}>
            Add
          </Button>
        }
      >
      <div className="px-5 pb-4">
      <DataTable
        bare
        rows={data}
        loading={isLoading}
        rowKey={(r) => r.id}
        columns={[
          { key: 'n', header: 'Name', cell: (r) => <span><span className="font-semibold text-ink">{r.name}</span>{r.id === user?.id && <Badge className="ml-2">You</Badge>}<span className="block text-xs text-muted">{r.email}</span></span> },
          {
            key: 'r',
            header: 'Role',
            cell: (r) => (
              <AdminSelect
                className="w-44"
                value={r.role}
                disabled={r.id === user?.id}
                onChange={(v) => update.mutate({ id: r.id, role: v })}
                aria-label={`Role for ${r.name}`}
                options={[
                  { value: 'staff', label: 'Staff' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'customer', label: 'Remove access' },
                ]}
              />
            ),
          },
          { key: 'a', header: 'Active', cell: (r) => <Toggle checked={r.isActive} disabled={r.id === user?.id} label={`${r.name} active`} onChange={(v) => update.mutate({ id: r.id, isActive: v })} /> },
          { key: 'l', header: 'Last sign-in', cell: (r) => <span className="text-xs text-muted">{r.lastLoginAt ? formatDateTime(r.lastLoginAt) : 'Never'}</span> },
        ]}
      />
      </div>
      </Card>
      <Modal
        open={adding}
        onOpenChange={(o) => !o && close()}
        title="Add a team member"
        description="They sign in with this email. Admins can change everything; staff can’t change settings, coupons, refunds, reports or staff."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" form="add-member" icon={<UserPlus className="size-4" />} loading={add.isPending}>
              Give access
            </Button>
          </>
        }
      >
        <form
          id="add-member"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Field label="Name">
            <input className={adminInput} value={form.name} autoComplete="off" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={adminInput} type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Temporary password" hint="Not needed if they already have a customer account. Ask them to change it after signing in." optional>
            <input className={adminInput} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <AdminSelect
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={[
                { value: 'staff', label: 'Staff', hint: 'Products, stock, rates, orders, content' },
                { value: 'admin', label: 'Admin', hint: 'Everything, including settings and staff' },
              ]}
            />
          </Field>
          {add.isError && (
            <div className="sm:col-span-2">
              <FormError>{errorMessage(add.error)}</FormError>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
