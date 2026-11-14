import { useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BrowserNotificationPermission,
  getNotificationPermission,
  requestBrowserNotificationPermission,
} from '../lib/notifications';
import { DailyReminder, ReminderTargetType } from '../types';

interface RemindersViewProps {
  reminders: DailyReminder[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  onUpdatePreferences: (prefs: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  }) => Promise<void>;
  onOpenAddReminder: () => void;
  onEditReminder: (reminder: DailyReminder) => void;
  onToggleReminderEnabled: (reminderId: string, enabled: boolean) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onTestNotification: () => boolean;
}

const TARGET_LABELS: Record<ReminderTargetType, string> = {
  login: 'Cek Akun Belum Login',
  upload: 'Cek Akun Belum Upload Konten',
  both: 'Cek Belum Login & Upload',
};

export function RemindersView({
  reminders,
  soundEnabled,
  notificationsEnabled,
  onUpdatePreferences,
  onOpenAddReminder,
  onEditReminder,
  onToggleReminderEnabled,
  onDeleteReminder,
  onTestNotification,
}: RemindersViewProps) {
  const [permission, setPermission] = useState<BrowserNotificationPermission>(() =>
    getNotificationPermission()
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      await onUpdatePreferences({ soundEnabled, notificationsEnabled: true });
    }
  };

  const handleTest = () => {
    const browserSent = onTestNotification();
    if (browserSent) {
      setTestFeedback('Notifikasi tes dikirim ke browser dan layar aplikasi.');
    } else {
      setTestFeedback(
        'Pengingat tes ditampilkan di aplikasi. Izinkan notifikasi browser agar muncul juga di desktop.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Browser Permission & Preferences */}
      <div className="rounded-xl bg-[#111827] border border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-100">
              Izin Notifikasi Browser & Audio
            </h2>
            <p className="text-sm text-slate-400">
              Saat jadwal harian tiba dan masih ada akun yang belum login atau upload,
              notifikasi otomatis akan muncul di browser Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission !== 'granted' && permission !== 'unsupported' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Izinkan Notifikasi</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-[#0B1120] hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>Kirim Tes Notifikasi</span>
            </button>
          </div>
        </div>

        {testFeedback && (
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200">
            {testFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div className="p-3.5 rounded-lg bg-[#0B1120] border border-slate-800/80 space-y-1">
            <p className="text-xs text-slate-400">Status Izin Browser</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              {permission === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Diizinkan</span>
                </>
              ) : permission === 'denied' ? (
                <>
                  <BellOff className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400">Diblokir di Browser</span>
                </>
              ) : permission === 'unsupported' ? (
                <span className="text-slate-400">Tidak Didukung Browser</span>
              ) : (
                <span className="text-amber-400">Belum Diizinkan</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({
                soundEnabled,
                notificationsEnabled: !notificationsEnabled,
              })
            }
            className="p-3.5 rounded-lg bg-[#0B1120] border border-slate-800/80 hover:border-slate-700 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-xs text-slate-400">Pengingat Otomatis</p>
              <p className="text-sm font-medium text-slate-100 mt-0.5">
                {notificationsEnabled ? 'Aktif' : 'Dijeda'}
              </p>
            </div>
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({
                soundEnabled: !soundEnabled,
                notificationsEnabled,
              })
            }
            className="p-3.5 rounded-lg bg-[#0B1120] border border-slate-800/80 hover:border-slate-700 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-xs text-slate-400">Suara Lonceng</p>
              <p className="text-sm font-medium text-slate-100 mt-0.5">
                {soundEnabled ? 'Menyala' : 'Senyap'}
              </p>
            </div>
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Daily Reminder Schedules */}
      <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Jadwal Pengingat Harian
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Berbunyi otomatis setiap hari pada jam berikut jika ada akun tertunda.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddReminder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal</span>
          </button>
        </div>

        {reminders.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Belum ada jadwal pengingat harian yang diatur.
            </p>
            <button
              type="button"
              onClick={onOpenAddReminder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Pengingat Pertama</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-100 shrink-0">
                    {reminder.time}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {reminder.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {TARGET_LABELS[reminder.targetType]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleReminderEnabled(reminder.id, !reminder.enabled)
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      reminder.enabled
                        ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                        : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {reminder.enabled ? 'Aktif' : 'Nonaktif'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditReminder(reminder)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Ubah jadwal"
                    aria-label={`Ubah ${reminder.label}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {confirmDeleteId === reminder.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteReminder(reminder.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white cursor-pointer"
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded border border-slate-700 text-xs text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(reminder.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hapus jadwal"
                      aria-label={`Hapus ${reminder.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
