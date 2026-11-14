import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentTimeHHMM, getTodayDateKey, timeToMinutes } from '../lib/dateUtils';
import { playReminderChime, sendBrowserNotification } from '../lib/notifications';
import {
  ActiveReminderAlert,
  DailyCheck,
  DailyReminder,
  FbAccount,
} from '../types';

interface UseReminderSchedulerProps {
  isAuthenticated: boolean;
  accounts: FbAccount[];
  checksByDateAndAccount: Map<string, DailyCheck>;
  reminders: DailyReminder[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  markReminderTriggered: (reminderId: string, dateKey: string) => Promise<void>;
}

export function useReminderScheduler({
  isAuthenticated,
  accounts,
  checksByDateAndAccount,
  reminders,
  soundEnabled,
  notificationsEnabled,
  markReminderTriggered,
}: UseReminderSchedulerProps) {
  const [activeAlert, setActiveAlert] = useState<ActiveReminderAlert | null>(null);
  const triggeredSessionRef = useRef<Set<string>>(new Set());

  const evaluatePendingAccounts = useCallback(
    (dateKey: string, targetType: DailyReminder['targetType']) => {
      const activeAccounts = accounts.filter((a) => a.isActive);
      const pending: ActiveReminderAlert['pendingAccounts'] = [];

      for (const acc of activeAccounts) {
        const check = checksByDateAndAccount.get(`${dateKey}__${acc.id}`);
        const loggedIn = check?.loggedIn ?? false;
        const uploaded = check?.uploaded ?? false;

        const missingLogin = !loggedIn;
        const missingUpload = !uploaded;

        const shouldAlert =
          (targetType === 'login' && missingLogin) ||
          (targetType === 'upload' && missingUpload) ||
          (targetType === 'both' && (missingLogin || missingUpload));

        if (shouldAlert) {
          pending.push({
            id: acc.id,
            name: acc.name,
            missingLogin,
            missingUpload,
          });
        }
      }

      return pending;
    },
    [accounts, checksByDateAndAccount]
  );

  const fireTestNotification = useCallback(() => {
    const todayKey = getTodayDateKey();
    const pending = evaluatePendingAccounts(todayKey, 'both');
    const previewNames = pending
      .slice(0, 3)
      .map((p) => p.name)
      .join(', ');
    const bodyText =
      pending.length > 0
        ? `${pending.length} akun belum tuntas hari ini (${previewNames}${pending.length > 3 ? ', ...' : ''}).`
        : 'Semua akun Facebook Anda sudah login & upload konten hari ini!';

    const sent = sendBrowserNotification('Tes Pengingat PantauFB', bodyText);
    if (soundEnabled) {
      playReminderChime();
    }

    setActiveAlert({
      id: 'test-alert',
      label: 'Tes Pengingat Harian',
      time: getCurrentTimeHHMM(),
      targetType: 'both',
      pendingAccounts: pending,
    });

    return sent;
  }, [evaluatePendingAccounts, soundEnabled]);

  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled) return;

    const checkSchedule = () => {
      const todayKey = getTodayDateKey();
      const nowMinutes = timeToMinutes(getCurrentTimeHHMM());

      for (const reminder of reminders) {
        if (!reminder.enabled) continue;
        if (reminder.lastTriggeredDate === todayKey) continue;

        const sessionKey = `${todayKey}__${reminder.id}`;
        if (triggeredSessionRef.current.has(sessionKey)) continue;

        const targetMinutes = timeToMinutes(reminder.time);
        // Trigger within a 3-minute window from scheduled time so timer throttling never misses it
        if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 2) {
          const pending = evaluatePendingAccounts(todayKey, reminder.targetType);
          triggeredSessionRef.current.add(sessionKey);
          markReminderTriggered(reminder.id, todayKey).catch(() => {});

          if (pending.length > 0) {
            const namesPreview = pending
              .slice(0, 3)
              .map((p) => p.name)
              .join(', ');
            const suffix = pending.length > 3 ? ` dan ${pending.length - 3} akun lainnya` : '';
            const targetDesc =
              reminder.targetType === 'login'
                ? 'belum login'
                : reminder.targetType === 'upload'
                ? 'belum upload konten'
                : 'belum tuntas hari ini';

            sendBrowserNotification(
              `${reminder.label} (${reminder.time})`,
              `${pending.length} akun ${targetDesc}: ${namesPreview}${suffix}.`
            );

            if (soundEnabled) {
              playReminderChime();
            }

            setActiveAlert({
              id: reminder.id,
              label: reminder.label,
              time: reminder.time,
              targetType: reminder.targetType,
              pendingAccounts: pending,
            });
          }
        }
      }
    };

    checkSchedule();
    const timer = window.setInterval(checkSchedule, 15000);
    return () => window.clearInterval(timer);
  }, [
    isAuthenticated,
    notificationsEnabled,
    reminders,
    soundEnabled,
    evaluatePendingAccounts,
    markReminderTriggered,
  ]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return {
    activeAlert,
    dismissAlert,
    fireTestNotification,
  };
}
