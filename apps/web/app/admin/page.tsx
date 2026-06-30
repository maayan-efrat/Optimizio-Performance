"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, BarChart2, Shield, Loader2, CheckCircle2, XCircle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/protected-layout';
import { useAuth } from '@/contexts/auth';
import { api } from '@/lib/api';

type AdminUser = {
  id: string; email: string; name: string; role: string;
  credits: number; emailVerified: boolean; createdAt: string;
  _count: { projects: number };
};

type Stats = { totalUsers: number; totalScans: number; totalProjects: number; scansToday: number };

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCredits, setEditingCredits] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.replace('/dashboard'); return; }

    Promise.all([api.admin.getStats(), api.admin.getUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function saveCredits(userId: string) {
    if (!editingCredits || editingCredits.id !== userId) return;
    const num = parseInt(editingCredits.value, 10);
    if (isNaN(num) || num < 0) return;
    setSaving(userId);
    try {
      const updated = await api.admin.updateCredits(userId, num);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: updated.credits } : u));
      setEditingCredits(null);
    } finally {
      setSaving(null);
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setSaving(userId);
    try {
      const updated = await api.admin.updateRole(userId, newRole as 'user' | 'admin');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
    } finally {
      setSaving(null);
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <ProtectedLayout>
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#A1A1AA]" />
        </main>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB]">
        <div className="mx-auto max-w-7xl flex flex-col gap-8">

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#18181B] p-8 shadow-glow">
            <Shield className="h-8 w-8 text-violet-400" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">Admin Panel</p>
              <h1 className="text-3xl font-semibold">ניהול המערכת</h1>
            </div>
          </motion.header>

          {/* Stats */}
          {stats && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'משתמשים', value: stats.totalUsers, icon: Users, color: 'text-violet-400' },
                { label: 'סריקות כולל', value: stats.totalScans, icon: BarChart2, color: 'text-cyan-400' },
                { label: 'פרויקטים', value: stats.totalProjects, icon: Zap, color: 'text-emerald-400' },
                { label: 'סריקות היום', value: stats.scansToday, icon: BarChart2, color: 'text-amber-400' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-6 flex items-center gap-4">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <div className="text-3xl font-bold text-[#F9FAFB]">{stat.value}</div>
                    <div className="text-sm text-[#A1A1AA]">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Users table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-[32px] border border-white/10 bg-[#111827]/80 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">משתמשים ({users.length})</h2>
              <input
                type="text"
                placeholder="חיפוש..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#09090B] px-4 py-2 text-sm text-[#F9FAFB] placeholder:text-[#A1A1AA] focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#A1A1AA] text-start">
                    <th className="pb-3 text-start font-medium">משתמש</th>
                    <th className="pb-3 text-center font-medium">אומת</th>
                    <th className="pb-3 text-center font-medium">פרויקטים</th>
                    <th className="pb-3 text-center font-medium">קרדיטים</th>
                    <th className="pb-3 text-center font-medium">תפקיד</th>
                    <th className="pb-3 text-start font-medium">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-[#F9FAFB]">{u.name}</div>
                        <div className="text-xs text-[#A1A1AA] direction-ltr">{u.email}</div>
                      </td>
                      <td className="py-3 text-center">
                        {u.emailVerified
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                          : <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="py-3 text-center text-[#A1A1AA]">{u._count.projects}</td>
                      <td className="py-3 text-center">
                        {editingCredits?.id === u.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              value={editingCredits.value}
                              onChange={e => setEditingCredits({ id: u.id, value: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && saveCredits(u.id)}
                              className="w-20 rounded-lg border border-white/10 bg-[#09090B] px-2 py-1 text-xs text-[#F9FAFB] text-center focus:outline-none focus:border-violet-500"
                              autoFocus
                            />
                            <button
                              onClick={() => saveCredits(u.id)}
                              disabled={saving === u.id}
                              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                            >
                              {saving === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓'}
                            </button>
                            <button onClick={() => setEditingCredits(null)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCredits({ id: u.id, value: String(u.credits) })}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:opacity-80 transition-opacity ${
                              u.credits < 100
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
                            }`}
                          >
                            <Zap className="h-3 w-3" /> {u.credits}
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          disabled={saving === u.id || u.id === user?.id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-opacity hover:opacity-80 disabled:opacity-40 ${
                            u.role === 'admin'
                              ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                              : 'border-white/15 bg-white/5 text-[#A1A1AA]'
                          }`}
                        >
                          {u.role === 'admin' && <Crown className="h-3 w-3" />}
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3 text-[#64748B] text-xs">
                        {new Date(u.createdAt).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-8 text-center text-[#64748B]">לא נמצאו משתמשים</div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </ProtectedLayout>
  );
}
