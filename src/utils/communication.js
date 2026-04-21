// Communication shortcuts: WhatsApp / SMS / Email deep links + message templates.
// Templates use {placeholder} substitution against a loan-case object.

import { formatINR, formatDate } from './format.js';

export const MESSAGE_TEMPLATES = [
  {
    key: 'doc_request',
    label: 'Document request',
    body:
      'Hi {customerName}, this is {senderName} from ZatpatLoans. ' +
      'To proceed with your {product} application at {bankName}, please share the pending KYC documents at your earliest. Thank you!',
    channels: ['whatsapp', 'sms', 'email'],
  },
  {
    key: 'login_done',
    label: 'Login done',
    body:
      'Hi {customerName}, your loan file with {bankName} has been logged in successfully on {loginDate}. ' +
      'We will keep you updated as the bank reviews your application. — ZatpatLoans',
    channels: ['whatsapp', 'sms'],
  },
  {
    key: 'sanction',
    label: 'Sanctioned 🎉',
    body:
      '🎉 Congratulations {customerName}! Your loan from {bankName} has been sanctioned for {sanctionedAmount}. ' +
      'Disbursement will be processed shortly. — Team ZatpatLoans',
    channels: ['whatsapp', 'sms'],
  },
  {
    key: 'disbursed',
    label: 'Disbursed',
    body:
      'Hi {customerName}, your loan of {disbursedAmount} from {bankName} has been disbursed on {disbursementDate}. ' +
      'Thank you for choosing ZatpatLoans. We wish you the very best!',
    channels: ['whatsapp', 'sms', 'email'],
  },
  {
    key: 'follow_up',
    label: 'Follow-up reminder',
    body:
      'Hi {customerName}, gentle reminder regarding your {product} application at {bankName}. ' +
      'Please let me know a convenient time to discuss the next steps. — {senderName}, ZatpatLoans',
    channels: ['whatsapp', 'sms'],
  },
  {
    key: 'payment_reminder',
    label: 'Payment reminder',
    body:
      'Hi {customerName}, this is a friendly reminder regarding the pending consulting fee of {pendingPaymentAmount} ' +
      'for your loan with {bankName}. Kindly arrange the payment at your earliest. Thank you. — ZatpatLoans',
    channels: ['whatsapp', 'sms', 'email'],
  },
];

// Build a placeholder context from a case object + sender.
export function buildContext(loanCase, sender) {
  return {
    customerName: loanCase.customerName || 'Customer',
    phone: loanCase.phone || '',
    product: loanCase.product || 'loan',
    bankName: loanCase.bankName || 'the bank',
    loanAmount: formatINR(loanCase.loanAmount),
    sanctionedAmount: formatINR(loanCase.sanctionedAmount),
    disbursedAmount: formatINR(loanCase.disbursedAmount),
    pendingPaymentAmount: formatINR(loanCase.pendingPaymentAmount),
    loginDate: formatDate(loanCase.loginDate) || 'today',
    sanctionDate: formatDate(loanCase.sanctionDate) || 'today',
    disbursementDate: formatDate(loanCase.disbursementDate) || 'today',
    senderName: sender?.name || 'ZatpatLoans',
  };
}

export function renderTemplate(body, ctx) {
  return body.replace(/\{(\w+)\}/g, (_, k) =>
    ctx[k] != null && ctx[k] !== '' ? String(ctx[k]) : `{${k}}`
  );
}

// Strip non-digits and prefix India country code if missing. WhatsApp expects E.164 sans +.
function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export function whatsappLink(phone, message) {
  const num = normalizePhone(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function smsLink(phone, message) {
  const digits = (phone || '').replace(/\D/g, '');
  // iOS uses ?body=, Android historically used ?body= too but some prefer ;body=.
  return `sms:${digits}?body=${encodeURIComponent(message)}`;
}

export function emailLink(email, subject, body) {
  return `mailto:${email || ''}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
