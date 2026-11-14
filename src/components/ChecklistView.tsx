import { useMemo, useState } from 'react';
import {
  Archive,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LogIn,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  formatIndonesianDate,
  getTodayDateKey,
  shiftDateKey,
} from '../lib/dateUtils';
import { ChecklistFilter, DailyCheck, FbAccount } from '../types';

interface ChecklistViewProps {
  selectedDate: string;
  onChangeDate: (dateKey: string) => void;
  accounts: FbAccount[];
  checksByDateAndAccount: Map<string, DailyCheck>;
  loading: boolean;
  onToggleStatus: (
    dateKey: string,
    accountId: string,
    field: 'loggedIn' | 'uploaded',
    nextValue: boolean
  ) => Promise<void>;
  onMarkAllForDate: (
    dateKey: string,
    loggedIn: boolean,
    uploaded: boolean
  ) => Promise<void>;
  onOpenAddAccount: () => void;
  onEditAccount: (account: FbAccount) => void;
  onToggleAccountActive: (accountId: string, isActive: boolean) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
}

export function ChecklistView({
  selectedDate,
  onChangeDate,
  accounts,
  checksByDateAndAccount,
  loading,
  onToggleStatus,
  onMarkAllForDate,
  onOpenAddAccount,
  onEditAccount,
  onToggleAccountActive,
  onDeleteAccount,
}: ChecklistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ChecklistFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const todayKey = getTodayDateKey();
  const isToday = selectedDate === todayKey;

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive),
    [accounts]
  );

  const archivedCount = accounts.length - activeAccounts.length;

  const stats = useMemo(() => {
    let loggedInCount = 0;
    let uploadedCount = 0;
    let fullyDoneCount = 0;

    for (const acc of activeAccounts) {
      const check = checksByDateAndAccount.get(`${selectedDate}__${acc.id}`);
      const loggedIn = check?.loggedIn ?? false;
      const uploaded = check?.uploaded ?? false;
      if (loggedIn) loggedInCount++;
      if (uploaded) uploadedCount++;
      if (loggedIn && uploaded) fullyDoneCount++;
    }

    return {
      total: activeAccounts.length,
      loggedInCount,
      uploadedCount,
      fullyDoneCount,
    };
  }, [activeAccounts, checksByDateAndAccount, selectedDate]);

  const filteredAccounts = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();

    return accounts.filter((acc) => {
      if (!showArchived && !acc.isActive) return false;
      if (showArchived && acc.isActive) return false;

      if (queryLower) {
        const matchName = acc.name.toLowerCase().includes(queryLower);
        const matchUser = acc.username.toLowerCase().includes(queryLower);
        if (!matchName && !matchUser) return false;
      }

      if (!acc.isActive) return true;

      const check = checksByDateAndAccount.get(`${selectedDate}__${acc.id}`);
      const loggedIn = check?.loggedIn ?? false;
      const uploaded = check?.uploaded ?? false;

      if (filter === 'not_logged_in') return !loggedIn;
      if (filter === 'not_uploaded') return !uploaded;
      if (filter === 'completed') return loggedIn && uploaded;
      return true;
    });
  }, [
    accounts,
    showArchived,
    searchQuery,
    filter,
    checksByDateAndAccount,
    selectedDate,
  ]);

  const handleToggle = async (
    accountId: string,
    field: 'loggedIn' | 'uploaded',
    nextValue: boolean
  ) => {
    const key = `${accountId}_${field}`;
    setBusyKey(key);
    try {
      await onToggleStatus(selectedDate, accountId, field, nextValue);
    } finally {
      setBusyKey(null);
    }
  };

  const handleBulkAction = async (loggedIn: boolean, uploaded: boolean) => {
    setBusyKey('bulk');
    try {
      await onMarkAllForDate(selectedDate, loggedIn, uploaded);
    } finally {
      setBusyKey(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    setBusyKey(`del_${accountId}`);
    try {
      await onDeleteAccount(accountId);
      setConfirmDeleteId(null);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Date Switcher */}
      <div className="sm:hidden flex items-center justify-between gap-2 p-3 rounded-xl bg-[#111827] border border-slate-800">
        <button
          type="button"
          onClick={() => onChangeDate(shiftDateKey(selectedDate, -1))}
          className="p-2 rounded-lg border border-slate-800 text-slate-300"
          aria-label="Hari sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-xs font-mono tabular-nums text-slate-200">
            {formatIndonesianDate(selectedDate)}
          </p>
          {!isToday && (
            <button
              type="button"
              onClick={() => onChangeDate(todayKey)}
              className="text-xs text-blue-400 underline mt-0.5"
            >
              Kembali ke Hari Ini
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChangeDate(shiftDateKey(selectedDate, 1))}
          className="p-2 rounded-lg border border-slate-800 text-slate-300"
          aria-label="Hari berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#111827] border border-slate-800 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs font-medium text-slate-400">Total Akun Aktif</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {loading ? '—' : stats.total}
          </p>
          <p className="text-xs text-slate-500">
            {archivedCount > 0 ? `${archivedCount} akun diarsipkan` : 'Semua aktif dipantau'}
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs font-medium text-slate-400">Sudah Login</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-400">
            {loading ? '—' : `${stats.loggedInCount}/${stats.total}`}
          </p>
          <p className="text-xs text-slate-500">
            {stats.total - stats.loggedInCount} akun belum login
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs font-medium text-slate-400">Sudah Upload Konten</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {loading ? '—' : `${stats.uploadedCount}/${stats.total}`}
          </p>
          <p className="text-xs text-slate-500">
            {stats.total - stats.uploadedCount} akun belum upload
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <p className="text-xs font-medium text-slate-400">Tuntas Hari Ini</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {loading ? '—' : `${stats.fullyDoneCount}/${stats.total}`}
          </p>
          <p className="text-xs text-slate-500">
            {stats.total > 0 && stats.fullyDoneCount === stats.total
              ? 'Semua akun selesai'
              : 'Login dan upload lengkap'}
          </p>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau username akun..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-[#111827] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {!showArchived && (
            <div
              className="flex items-center gap-1 p-1 rounded-lg bg-[#111827] border border-slate-800 overflow-x-auto"
              role="tablist"
              aria-label="Filter status checklist"
            >
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'not_logged_in', label: 'Belum Login' },
                  { id: 'not_uploaded', label: 'Belum Upload' },
                  { id: 'completed', label: 'Selesai' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showArchived
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Kembali ke Akun Aktif' : `Arsip (${archivedCount})`}</span>
            </button>
          )}

          {!showArchived && activeAccounts.length > 0 && (
            <>
              <button
                type="button"
                disabled={busyKey === 'bulk'}
                onClick={() => handleBulkAction(true, true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-[#111827] hover:bg-slate-800/70 text-xs font-medium text-emerald-400 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Semua Selesai</span>
              </button>
              <button
                type="button"
                disabled={busyKey === 'bulk'}
                onClick={() => handleBulkAction(false, false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-[#111827] hover:bg-slate-800/70 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tanggal Ini</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Data Grid / Empty / Loading States */}
      {loading ? (
        <div className="rounded-xl bg-[#111827] border border-slate-800 divide-y divide-slate-800/80">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-800/70 rounded animate-pulse" />
              </div>
              <div className="h-8 w-28 bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-28 bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-10 text-center space-y-4">
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-slate-100">
              Belum ada akun Facebook yang didaftarkan
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tambahkan daftar akun atau halaman Facebook yang Anda kelola untuk mulai melacak status login dan upload konten harian.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddAccount}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Pertama</span>
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-200">
            Tidak ada akun yang cocok dengan filter atau pencarian saat ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
              setShowArchived(false);
            }}
            className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0F172A]/60">
                  <th className="py-3 px-5">Akun Facebook</th>
                  {!showArchived && (
                    <>
                      <th className="py-3 px-4">Status Login</th>
                      <th className="py-3 px-4">Upload Konten</th>
                      <th className="py-3 px-4">Ringkasan</th>
                    </>
                  )}
                  <th className="py-3 px-5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredAccounts.map((account) => {
                  const check = checksByDateAndAccount.get(
                    `${selectedDate}__${account.id}`
                  );
                  const loggedIn = check?.loggedIn ?? false;
                  const uploaded = check?.uploaded ?? false;
                  const isFullyDone = loggedIn && uploaded;
                  const isPartial = (loggedIn || uploaded) && !isFullyDone;

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3.5 px-5 min-w-[220px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-100 truncate">
                                {account.name}
                              </span>
                              {account.profileUrl && (
                                <a
                                  href={account.profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-blue-400 transition-colors shrink-0"
                                  title="Buka tautan Facebook"
                                  aria-label={`Buka ${account.name} di tab baru`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            {account.username && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {account.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {!showArchived && (
                        <>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={busyKey === `${account.id}_loggedIn`}
                              onClick={() =>
                                handleToggle(account.id, 'loggedIn', !loggedIn)
                              }
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                loggedIn
                                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 hover:bg-emerald-950/80'
                                  : 'bg-[#0B1120] border-slate-700/80 text-slate-300 hover:border-blue-500/60 hover:text-slate-100'
                              }`}
                            >
                              {loggedIn ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{loggedIn ? 'Sudah Login' : 'Belum Login'}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={busyKey === `${account.id}_uploaded`}
                              onClick={() =>
                                handleToggle(account.id, 'uploaded', !uploaded)
                              }
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                uploaded
                                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 hover:bg-emerald-950/80'
                                  : 'bg-[#0B1120] border-slate-700/80 text-slate-300 hover:border-blue-500/60 hover:text-slate-100'
                              }`}
                            >
                              {uploaded ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{uploaded ? 'Sudah Upload' : 'Belum Upload'}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isFullyDone ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Tuntas</span>
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>Sebagian</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>Belum Dikerjakan</span>
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {confirmDeleteId === account.id ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs text-rose-300">Hapus?</span>
                            <button
                              type="button"
                              disabled={busyKey === `del_${account.id}`}
                              onClick={() => handleDelete(account.id)}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditAccount(account)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Ubah akun"
                              aria-label={`Ubah ${account.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onToggleAccountActive(account.id, !account.isActive)
                              }
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              title={
                                account.isActive ? 'Arsipkan akun' : 'Aktifkan kembali'
                              }
                              aria-label={
                                account.isActive
                                  ? `Arsipkan ${account.name}`
                                  : `Aktifkan ${account.name}`
                              }
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(account.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus akun"
                              aria-label={`Hapus ${account.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
