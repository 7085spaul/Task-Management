'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        status,
        ...(search ? { search } : {}),
      });
      const data = await api<{ tasks: Task[]; pagination: Pagination }>(`/tasks?${params}`);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user, fetchTasks]);

  useEffect(() => {
    if (!user && !loading) router.replace('/login');
  }, [user, loading, router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await api<Task>('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      setTasks((prev) => [task, ...prev]);
      setNewTitle('');
      toast.success('Task added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const updated = await api<Task>(`/tasks/${id}/toggle`, { method: 'PATCH' });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(updated.completed ? 'Marked complete' : 'Marked incomplete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return;
    try {
      const updated = await api<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditTitle('');
      toast.success('Task updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) setEditingId(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
  }

  if (loading || !user) {
    return (
      <main className="dashboard">
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Tasks</h1>
        <div className="user-info">
          <span>{user.name || user.email}</span>
          <button
            type="button"
            className="btn-logout"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="filters-row">
        <input
          type="search"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
        />
        <button
          type="button"
          onClick={() => setSearch(searchInput)}
          style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text)',
          }}
        >
          Search
        </button>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <form onSubmit={handleAdd} className="task-form">
        <input
          type="text"
          placeholder="Add a new task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={500}
        />
        <button type="submit" className="btn-add" disabled={adding || !newTitle.trim()}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {loadingTasks ? (
        <p style={{ color: 'var(--muted)' }}>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No tasks yet. Add one above.</p>
      ) : (
        <>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.completed}
                  disabled={togglingId === task.id}
                  onChange={() => handleToggle(task.id)}
                />
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                ) : (
                  <span className="task-title">{task.title}</span>
                )}
                <div className="task-actions">
                  {editingId === task.id ? (
                    <>
                      <button type="button" onClick={() => handleUpdate(task.id)}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openEdit(task)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
