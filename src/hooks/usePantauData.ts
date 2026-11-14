import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import {
  DailyCheck,
  DailyReminder,
  FbAccount,
  ReminderTargetType,
  UserProfile,
} from '../types';

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function usePantauData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setAccounts([]);
        setDailyChecks([]);
        setReminders([]);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    let isMounted = true;
    const uid = user.uid;
    setDataLoading(true);
    setDataError(null);

    let unsubProfile: (() => void) | undefined;
    let unsubAccounts: (() => void) | undefined;
    let unsubChecks: (() => void) | undefined;
    let unsubReminders: (() => void) | undefined;

    async function bootstrapUserAndListeners() {
      const userDocPath = `users/${uid}`;
      const userRef = doc(db, 'users', uid);

      let userExists = false;
      try {
        const snap = await getDoc(userRef);
        userExists = snap.exists();
      } catch (err) {
        if (!isMounted) return;
        setDataError('Gagal memeriksa profil cloud Anda. Silakan muat ulang halaman.');
        handleFirestoreError(err, OperationType.GET, userDocPath);
      }

      if (!userExists) {
        try {
          const displayName =
            clampString(user!.displayName || 'Pengguna PantauFB', 100) ||
            'Pengguna PantauFB';
          await setDoc(userRef, {
            ownerId: uid,
            displayName,
            soundEnabled: true,
            notificationsEnabled: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          if (!isMounted) return;
          setDataError('Gagal membuat profil cloud Anda. Silakan muat ulang halaman.');
          handleFirestoreError(err, OperationType.CREATE, userDocPath);
        }

        try {
          // Seed 2 starter daily reminders once user doc exists
          const remBatch = writeBatch(db);
          const r1Id = generateId('rem');
          const r2Id = generateId('rem');
          remBatch.set(doc(db, 'users', uid, 'reminders', r1Id), {
            ownerId: uid,
            label: 'Pengingat Login Pagi',
            time: '09:00',
            targetType: 'login',
            enabled: true,
            lastTriggeredDate: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          remBatch.set(doc(db, 'users', uid, 'reminders', r2Id), {
            ownerId: uid,
            label: 'Cek Upload Konten Harian',
            time: '15:00',
            targetType: 'upload',
            enabled: true,
            lastTriggeredDate: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await remBatch.commit();
        } catch (err) {
          if (!isMounted) return;
          setDataError('Gagal menyiapkan jadwal pengingat awal.');
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/reminders`);
        }
      }

      if (!isMounted) return;

      let loadedFlags = {
        profile: false,
        accounts: false,
        checks: false,
        reminders: false,
      };
      const markLoaded = (key: keyof typeof loadedFlags) => {
        loadedFlags[key] = true;
        if (
          loadedFlags.profile &&
          loadedFlags.accounts &&
          loadedFlags.checks &&
          loadedFlags.reminders &&
          isMounted
        ) {
          setDataLoading(false);
        }
      };

      unsubProfile = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
          markLoaded('profile');
        },
        (err) => {
          setDataError('Gagal menyinkronkan profil pengguna.');
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }
      );

      const accountsPath = `users/${uid}/fbAccounts`;
      unsubAccounts = onSnapshot(
        query(collection(db, 'users', uid, 'fbAccounts'), where('ownerId', '==', uid)),
        (snapshot) => {
          const items: FbAccount[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<FbAccount, 'id'>),
          }));
          items.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return ta - tb;
          });
          setAccounts(items);
          markLoaded('accounts');
        },
        (err) => {
          setDataError('Gagal memuat daftar akun Facebook.');
          handleFirestoreError(err, OperationType.LIST, accountsPath);
        }
      );

      const checksPath = `users/${uid}/dailyChecks`;
      unsubChecks = onSnapshot(
        query(collection(db, 'users', uid, 'dailyChecks'), where('ownerId', '==', uid)),
        (snapshot) => {
          const items: DailyCheck[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DailyCheck, 'id'>),
          }));
          setDailyChecks(items);
          markLoaded('checks');
        },
        (err) => {
          setDataError('Gagal memuat log checklist harian.');
          handleFirestoreError(err, OperationType.LIST, checksPath);
        }
      );

      const remindersPath = `users/${uid}/reminders`;
      unsubReminders = onSnapshot(
        query(collection(db, 'users', uid, 'reminders'), where('ownerId', '==', uid)),
        (snapshot) => {
          const items: DailyReminder[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DailyReminder, 'id'>),
          }));
          items.sort((a, b) => a.time.localeCompare(b.time));
          setReminders(items);
          markLoaded('reminders');
        },
        (err) => {
          setDataError('Gagal memuat jadwal pengingat harian.');
          handleFirestoreError(err, OperationType.LIST, remindersPath);
        }
      );
    }

    bootstrapUserAndListeners();

    return () => {
      isMounted = false;
      unsubProfile?.();
      unsubAccounts?.();
      unsubChecks?.();
      unsubReminders?.();
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'Jendela login Google ditutup sebelum selesai.'
          : 'Gagal masuk dengan Google. Pastikan pop-up browser diizinkan.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const checksByDateAndAccount = useMemo(() => {
    const map = new Map<string, DailyCheck>();
    for (const check of dailyChecks) {
      map.set(`${check.dateKey}__${check.accountId}`, check);
    }
    return map;
  }, [dailyChecks]);

  const addAccount = useCallback(
    async (input: { name: string; username: string; profileUrl: string }) => {
      if (!user) return;
      const uid = user.uid;
      const accountId = generateId('fb');
      const path = `users/${uid}/fbAccounts/${accountId}`;
      const name = clampString(input.name, 80);
      if (!name) throw new Error('Nama akun wajib diisi.');

      try {
        await setDoc(doc(db, 'users', uid, 'fbAccounts', accountId), {
          ownerId: uid,
          name,
          username: clampString(input.username, 80),
          profileUrl: clampString(input.profileUrl, 240),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const updateAccount = useCallback(
    async (
      accountId: string,
      input: { name: string; username: string; profileUrl: string }
    ) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/fbAccounts/${accountId}`;
      const name = clampString(input.name, 80);
      if (!name) throw new Error('Nama akun wajib diisi.');

      try {
        await updateDoc(doc(db, 'users', uid, 'fbAccounts', accountId), {
          name,
          username: clampString(input.username, 80),
          profileUrl: clampString(input.profileUrl, 240),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const toggleAccountActive = useCallback(
    async (accountId: string, isActive: boolean) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/fbAccounts/${accountId}`;
      try {
        await updateDoc(doc(db, 'users', uid, 'fbAccounts', accountId), {
          isActive,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/fbAccounts/${accountId}`;
      try {
        const relatedChecks = dailyChecks.filter((c) => c.accountId === accountId);
        // Delete related checks in chunks of 400
        for (let i = 0; i < relatedChecks.length; i += 400) {
          const chunk = relatedChecks.slice(i, i + 400);
          const batch = writeBatch(db);
          for (const check of chunk) {
            batch.delete(doc(db, 'users', uid, 'dailyChecks', check.id));
          }
          await batch.commit();
        }
        await deleteDoc(doc(db, 'users', uid, 'fbAccounts', accountId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, dailyChecks]
  );

  const toggleDailyStatus = useCallback(
    async (
      dateKey: string,
      accountId: string,
      field: 'loggedIn' | 'uploaded',
      nextValue: boolean
    ) => {
      if (!user) return;
      const uid = user.uid;
      const checkId = `${dateKey}__${accountId}`;
      const path = `users/${uid}/dailyChecks/${checkId}`;
      const ref = doc(db, 'users', uid, 'dailyChecks', checkId);
      const existing = checksByDateAndAccount.get(checkId);

      try {
        if (existing) {
          await updateDoc(ref, {
            [field]: nextValue,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            ownerId: uid,
            dateKey,
            accountId,
            loggedIn: field === 'loggedIn' ? nextValue : false,
            uploaded: field === 'uploaded' ? nextValue : false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, checksByDateAndAccount]
  );

  const markAllForDate = useCallback(
    async (dateKey: string, loggedIn: boolean, uploaded: boolean) => {
      if (!user) return;
      const uid = user.uid;
      const activeAccounts = accounts.filter((a) => a.isActive);
      if (activeAccounts.length === 0) return;

      const path = `users/${uid}/dailyChecks`;
      try {
        for (let i = 0; i < activeAccounts.length; i += 400) {
          const chunk = activeAccounts.slice(i, i + 400);
          const batch = writeBatch(db);
          for (const account of chunk) {
            const checkId = `${dateKey}__${account.id}`;
            const ref = doc(db, 'users', uid, 'dailyChecks', checkId);
            const existing = checksByDateAndAccount.get(checkId);
            if (existing) {
              batch.update(ref, {
                loggedIn,
                uploaded,
                updatedAt: serverTimestamp(),
              });
            } else {
              batch.set(ref, {
                ownerId: uid,
                dateKey,
                accountId: account.id,
                loggedIn,
                uploaded,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
          await batch.commit();
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, accounts, checksByDateAndAccount]
  );

  const addReminder = useCallback(
    async (input: { label: string; time: string; targetType: ReminderTargetType }) => {
      if (!user) return;
      const uid = user.uid;
      const reminderId = generateId('rem');
      const path = `users/${uid}/reminders/${reminderId}`;
      const label = clampString(input.label, 80);
      if (!label) throw new Error('Nama pengingat wajib diisi.');

      try {
        await setDoc(doc(db, 'users', uid, 'reminders', reminderId), {
          ownerId: uid,
          label,
          time: input.time,
          targetType: input.targetType,
          enabled: true,
          lastTriggeredDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const updateReminder = useCallback(
    async (
      reminderId: string,
      input: { label: string; time: string; targetType: ReminderTargetType }
    ) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/reminders/${reminderId}`;
      const label = clampString(input.label, 80);
      if (!label) throw new Error('Nama pengingat wajib diisi.');

      try {
        await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), {
          label,
          time: input.time,
          targetType: input.targetType,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const toggleReminderEnabled = useCallback(
    async (reminderId: string, enabled: boolean) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/reminders/${reminderId}`;
      try {
        await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), {
          enabled,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const markReminderTriggered = useCallback(
    async (reminderId: string, dateKey: string) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/reminders/${reminderId}`;
      try {
        await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), {
          lastTriggeredDate: dateKey,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/reminders/${reminderId}`;
      try {
        await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const updateUserPreferences = useCallback(
    async (prefs: { soundEnabled: boolean; notificationsEnabled: boolean }) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}`;
      try {
        await updateDoc(doc(db, 'users', uid), {
          soundEnabled: prefs.soundEnabled,
          notificationsEnabled: prefs.notificationsEnabled,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  return {
    user,
    authReady,
    authLoading,
    authError,
    profile,
    accounts,
    dailyChecks,
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
  };
}
