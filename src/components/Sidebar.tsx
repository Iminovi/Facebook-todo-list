import {
  BellRing,
  CalendarDays,
  CheckSquare,
  LogOut,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  user: User;
  onLogout: () => void;
  todayCompletedCount: number;
  totalActiveAccounts: number;
  activeReminderCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  user,
  onLogout,
  todayCompletedCount,
  totalActiveAccounts,
  activeReminderCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: {
    id: ActiveView;
    label: string;
    icon: typeof CheckSquare;
    meta?: string;
  }[] = [
    {
      id: 'checklist',
      label: 'Checklist Hari Ini',
      icon: CheckSquare,
      meta: `${todayCompletedCount}/${totalActiveAccounts}`,
    },
    {
      id: 'calendar',
      label: 'Kalender Aktivitas',
      icon: CalendarDays,
    },
    {
      id: 'reminders',
      label: 'Pengingat Harian',
      icon: BellRing,
      meta: `${activeReminderCount} aktif`,
    },
  ];

  const handleNavClick = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] border-r border-slate-800/90 w-[256px]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <span className="text-lg font-bold tracking-tight text-slate-50 font-[var(--font-display)] whitespace-nowrap shrink-0">
          PantauFB
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 space-y-3 shrink-0">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">
            {user.displayName || 'Pengguna'}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-[#0B1120] hover:bg-slate-800/70 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
