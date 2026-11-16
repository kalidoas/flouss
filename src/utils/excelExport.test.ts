import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import * as fflate from 'fflate';
import { exportToExcel } from './excelExport';
import { Category, IncomeSource, Transaction, DebtItem, SubscriptionItem, TaskItem, ProgramTrack, NoteItem } from '../types';

describe('Unified Excel Export', () => {
  const categories: Category[] = [
    { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#f00', isGoal: false, isArchived: false, createdAt: '2026-01-01' },
    { id: 'cat_goal', name: 'Emergency Fund', icon: 'Shield', color: '#0f0', isGoal: true, targetAmount: 20000, isArchived: false, createdAt: '2026-01-01' },
  ];

  const incomeSources: IncomeSource[] = [
    { id: 'src_salary', name: 'Salary', icon: 'Briefcase', color: '#00f', isDefault: true, createdAt: '2026-01-01' },
  ];

  const transactions: Transaction[] = [
    { id: 'tx_1', type: 'income', amount: 12000, date: '2026-11-01T10:00:00Z', sourceId: 'src_salary', createdAt: '2026-11-01T10:00:00Z' },
    { id: 'tx_2', type: 'expense', amount: 450, date: '2026-11-02T12:00:00Z', categoryId: 'cat_food', note: 'Supermarket', createdAt: '2026-11-02T12:00:00Z' },
    { id: 'tx_3', type: 'contribution', amount: 1000, date: '2026-11-03T15:00:00Z', categoryId: 'cat_goal', note: 'Monthly saving', createdAt: '2026-11-03T15:00:00Z' },
  ];

  const debts: DebtItem[] = [
    { id: 'debt_1', personName: 'Karim', type: 'lend', totalAmount: 500, paidAmount: 100, dueDate: '2026-12-01', createdAt: '2026-11-01', isSettled: false },
  ];

  const subscriptions: SubscriptionItem[] = [
    { id: 'sub_1', name: 'Spotify', amount: 49, billingDay: 10, nextDueDate: '2026-11-10', category: 'Music', paidMonths: ['2026-10'], createdAt: '2026-01-01' },
  ];

  const tasks: TaskItem[] = [
    { id: 'task_1', title: 'Daily Workout', category: 'sport', frequency: 'daily', completedDates: ['2026-11-01', '2026-11-02'], createdAt: '2026-01-01' },
  ];

  const programTracks: ProgramTrack[] = [
    { id: 'track_1', title: 'Language', icon: 'BookOpen', type: 'study', createdAt: '2026-01-01', subtasks: [{ id: 'sub_1', title: 'Spanish', completedDates: ['2026-11-01'], points: 15, createdAt: '2026-01-01' }] },
  ];

  const notes: NoteItem[] = [
    { id: 'note_1', title: 'Checklist', content: 'Items to buy', updatedAt: '2026-11-01', createdAt: '2026-01-01' },
  ];

  it('exports all 10 required sheets with numeric amount cells, SUM formulas, and scope labels', async () => {
    const buffer = await exportToExcel({
      initialBalance: 5000,
      transactions,
      categories,
      incomeSources,
      language: 'en',
      selectedPeriod: { from: '2026-11-01', to: '2026-11-30' },
      tasks,
      programTracks,
      debts,
      subscriptions,
      notes,
    });

    expect(buffer).toBeDefined();
    const wb = XLSX.read(buffer as Uint8Array);

    // 1. All 10 sheets
    const expectedSheets = ['Summary', 'Transactions', 'Expenses', 'Income', 'Monthly', 'Goals', 'Debts', 'Subscriptions', 'Program', 'Notes'];
    for (const sheetName of expectedSheets) {
      expect(wb.SheetNames).toContain(sheetName);
    }

    // 2. Numeric amount cells
    const expSheet = wb.Sheets['Expenses'];
    const amountCell = expSheet['F2'];
    expect(amountCell.t).toBe('n');
    expect(amountCell.v).toBe(450);

    // 3. SUM formulas
    const totalCell = expSheet['F3'];
    expect(totalCell.f).toBe('SUM(F2:F2)');
    expect(totalCell.t).toBe('n');

    // 4. Scope labels in Summary sheet
    const sumSheet = wb.Sheets['Summary'];
    expect(sumSheet['C2']?.v).toContain('2026-11-01 → 2026-11-30');
    expect(sumSheet['C3']?.v).toBe('All time');

    // 5. OpenXML structure: frozen header panes & autofilter
    const unzipped = fflate.unzipSync(buffer as Uint8Array);
    const sheetXml = fflate.strFromU8(unzipped['xl/worksheets/sheet3.xml']);
    expect(sheetXml).toContain('state="frozen"');
    expect(sheetXml).toContain('ySplit="1"');
    expect(sheetXml).toContain('<autoFilter');
  });

  it('enforces Right-To-Left (RTL) for Arabic export in OpenXML and workbook views', async () => {
    const buffer = await exportToExcel({
      initialBalance: 5000,
      transactions,
      categories,
      incomeSources,
      language: 'ar',
      tasks,
      programTracks,
      debts,
      subscriptions,
      notes,
    });

    const unzipped = fflate.unzipSync(buffer as Uint8Array);
    const sheet1Xml = fflate.strFromU8(unzipped['xl/worksheets/sheet1.xml']);
    expect(sheet1Xml).toContain('rightToLeft="1"');

    const wb = XLSX.read(buffer as Uint8Array);
    expect(wb.Workbook?.Views?.[0]?.RTL).toBe(true);
    expect(wb.Sheets['Summary']['C3']?.v).toBe('كل الفترة');
  });
});
