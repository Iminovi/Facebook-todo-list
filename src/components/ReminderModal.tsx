import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DailyReminder, ReminderTargetType } from '../types';

interface ReminderModalProps {
  isOpen: boolean;
  editingReminder: DailyReminder | null;
  onClose: () => void;
  onSave: (data: {
    label: string;
    time: string;
    targetType: ReminderTargetType;
  }) => Promise<void>;
}

export function ReminderModal({
  isOpen,
  editingReminder,
  onClose,
  onSave,
}: ReminderModalProps) {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('09:00');
  const [targetType, setTargetType] = useState<ReminderTargetType>('both');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel(editingReminder?.label ?? '');
      setTime(editingReminder?.time ?? '09:00');
      setTargetType(editingReminder?.targetType ?? 'both');
      setError(null);
      setSaving(false);
    }
  }, [isOpen, editingReminder]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError('Nama pengingat wajib diisi.');
      return;
    }
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setError('Format jam pengingat tidak valid.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        label: trimmedLabel,
        time,
        targetType,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengingat.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 id="reminder-modal-title" className="text-base font-semibold text-slate-100">
            {editingReminder ? 'Ubah Pengingat Harian' : 'Tambah Pengingat Harian'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="rem-label" className="block text-xs font-medium text-slate-300">
              Nama Pengingat <span className="text-rose-400">*</span>
            </label>
            <input
              id="rem-label"
              type="text"
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Cek Upload Konten Sore"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1120] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rem-time" className="block text-xs font-medium text-slate-300">
              Jam Pengingat Harian
            </label>
            <input
              id="rem-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1120] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm font-mono tabular-nums text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-slate-300">
              Kondisi Pemicu Pengingat
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'login', label: 'Belum Login' },
                  { id: 'upload', label: 'Belum Upload' },
                  { id: 'both', label: 'Keduanya' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTargetType(option.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    targetType === option.id
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                      : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {saving ? 'Menyimpan...' : editingReminder ? 'Simpan Perubahan' : 'Tambah Pengingat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
