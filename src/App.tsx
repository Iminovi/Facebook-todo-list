import { useMemo, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { AccountModal } from './components/AccountModal';
import { AuthScreen } from './components/AuthScreen';
import { CalendarView } from './components/CalendarView';
import { ChecklistView } from './components/ChecklistView';
import { ReminderModal } from './components/ReminderModal';
import { RemindersView } from './components/RemindersView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { usePantauData } from './hooks/usePantauData';
import { useReminderScheduler } from './hooks/useReminderScheduler';
import { getTodayDateKey } from './lib/dateUtils';
import { ActiveView, DailyReminder, FbAccount } from './types';

export default function App() {
  const {
    user,
    authReady,
    authLoading,
    authError,
    profile,
    accounts,
    checksByDateAndAccount,
    reminders,
    dataLoading,
    dataError,
    signInWithGoogle,
    logout,
    addAccount,
    updateAccount,
    toggleAccountActive,
    deleteAccount,
    toggleDailyStatus,
    markAllForDate,
    addReminder,
    updateReminder,
    toggleReminderEnabled,
    markReminderTriggered,
    deleteReminder,
    updateUserPreferences,
  } = usePantauData();

  const [activeView, setActiveView] = useState<ActiveView>('checklist');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FbAccount | null>(null);

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<DailyReminder | null>(null);

  const soundEnabled = profile?.soundEnabled ?? true;
  const notificationsEnabled = profile?.notificationsEnabled ?? true;

  const { activeAlert, dismissAlert, fireTestNotification } = useReminderScheduler({
    isAuthenticated: Boolean(user),
    accounts,
    checksByDateAndAccount,
    reminders,
    soundEnabled,
    notificationsEnabled,
    markReminderTriggered,
  });

  const todayStats = useMemo(() => {
    const todayKey = getTodayDateKey();
    const active = accounts.filter((a) => a.isActive);
    let completed = 0;
    for (const acc of active) {
      const check = checksByDateAndAccount.get(`${todayKey}__${acc.id}`);
      if (check?.loggedIn && check?.uploaded) {
        completed++;
      }
    }
    return {
      total: active.length,
      completed,
    };
  }, [accounts, checksByDateAndAccount]);

  const activeReminderCount = useMemo(
    () => reminders.filter((r) => r.enabled).length,
    [reminders]
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-sm text-slate-400">Memuat aplikasi...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        loading={authLoading}
        error={authError}
        onSignIn={signInWithGoogle}
      />
    );
  }

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountModalOpen(true);
  };

  const handleOpenEditAccount = (account: FbAccount) => {
    setEditingAccount(account);
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (data: {
    name: string;
    username: string;
    profileUrl: string;
  }) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await addAccount(data);
    }
  };

  const handleOpenAddReminder = () => {
    setEditingReminder(null);
    setReminderModalOpen(true);
  };

  const handleOpenEditReminder = (reminder: DailyReminder) => {
    setEditingReminder(reminder);
    setReminderModalOpen(true);
  };

  const handleSaveReminder = async (data: {
    label: string;
    time: string;
    targetType: DailyReminder['targetType'];
  }) => {
    if (editingReminder) {
      await updateReminder(editingReminder.id, data);
    } else {
      await addReminder(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        user={user}
        onLogout={logout}
        todayCompletedCount={todayStats.completed}
        totalActiveAccounts={todayStats.total}
        activeReminderCount={activeReminderCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeView={activeView}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onOpenAddAccount={handleOpenAddAccount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1360px] w-full mx-auto space-y-6">
          {dataError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-sm text-rose-200"
            >
              {dataError}
            </div>
          )}

          {activeAlert && (
            <div
              role="status"
              className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-200">
                    {activeAlert.label} · {activeAlert.time}
                  </p>
                  {activeAlert.pendingAccounts.length > 0 ? (
                    <p className="text-xs text-amber-100/80 leading-relaxed">
                      {activeAlert.pendingAccounts.length} akun belum tuntas hari ini:{' '}
                      {activeAlert.pendingAccounts
                        .slice(0, 4)
                        .map((p) => p.name)
                        .join(', ')}
                      {activeAlert.pendingAccounts.length > 4
                        ? ` dan ${activeAlert.pendingAccounts.length - 4} akun lainnya`
                        : ''}
                      .
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-300">
                      Semua akun aktif sudah login dan upload konten hari ini.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeAlert.pendingAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(getTodayDateKey());
                      setActiveView('checklist');
                      dismissAlert();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Buka Checklist
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismissAlert}
                  className="p-1.5 rounded-lg text-amber-200/70 hover:text-amber-100 hover:bg-amber-900/40 transition-colors cursor-pointer"
                  aria-label="Tutup pengingat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeView === 'checklist' && (
            <ChecklistView
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              accounts={accounts}
              checksByDateAndAccount={checksByDateAndAccount}
              loading={dataLoading}
              onToggleStatus={toggleDailyStatus}
              onMarkAllForDate={markAllForDate}
              onOpenAddAccount={handleOpenAddAccount}
              onEditAccount={handleOpenEditAccount}
              onToggleAccountActive={toggleAccountActive}
              onDeleteAccount={deleteAccount}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenChecklistForDate={(dateKey) => {
                setSelectedDate(dateKey);
                setActiveView('checklist');
              }}
              accounts={accounts}
              checksByDateAndAccount={checksByDateAndAccount}
              onToggleStatus={toggleDailyStatus}
            />
          )}

          {activeView === 'reminders' && (
            <RemindersView
              reminders={reminders}
              soundEnabled={soundEnabled}
              notificationsEnabled={notificationsEnabled}
              onUpdatePreferences={updateUserPreferences}
              onOpenAddReminder={handleOpenAddReminder}
              onEditReminder={handleOpenEditReminder}
              onToggleReminderEnabled={toggleReminderEnabled}
              onDeleteReminder={deleteReminder}
              onTestNotification={fireTestNotification}
            />
          )}
        </main>
      </div>

      <AccountModal
        isOpen={accountModalOpen}
        editingAccount={editingAccount}
        onClose={() => setAccountModalOpen(false)}
        onSave={handleSaveAccount}
      />

      <ReminderModal
        isOpen={reminderModalOpen}
        editingReminder={editingReminder}
        onClose={() => setReminderModalOpen(false)}
        onSave={handleSaveReminder}
      />
    </div>
  );
}
