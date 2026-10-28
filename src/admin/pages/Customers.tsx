import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MapPin, Receipt, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router';
import { formatIndianMobile, type OrderSummaryDTO, type SavedAddressDTO } from '@goldshop/shared';
import { Skeleton } from '../../components/ui/misc';
import { api } from '../../lib/api';
import { formatDate, formatDateTime, inr } from '../../lib/utils';
import { AdminSelect, Badge, Card, DataTable, OrderStatusBadge, PageHeader, Pager, SearchField } from '../ui';

interface Row {
  id: string;
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastLoginAt?: string;
  marketingConsent?: { email?: boolean };
}

export default function Customers() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path=":id" element={<Detail />} />
    </Routes>
  );
}

function List() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', query, sort, page],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number }>('/admin/customers', { query: { q: query, sort, page } }),
    placeholderData: keepPreviousData,
  });
  return (
    <div>
      <PageHeader title="Customers" description="Registered accounts. Guest orders are found in Orders by email or mobile." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchField className="min-w-0 flex-[1_1_16rem]" value={q} onChange={setQ} onSubmit={() => { setQuery(q); setPage(1); }} placeholder="Name, email or mobile" label="Search customers" />
        <AdminSelect
          className="w-full sm:w-48"
          value={sort}
          onChange={(v) => { setSort(v); setPage(1); }}
          aria-label="Sort"
          options={[
            { value: '', label: 'Newest first' },
            { value: 'spent', label: 'Highest spend' },
          ]}
        />
      </div>
      <DataTable
        rows={data?.items}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/admin/customers/${r.id}`)}
        columns={[
          { key: 'n', header: 'Customer', cell: (r) => <span><span className="font-semibold text-ink">{r.name}</span><span className="block text-xs text-muted">{r.email}</span></span> },
          { key: 'p', header: 'Mobile', cell: (r) => (r.phone ? formatIndianMobile(r.phone) : '—') },
          { key: 'o', header: 'Orders', cell: (r) => r.orderCount },
          { key: 's', header: 'Spent', cell: (r) => <span className="font-medium text-ink tabular">{inr(r.totalSpent)}</span> },
          { key: 'm', header: 'Emails', cell: (r) => (r.marketingConsent?.email ? <Badge tone="success">Opted in</Badge> : <span className="text-xs text-muted">No</span>) },
          { key: 'j', header: 'Joined', cell: (r) => <span className="text-xs text-muted">{formatDate(r.createdAt)}</span> },
        ]}
      />
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery({
    queryKey: ['admin', 'customer', id],
    queryFn: () => api<Row & { addresses: (SavedAddressDTO & { _id: string })[]; orders: OrderSummaryDTO[] }>(`/admin/customers/${id}`),
  });
  if (isLoading || !c) return <Skeleton className="h-64 w-full rounded-2xl" />;
  return (
    <div>
      <PageHeader back={{ to: '/admin/customers', label: 'Customers' }} title={c.name} description={`${c.email}${c.phone ? ` · ${formatIndianMobile(c.phone)}` : ''} · joined ${formatDate(c.createdAt)}${c.lastLoginAt ? ` · last seen ${formatDateTime(c.lastLoginAt)}` : ''}`} />
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <Card icon={Receipt} title={`Orders (${c.orders.length})`} padded={false} className="xl:col-span-2">
          <div className="px-5 pb-4">
          <DataTable
            bare
            minWidth="28rem"
            rows={c.orders}
            rowKey={(o) => o.orderNumber}
            onRowClick={(o) => navigate(`/admin/orders/${o.orderNumber}`)}
            empty="No orders yet."
            columns={[
              { key: 'n', header: 'Order', cell: (o) => <span className="font-semibold">{o.orderNumber}</span> },
              { key: 'd', header: 'Date', cell: (o) => formatDate(o.createdAt) },
              { key: 's', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
              { key: 't', header: 'Total', className: 'text-right', cell: (o) => <span className="font-medium text-ink tabular">{inr(o.total)}</span> },
            ]}
          />
          </div>
        </Card>
        <div className="space-y-5 lg:space-y-6">
          <Card icon={UserRound} title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Orders</dt><dd className="font-semibold text-ink">{c.orderCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Total spent</dt><dd className="font-semibold text-ink tabular">{inr(c.totalSpent)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Marketing emails</dt><dd>{c.marketingConsent?.email ? 'Opted in' : 'Not opted in'}</dd></div>
            </dl>
          </Card>
          <Card icon={MapPin} title="Saved addresses">
            {c.addresses.length === 0 ? <p className="text-sm text-muted">None saved.</p> : (
              <ul className="space-y-3 text-sm">
                {c.addresses.map((a) => (
                  <li key={a._id} className="border-b border-hairline pb-3 last:border-0">
                    <span className="font-semibold text-ink">{a.label}</span>{a.isDefault && <Badge tone="gold" className="ml-2">Default</Badge>}
                    <p className="text-muted">{a.fullName}, {a.line1}, {a.city}, {a.state} {a.pincode}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
