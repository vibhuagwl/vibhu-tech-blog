export type CornerDisposition =
  | 'RETRY'
  | 'DLQ_NOW'
  | 'DLQ_AFTER_CAP'
  | 'IGNORE'
  | 'PARK'
  | 'CONFLICT';

export type CornerFamily =
  | 'Poison'
  | 'Transient'
  | 'Business'
  | 'Ordering'
  | 'Idempotency'
  | 'Replay'
  | 'Consumer'
  | 'Neptune'
  | 'Security';

export type DlqCornerCase = {
  id: string;
  family: CornerFamily;
  title: string;
  whatHappens: string;
  symptom: string;
  classify: CornerDisposition;
  retry: string;
  dlq: string;
  holdCashLine: boolean;
  idempotency: string;
  detection: string;
  recovery: string;
  fallback: string;
  alert: string;
  lab?: string;
  mermaid: string;
  code: string;
  interview: string;
  trap: string;
};

export const CORNER_FAMILIES: CornerFamily[] = [
  'Poison',
  'Transient',
  'Business',
  'Ordering',
  'Idempotency',
  'Replay',
  'Consumer',
  'Neptune',
  'Security',
];
