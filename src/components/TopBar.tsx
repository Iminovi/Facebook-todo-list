import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import {
  formatIndonesianDate,
  getTodayDateKey,
  shiftDateKey,
} from '../lib/dateUtils';
import { ActiveView } from '../types';

interface TopBarProps {
  activeView: ActiveView;
  selectedDate: string;
  onChangeDate: (dateKey: string) => void;
  onOpenAddAccount: () => void;
  onOpenMobileMenu: () => void;
}

export function TopBar({
  activeView,
  selectedDate,
  onChangeDate,
  onOpenAddAccount,
  onOpenMobileMenu,
}: TopBarProps) {
  const todayKey = getTodayDateKey();
  const isToday = selectedDate === todayKey;

  const viewTitles: Record<ActiveView, string> = {
    checklist: 'Checklist Harian Akun',
    calendar: 'Kalender Aktivitas',
    reminders: 'Pengingat Harian Otomatis',
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/90 bg-[#0B1120]/95 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg border border-slate-800 bg-[#111827] text-slate-300 hover:text-slate-100 transition-colors shrink-0"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
            {viewTitles[activeView]}
          </h1>
          <span className="hidden md:inline text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="hidden md:inline text-sm text-slate-400 font-mono tabular-nums whitespace-nowrap">
            {formatIndonesianDate(selectedDate)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activeView === 'checklist' && (
          <div className="hidden sm:flex items-center bg-[#111827] border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeDate(shiftDateKey(selectedDate, -1))}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Hari sebelumnya"
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDate(todayKey)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isToday
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => onChangeDate(shiftDateKey(selectedDate, 1))}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Hari berikutnya"
              aria-label="Hari berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenAddAccount}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun</span>
        </button>
      </div>
    </header>
  );
}
