export const LOAN_STATUSES = [
  'Query',
  'ReadyLogin',
  'Hold',
  'LoginDone',
  'UnderProcess',
  'BankFinalized',
  'Sanctioned',
  'Disbursed',
  'Rejected',
  'Cancelled',
  'NotInterested',
];

export const PROFESSIONS = ['Salaried', 'Businessman', 'Professional'];

export const PRODUCTS = ['HL', 'LAP', 'BT', 'TOPUP', 'ML', 'CommercialPurchase', 'Other'];

export const PROPERTY_TYPES = [
  'Flat',
  'Bungalow',
  'Row House',
  'Plot',
  'Commercial Shop',
  'Commercial Office',
  'Industrial',
  'Agricultural Land',
  'Other',
];

export const DISBURSEMENT_TYPES = ['Full', 'Part'];

export const POST_DISBURSEMENT_STAGES = [
  { key: 'HandoverPending', label: 'Handover Pending' },
  { key: 'HandoverDone', label: 'Handover Done' },
  { key: 'BankConfirmationPending', label: 'Bank Confirmation Pending' },
  { key: 'BankConfirmationDone', label: 'Bank Confirmation Done' },
  { key: 'InvoicePrepared', label: 'Invoice Prepared' },
  { key: 'InvoicePending', label: 'Invoice Pending' },
  { key: 'PaymentReceived', label: 'Payment Received' },
  { key: 'PaymentPending', label: 'Payment Pending' },
];

export const FOLLOWUP_TYPES = ['FollowUp', 'Login', 'Disbursement'];

// Channel names (formerly IDC Channels).
export const CHANNEL_NAMES = [
  'Zatpat',
  'MMK',
  'Andromeda',
  'Urban Money',
  '4B Network',
  'Atul ICICI Ins',
  'Insurance',
];

// Color tokens for status (cell background, like Excel conditional formatting).
// Also used for full-row highlighting in the grid.
export const STATUS_COLORS = {
  Query:          { bg: '#e0e7ff', fg: '#3730a3', rowBg: '#eef2ff' },   // indigo
  ReadyLogin:     { bg: '#dbeafe', fg: '#1e40af', rowBg: '#eff6ff' },   // blue
  Hold:           { bg: '#fef3c7', fg: '#92400e', rowBg: '#fffbeb' },   // amber/yellow
  LoginDone:      { bg: '#cffafe', fg: '#0e7490', rowBg: '#ecfeff' },   // cyan
  UnderProcess:   { bg: '#fef9c3', fg: '#854d0e', rowBg: '#fefce8' },   // yellow
  BankFinalized:  { bg: '#bfdbfe', fg: '#1e3a8a', rowBg: '#dbeafe' },   // blue strong
  Sanctioned:     { bg: '#bbf7d0', fg: '#166534', rowBg: '#dcfce7' },   // green
  Disbursed:      { bg: '#86efac', fg: '#14532d', rowBg: '#d1fae5' },   // green strong
  Rejected:       { bg: '#fecaca', fg: '#991b1b', rowBg: '#fee2e2' },   // red
  Cancelled:      { bg: '#fca5a5', fg: '#7f1d1d', rowBg: '#fee2e2' },   // red
  NotInterested:  { bg: '#e5e7eb', fg: '#374151', rowBg: '#f3f4f6' },   // gray
};

// Tabs displayed at the bottom of the cases sheet (filter by channelName).
export const CASE_TABS = [
  { key: 'All', label: 'All Cases' },
  { key: 'Zatpat', label: 'Zatpat Direct' },
  { key: 'MMK', label: 'MMK Cases' },
  { key: 'Insurance', label: 'Insurance' },
  { key: '4B Network', label: '4B Network' },
  { key: 'Atul ICICI Ins', label: 'Atul ICICI Ins.' },
];
