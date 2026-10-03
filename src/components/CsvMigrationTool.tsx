'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { useFinanceStore } from '@/lib/store';
import { ExpenseDocument, PaymentMethod, ScopeType } from '@/types/finance';
import { formatCurrency, round2 } from '@/lib/calculations';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CsvRow {
  'Item / Vendor'?: string;
  'Account Details / Reference'?: string;
  'Original Amount Due (ZAR)'?: string | number;
  'Due Date'?: string;
  'Payment Method'?: string;
  [key: string]: unknown;
}

interface CsvMigrationToolProps {
  onClose?: () => void;
}

export function CsvMigrationTool({ onClose }: CsvMigrationToolProps) {
  const batchAddExpenses = useFinanceStore((state) => state.batchAddExpenses);

  const [selectedScope, setSelectedScope] = useState<ScopeType>('personal');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ExpenseDocument[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Clean and parse monetary amounts from strings like "R 1,893.36", "1893.36", "1 893,36"
  const parseAmount = (val: unknown): number => {
    if (typeof val === 'number') return round2(val);
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val
      .replace(/[^\d.,-]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : round2(parsed);
  };

  // Standardize payment method rail
  const parsePaymentMethod = (methodStr: unknown): PaymentMethod => {
    if (!methodStr || typeof methodStr !== 'string') return 'Debit Order';
    const normalized = methodStr.trim().toLowerCase();
    if (normalized.includes('eft')) return 'EFT';
    if (normalized.includes('card')) return 'Card';
    if (normalized.includes('cash send') || normalized.includes('cashsend')) return 'Cash Send';
    if (normalized.includes('cash')) return 'Cash';
    return 'Debit Order';
  };

  // Standardize due date (e.g. "2026-10-16", "16-10-2026", "16", "2026/10/16")
  const parseDueDate = (dateStr: unknown): string => {
    if (!dateStr || typeof dateStr !== 'string') return '2026-10-01';
    const trimmed = dateStr.trim();

    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // If it's DD/MM/YYYY or DD-MM-YYYY
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // If only a day was given (e.g. "16")
    const day = parseInt(trimmed, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return `2026-10-${day.toString().padStart(2, '0')}`;
    }

    return '2026-10-01';
  };

  // Handle CSV file selection and parsing with PapaParse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportStatus(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            setParseError('The uploaded CSV file is empty.');
            return;
          }

          const mapped: ExpenseDocument[] = results.data
            .filter((row) => row['Item / Vendor'] && row['Item / Vendor'].trim() !== '')
            .map((row, index) => {
              const vendor = (row['Item / Vendor'] || 'Unnamed Vendor').trim();
              const reference = (row['Account Details / Reference'] || '').trim();
              const baseAmount = parseAmount(row['Original Amount Due (ZAR)']);
              const dueDate = parseDueDate(row['Due Date']);
              const method = parsePaymentMethod(row['Payment Method']);

              const expenseId = `exp_mig_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;

              return {
                id: expenseId,
                name: vendor,
                reference: reference,
                scope: selectedScope,
                dueDate: dueDate,
                paymentMethod: method,
                monthlyDueConfig: {
                  base: baseAmount,
                  overrides: {},
                  accumulated: {},
                },
                monthlyDueDateConfig: {
                  base: dueDate,
                  overrides: {},
                },
                payments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            });

          if (mapped.length === 0) {
            setParseError(
              'No valid rows found. Ensure the CSV headers match: "Item / Vendor", "Account Details / Reference", "Original Amount Due (ZAR)", "Due Date", "Payment Method".'
            );
          } else {
            setParsedItems(mapped);
          }
        } catch (err) {
          setParseError(`Failed to process CSV rows: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
      error: (error) => {
        setParseError(`CSV parsing error: ${error.message}`);
      },
    });
  };

  // Switch scope and update parsed records dynamically
  const handleScopeChange = (scope: ScopeType) => {
    setSelectedScope(scope);
    setParsedItems((prev) => prev.map((item) => ({ ...item, scope })));
  };

  // Perform Firestore batch write
  const handleImportToFirestore = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    setParseError(null);

    try {
      const importedCount = await batchAddExpenses(parsedItems);
      setImportStatus({
        success: true,
        count: importedCount,
        message: `Successfully migrated ${importedCount} ${selectedScope} expenses directly to Firestore!`,
      });
      setParsedItems([]);
      setFileName(null);
    } catch (err) {
      setParseError(`Failed to write batch to Firestore: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-violet-200/80 shadow-md space-y-4">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Google Sheets Master Data Migration
            </h2>
            <p className="text-xs text-slate-500">
              One-time CSV batch importer into Firestore subcollection
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Tool
          </button>
        )}
      </div>

      {/* Scope Selector */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-violet-600" />
          <span>Step 1: Select Allocation Scope for this CSV</span>
        </label>
        <p className="text-xs text-slate-500">
          Choose whether the items in this file represent your <b>Personal</b> or <b>Company</b> expenses.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 max-w-sm">
          <button
            type="button"
            onClick={() => handleScopeChange('personal')}
            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
              selectedScope === 'personal'
                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Personal Expenses
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('company')}
            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
              selectedScope === 'company'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Company Expenses
          </button>
        </div>
      </div>

      {/* CSV File Dropzone / Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Step 2: Upload Google Sheets Export (.csv)
        </label>

        <div className="relative border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-violet-50/20 transition-all cursor-pointer">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="w-8 h-8 mx-auto text-violet-600 mb-2 stroke-[1.75]" />
          <p className="text-xs sm:text-sm font-semibold text-slate-800">
            {fileName ? (
              <span className="text-violet-700 font-bold">{fileName}</span>
            ) : (
              'Click to select or drag and drop your CSV file here'
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Expected headers: Item / Vendor, Account Details / Reference, Original Amount Due (ZAR), Due Date, Payment Method
          </p>
        </div>
      </div>

      {/* Error Feedback */}
      {parseError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Success Feedback */}
      {importStatus?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-emerald-900">Migration Complete!</p>
            <p className="mt-0.5">{importStatus.message}</p>
          </div>
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedItems.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 3: Preview Mapped Records ({parsedItems.length} items)
            </span>
            <button
              type="button"
              onClick={() => {
                setParsedItems([]);
                setFileName(null);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
            {parsedItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 text-[10px] text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Ref: {item.reference || 'None'} • Due: {item.dueDate} • {item.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold font-mono text-slate-900 block">
                    {formatCurrency(item.monthlyDueConfig.base)}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      item.scope === 'personal'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {item.scope}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Import Execution Button */}
          <button
            type="button"
            disabled={isImporting}
            onClick={handleImportToFirestore}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing Batch to Firestore...</span>
              </>
            ) : (
              <>
                <span>Commit & Batch Write {parsedItems.length} Records to Firestore</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
