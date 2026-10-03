import { ExpenseDocument, IncomeDocument } from '@/types/finance';

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

// Initial realistic 12-month Income Seed data
export const INITIAL_INCOMES: Record<string, IncomeDocument> = {
  '2026-01': { monthId: '2026-01', personalIncome: 32000, companyIncome: 45000 },
  '2026-02': { monthId: '2026-02', personalIncome: 32000, companyIncome: 46500 },
  '2026-03': { monthId: '2026-03', personalIncome: 34000, companyIncome: 48000 },
  '2026-04': { monthId: '2026-04', personalIncome: 32000, companyIncome: 44000 },
  '2026-05': { monthId: '2026-05', personalIncome: 35000, companyIncome: 51000 },
  '2026-06': { monthId: '2026-06', personalIncome: 33000, companyIncome: 47500 },
  '2026-07': { monthId: '2026-07', personalIncome: 35000, companyIncome: 53000 },
  '2026-08': { monthId: '2026-08', personalIncome: 36000, companyIncome: 52000 },
  '2026-09': { monthId: '2026-09', personalIncome: 35000, companyIncome: 49500 },
  '2026-10': { monthId: '2026-10', personalIncome: 38000, companyIncome: 56000 },
  '2026-11': { monthId: '2026-11', personalIncome: 37000, companyIncome: 54000 },
  '2026-12': { monthId: '2026-12', personalIncome: 42000, companyIncome: 62000 },
};
