import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { FbAccount } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  editingAccount: FbAccount | null;
  onClose: () => void;
  onSave: (data: { name: string; username: string; profileUrl: string }) => Promise<void>;
}

export function AccountModal({
  isOpen,
  editingAccount,
  onClose,
  onSave,
}: AccountModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editingAccount?.name ?? '');
      setUsername(editingAccount?.username ?? '');
      setProfileUrl(editingAccount?.profileUrl ?? '');
      setError(null);
      setSaving(false);
    }
  }, [isOpen, editingAccount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama akun atau halaman Facebook wajib diisi.');
      return;
    }

    const trimmedUrl = profileUrl.trim();
    if (
      trimmedUrl &&
      !trimmedUrl.startsWith('https://') &&
      !trimmedUrl.startsWith('http://')
    ) {
      setError('Tautan profil harus diawali dengan https:// atau http://');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: trimmedName,
        username: username.trim(),
        profileUrl: trimmedUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan akun.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 id="account-modal-title" className="text-base font-semibold text-slate-100">
            {editingAccount ? 'Ubah Akun Facebook' : 'Tambah Akun Facebook'}
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
            <label htmlFor="fb-name" className="block text-xs font-medium text-slate-300">
              Nama Akun / Halaman <span className="text-rose-400">*</span>
            </label>
            <input
              id="fb-name"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Toko Kue Nusantara / Akun Promo 01"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1120] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fb-username" className="block text-xs font-medium text-slate-300">
              Username / Catatan Identitas (Opsional)
            </label>
            <input
              id="fb-username"
              type="text"
              maxLength={80}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: @tokokuenusantara · HP Kantor"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1120] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fb-url" className="block text-xs font-medium text-slate-300">
              Tautan Profil / Halaman Facebook (Opsional)
            </label>
            <input
              id="fb-url"
              type="url"
              maxLength={240}
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1120] border border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
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
              {saving ? 'Menyimpan...' : editingAccount ? 'Simpan Perubahan' : 'Simpan Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
