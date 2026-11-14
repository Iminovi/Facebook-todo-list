import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  CALENDAR_WEEKDAYS,
  formatIndonesianDate,
  formatIndonesianMonthYear,
  getMonthCalendarDays,
  getTodayDateKey,
  parseDateKey,
} from '../lib/dateUtils';
import { DailyCheck, FbAccount } from '../types';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onOpenChecklistForDate: (dateKey: string) => void;
  accounts: FbAccount[];
  checksByDateAndAccount: Map<string, DailyCheck>;
  onToggleStatus: (
    dateKey: string,
    accountId: string,
    field: 'loggedIn' | 'uploaded',
    nextValue: boolean
  ) => Promise<void>;
}

export function CalendarView({
  selectedDate,
  onSelectDate,
  onOpenChecklistForDate,
  accounts,
  checksByDateAndAccount,
  onToggleStatus,
}: CalendarViewProps) {
  const initialDate = parseDateKey(selectedDate);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const todayKey = getTodayDateKey();
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive),
    [accounts]
  );

  const cells = useMemo(
    () => getMonthCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const dayStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; loggedIn: number; uploaded: number }
    >();

    for (const cell of cells) {
      let done = 0;
      let loggedIn = 0;
      let uploaded = 0;
      for (const acc of activeAccounts) {
        const check = checksByDateAndAccount.get(`${cell.dateKey}__${acc.id}`);
        if (check?.loggedIn) loggedIn++;
        if (check?.uploaded) uploaded++;
        if (check?.loggedIn && check?.uploaded) done++;
      }
      map.set(cell.dateKey, {
        total: activeAccounts.length,
        done,
        loggedIn,
        uploaded,
      });
    }
    return map;
  }, [cells, activeAccounts, checksByDateAndAccount]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(todayKey);
  };

  const selectedDaySummary = dayStatsMap.get(selectedDate) ?? {
    total: activeAccounts.length,
    done: 0,
    loggedIn: 0,
    uploaded: 0,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Monthly Calendar Grid */}
      <div className="xl:col-span-8 rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-100">
            {formatIndonesianMonthYear(viewYear, viewMonth)}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-lg border border-slate-800 bg-[#0B1120] text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B1120] text-xs font-medium text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-slate-800 bg-[#0B1120] text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0F172A]/60">
          {CALENDAR_WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-medium text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/70">
          {cells.map((cell) => {
            const stat = dayStatsMap.get(cell.dateKey) ?? {
              total: 0,
              done: 0,
              loggedIn: 0,
              uploaded: 0,
            };
            const isSelected = cell.dateKey === selectedDate;
            const isToday = cell.dateKey === todayKey;
            const hasActivity = stat.loggedIn > 0 || stat.uploaded > 0;
            const isComplete = stat.total > 0 && stat.done === stat.total;
            const progressPct =
              stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => onSelectDate(cell.dateKey)}
                className={`min-h-[82px] sm:min-h-[92px] p-2 sm:p-2.5 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 ring-1 ring-inset ring-blue-500/70'
                    : cell.isCurrentMonth
                    ? 'bg-[#111827] hover:bg-slate-800/45'
                    : 'bg-[#0B1120]/60 text-slate-600 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`text-xs font-mono tabular-nums font-medium ${
                      isToday
                        ? 'text-blue-400 font-bold'
                        : cell.isCurrentMonth
                        ? 'text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.dayNumber}
                    {isToday ? ' · Hari Ini' : ''}
                  </span>
                </div>

                {stat.total > 0 && cell.isCurrentMonth && (
                  <div className="space-y-1.5 w-full mt-2">
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                      <span
                        className={
                          isComplete
                            ? 'text-emerald-400'
                            : hasActivity
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }
                      >
                        {stat.done}/{stat.total}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isComplete
                            ? 'bg-emerald-500'
                            : hasActivity
                            ? 'bg-amber-500'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Panel */}
      <div className="xl:col-span-4 rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Detail Tanggal Dipilih</p>
              <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                {formatIndonesianDate(selectedDate)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenChecklistForDate(selectedDate)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Buka Checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0B1120] border border-slate-800/80">
              <p className="text-slate-400">Login</p>
              <p className="font-mono tabular-nums font-semibold text-blue-400 mt-0.5">
                {selectedDaySummary.loggedIn}/{selectedDaySummary.total}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B1120] border border-slate-800/80">
              <p className="text-slate-400">Upload</p>
              <p className="font-mono tabular-nums font-semibold text-amber-400 mt-0.5">
                {selectedDaySummary.uploaded}/{selectedDaySummary.total}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B1120] border border-slate-800/80">
              <p className="text-slate-400">Tuntas</p>
              <p className="font-mono tabular-nums font-semibold text-emerald-400 mt-0.5">
                {selectedDaySummary.done}/{selectedDaySummary.total}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
          {activeAccounts.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              Belum ada akun Facebook aktif yang terdaftar.
            </div>
          ) : (
            activeAccounts.map((acc) => {
              const check = checksByDateAndAccount.get(`${selectedDate}__${acc.id}`);
              const loggedIn = check?.loggedIn ?? false;
              const uploaded = check?.uploaded ?? false;
              const isDone = loggedIn && uploaded;
              const isPartial = (loggedIn || uploaded) && !isDone;

              return (
                <div
                  key={acc.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {acc.name}
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tuntas</span>
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Sebagian</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Belum</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(selectedDate, acc.id, 'loggedIn', !loggedIn)
                      }
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                        loggedIn
                          ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                          : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Tandai status login"
                    >
                      {loggedIn ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <LogIn className="w-3 h-3" />
                      )}
                      <span>Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(selectedDate, acc.id, 'uploaded', !uploaded)
                      }
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                        uploaded
                          ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                          : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Tandai status upload konten"
                    >
                      {uploaded ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
