import { useMutation } from '@tanstack/react-query';
import { ArrowRight, IndianRupee, List, Mail, MessageSquareText, PencilLine, Phone, Send, User, type LucideIcon } from 'lucide-react';
import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { ENQUIRY_TOPIC_LABELS, ENQUIRY_TOPICS, type EnquiryType } from '@goldshop/shared';
import { ApiError, api, errorMessage } from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Dropdown } from './ui/Dropdown';
import { Checkbox, Field, FormError, Input, Textarea } from './ui/Form';
import { Alert } from './ui/misc';

const iconCls = 'pointer-events-none absolute left-3.5 size-4 text-subtle';

/* Controls with an optional leading icon. Field passes its id and aria props straight through. */
function IconInput({ icon: Icon, prefix, className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & { icon?: LucideIcon; prefix?: string }) {
  if (prefix) {
    return (
      <div className="flex">
        <span aria-hidden className="grid shrink-0 place-items-center rounded-l-md border border-r-0 border-line-strong/70 bg-sand/50 px-3.5 text-[0.9375rem] text-ink-2">
          {prefix}
        </span>
        <Input className={cn('!rounded-l-none', className)} {...rest} />
      </div>
    );
  }
  if (!Icon) return <Input className={className} {...rest} />;
  return (
    <div className="relative">
      <Icon aria-hidden className={cn(iconCls, 'top-1/2 -translate-y-1/2')} strokeWidth={1.6} />
      <Input className={cn('!pl-10', className)} {...rest} />
    </div>
  );
}

const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
];

