import { ExpenseDocument } from '@/types/finance';

export const INITIAL_EXPENSES: ExpenseDocument[] = [
  {
    id: 'exp_846719789_01',
    name: 'Telkom Mobile',
    reference: '501086026',
    scope: 'personal',
    dueDate: '2026-10-01',
    paymentMethod: 'Debit Order',
    monthlyDueConfig: {
      base: 1893.36,
      overrides: {
        '2026-11': 1950.0,
      },
      accumulated: {
        '2026-10': 450.0,
      },
    },
    monthlyDueDateConfig: {
      base: '2026-10-16',
      overrides: {
        '2026-12': '2026-12-10',
      },
    },
    payments: [
      {
        id: 'pay_1727827200',
        amount: 1000.0,
        date: '2026-10-05',
        reference: 'First EFT',
      },
      {
        id: 'pay_1727827299',
        amount: 893.36,
        date: '2026-10-16',
        reference: 'Final Settlement',
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
  {
    id: 'exp_846719789_02',
    name: 'AWS Cloud Hosting',
    reference: 'ACC-98214-CLOUD',
    scope: 'company',
    dueDate: '2026-10-03',
    paymentMethod: 'Card',
    monthlyDueConfig: {
      base: 3420.5,
      overrides: {},
      accumulated: {},
    },
    monthlyDueDateConfig: {
      base: '2026-10-03',
      overrides: {},
    },
    payments: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
  {
    id: 'exp_846719789_03',
    name: 'Discovery Health Medical Aid',
    reference: 'MED-442109',
    scope: 'personal',
    dueDate: '2026-10-07',
    paymentMethod: 'Debit Order',
    monthlyDueConfig: {
      base: 4150.0,
      overrides: {},
      accumulated: {},
    },
    monthlyDueDateConfig: {
      base: '2026-10-07',
      overrides: {},
    },
    payments: [
      {
        id: 'pay_1727827301',
        amount: 2000.0,
        date: '2026-10-02',
        reference: 'Part Pay EFT',
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
  {
    id: 'exp_846719789_04',
    name: 'Fibre Internet 500Mbps',
    reference: 'VOX-882190',
    scope: 'company',
    dueDate: '2026-10-10',
    paymentMethod: 'EFT',
    monthlyDueConfig: {
      base: 1299.0,
      overrides: {},
      accumulated: {},
    },
    monthlyDueDateConfig: {
      base: '2026-10-10',
      overrides: {},
    },
    payments: [
      {
        id: 'pay_1727827302',
        amount: 1299.0,
        date: '2026-10-01',
        reference: 'Full EFT',
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
  {
    id: 'exp_846719789_05',
    name: 'Commercial Office Rent',
    reference: 'PROP-JHB-402',
    scope: 'company',
    dueDate: '2026-10-01',
    paymentMethod: 'EFT',
    monthlyDueConfig: {
      base: 15500.0,
      overrides: {},
      accumulated: {},
    },
    monthlyDueDateConfig: {
      base: '2026-10-01',
      overrides: {},
    },
    payments: [
      {
        id: 'pay_1727827303',
        amount: 15500.0,
        date: '2026-09-30',
        reference: 'Rent Transfer',
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
  {
    id: 'exp_846719789_06',
    name: 'Vehicle Comprehensive Insurance',
    reference: 'OUT-991204',
    scope: 'personal',
    dueDate: '2026-10-25',
    paymentMethod: 'Debit Order',
    monthlyDueConfig: {
      base: 1680.0,
      overrides: {},
      accumulated: {},
    },
    monthlyDueDateConfig: {
      base: '2026-10-25',
      overrides: {},
    },
    payments: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T22:54:32Z',
  },
];