function IconTextarea({ icon: Icon, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { icon?: LucideIcon }) {
  if (!Icon) return <Textarea className={className} {...rest} />;
  return (
    <div className="relative">
      <Icon aria-hidden className={cn(iconCls, 'top-3.5')} strokeWidth={1.6} />
      <Textarea className={cn('!pl-10', className)} {...rest} />
    </div>
  );
}

/**
 * Shared lead/enquiry form. A hidden honeypot field filters out simple bots.
 * `boxed` adds placeholders and a full-width button for use inside a card; `icons` draws icons inside
 * the fields. The contact page uses a topic list, a +91 prefix and a message counter instead.
 */
export function EnquiryForm({
  type,
  submitLabel = 'Send message',
  messageLabel = 'Message',
  withAmount,
  intro,
  boxed,
  icons = boxed,
  withTopic,
  askContactMethod = true,
  messageMax,
  submitTone = 'gold',
  defaultMessage = '',
  sideBySide,
}: {
  type: EnquiryType;
  submitLabel?: string;
  messageLabel?: string;
  withAmount?: boolean;
  intro?: ReactNode;
  boxed?: boolean;
  icons?: boolean;
  withTopic?: boolean;
  /** "How should we reach you?" — left out where the form promises a call-back anyway. */
  askContactMethod?: boolean;
  messageMax?: number;
  submitTone?: 'gold' | 'maroon';
  /** Starts the message with this text, e.g. the plan a shopper asked about. */
  defaultMessage?: string;
  /** Name beside phone and email on its own row, with "Subject" for the topic — the contact page's layout. */
  sideBySide?: boolean;
}) {
  const [v, setV] = useState({ name: '', phone: '', email: '', message: defaultMessage, topic: '', preferredContact: 'phone', monthlyAmount: '', consent: false, website: '' });
  const send = useMutation({
    mutationFn: () =>
      api<{ message: string }>('/enquiries', {
        body: {
          type,
          name: v.name,
          phone: v.phone,
          email: v.email,
          message: v.message,
          topic: withTopic && v.topic ? v.topic : undefined,
          preferredContact: v.preferredContact,
          monthlyAmount: withAmount && v.monthlyAmount ? Number(v.monthlyAmount) * 100 : undefined,
          consent: v.consent,
          website: v.website,
        },
      }),
  });
  const fields = send.error instanceof ApiError ? send.error.fields ?? {} : {};
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  // Call-backs and contact messages are answered by phone; other enquiries by phone or email.
  const phoneRequired = type === 'savings_plan' || type === 'contact';
  const messageOptional = type === 'savings_plan';
  const ic = (icon: LucideIcon) => (icons ? icon : undefined);
  const prefix = boxed && !icons;
  const box = boxed ? '!rounded-md bg-white' : undefined;
  const ph = (text: string) => (boxed ? text : undefined);

  if (send.isSuccess) return <Alert tone="success">{send.data.message}</Alert>;

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
      noValidate
    >
      {intro && <div className="sm:col-span-2">{intro}</div>}
      <Field label="Your name" required={boxed} error={fields.name} className={sideBySide ? undefined : 'sm:col-span-2'}>
        <IconInput icon={ic(User)} className={box} placeholder={ph('Enter your name')} value={v.name} onChange={set('name')} autoComplete="name" required aria-required />
      </Field>
      <Field label={sideBySide ? 'Phone number' : 'Mobile number'} required={boxed && phoneRequired} error={fields.phone}>
        <IconInput
          icon={ic(Phone)}
          prefix={prefix ? '+91' : undefined}
          className={box}
          placeholder={ph(prefix ? 'Enter mobile number' : '10-digit number')}
          value={v.phone}
          onChange={set('phone')}
          inputMode="tel"
          autoComplete="tel-national"
          aria-required={phoneRequired || undefined}
        />
      </Field>
      <Field
        label={prefix ? <>Email <span className="font-normal text-subtle">(Optional)</span></> : sideBySide ? 'Email address' : 'Email'}
        optional={!boxed || sideBySide}
        error={fields.email}
        className={sideBySide ? 'sm:col-span-2' : undefined}
      >
        <IconInput icon={ic(Mail)} className={box} placeholder={ph(prefix ? 'Enter your email' : sideBySide ? 'Enter your email address' : 'Optional')} value={v.email} onChange={set('email')} type="email" autoComplete="email" />
      </Field>
      {withAmount && (
        <Field label="Monthly savings you’d like to make (₹)" optional={!boxed} className="sm:col-span-2">
          <IconInput
            icon={ic(IndianRupee)}
            className={box}
            value={v.monthlyAmount}
            onChange={(e) => setV((s) => ({ ...s, monthlyAmount: e.target.value.replace(/\D/g, '').slice(0, 7) }))}
            inputMode="numeric"
            placeholder="e.g. 2000"
          />
        </Field>
      )}
      {withTopic && (
        <Field label={sideBySide ? 'Subject' : 'How can we help you?'} required={boxed} error={fields.topic} className="sm:col-span-2">
          <Dropdown
            icon={ic(List)}
            className={box}
            required
            value={v.topic}
            onChange={(topic) => setV((s) => ({ ...s, topic }))}
            placeholder={sideBySide ? 'Select a subject' : 'Select a topic'}
            options={ENQUIRY_TOPICS.map((t) => ({ value: t, label: ENQUIRY_TOPIC_LABELS[t] }))}
          />
        </Field>
      )}
      {askContactMethod && (
        <Field label="How should we reach you?" error={fields.preferredContact} className="sm:col-span-2">
          <Dropdown
            icon={ic(Phone)}
            className={box}
            value={v.preferredContact}
            onChange={(preferredContact) => setV((s) => ({ ...s, preferredContact }))}
            options={CONTACT_METHODS}
          />
        </Field>
      )}
      <Field
        label={boxed && messageOptional ? `${messageLabel} (Optional)` : messageLabel}
        optional={!boxed && messageOptional}
        required={boxed && !messageOptional}
        error={fields.message}
        className="sm:col-span-2"
      >
        <IconTextarea
          icon={ic(type === 'contact' ? MessageSquareText : PencilLine)}
          className={box}
          placeholder={ph(type === 'savings_plan' ? 'e.g. jewellery type, occasion, preferred plan…' : prefix || sideBySide ? 'Type your message here…' : 'How can we help?')}
          value={v.message}
          onChange={set('message')}
          maxLength={messageMax}
          aria-required={!messageOptional || undefined}
          rows={boxed ? (prefix ? 4 : 3) : 4}
        />
      </Field>
      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
        </label>
      </div>
      {messageMax && (
        <p className="-mt-2 text-right text-xs text-subtle sm:col-span-2" aria-live="polite">
          {v.message.length}/{messageMax}
        </p>
      )}
      <Checkbox
        className="sm:col-span-2"
        label={type === 'contact' ? 'I agree to be contacted about my enquiry.' : 'I agree to be contacted about this enquiry.'}
        checked={v.consent}
        onChange={(e) => setV((s) => ({ ...s, consent: e.target.checked }))}
        required
      />
      {fields.consent && <p role="alert" className="-mt-2 text-xs font-medium text-danger sm:col-span-2">{fields.consent}</p>}
      <div className="sm:col-span-2">
        <FormError>{send.isError && !Object.keys(fields).length ? errorMessage(send.error) : null}</FormError>
      </div>
      <div className="sm:col-span-2">
        {boxed && submitTone === 'maroon' ? (
          <Button
            type="submit"
            size="lg"
            block
            loading={send.isPending}
            disabled={!v.consent}
            className="!h-14 !rounded-md bg-gradient-to-b from-maroon-2 to-maroon !text-[0.8125rem] text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_12px_26px_-14px_rgba(63,18,21,.9)] hover:brightness-110"
          >
            <span className="inline-flex items-center gap-3">
              <Send className="size-4.5" strokeWidth={1.6} aria-hidden />
              {submitLabel} <ArrowRight className="size-4" aria-hidden />
            </span>
          </Button>
        ) : boxed ? (
          <Button
            type="submit"
            variant="gold"
            size="lg"
            block
            loading={send.isPending}
            disabled={!v.consent}
            className="!rounded-md bg-gradient-to-b from-[#ecd08f] via-[#d9b872] to-[#c39a4a] text-maroon shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_10px_24px_-12px_rgba(122,87,22,.85)] hover:brightness-105"
          >
            <span className="inline-flex items-center gap-2.5">
              {submitLabel} <ArrowRight className="size-4" aria-hidden />
            </span>
          </Button>
        ) : (
          <Button type="submit" size="lg" loading={send.isPending} disabled={!v.consent}>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
