import { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, RotateCcw, Unlock, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, workersApi } from '../services/api';
import useStore from '../store/useStore';

export default function AdminPage() {
  const { user } = useStore();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ phone: '', password: '', name: '', role: 'SUPERVISOR' });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, workersRes, logsRes] = await Promise.all([
        adminApi.getUsers(),
        workersApi.list({ limit: 200 }),
        adminApi.getAuditLogs(),
      ]);
      setUsers(usersRes.data.data);
      setWorkers(workersRes.data.data);
      setAuditLogs(logsRes.data.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      await adminApi.createUser(newUser);
      toast.success(`${newUser.name} added!`);
      setNewUser({ phone: '', password: '', name: '', role: 'SUPERVISOR' });
      setShowAddUser(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success(`${name} deactivated`);
      fetchAll();
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleResetCooldown = async (worker) => {
    try {
      await adminApi.resetCooldown(worker.id);
      toast.success(`Cooldown reset for ${worker.workerId}`);
      fetchAll();
    } catch (err) {
      toast.error('Failed to reset cooldown');
    }
  };

  const handleForceUnlock = async (worker) => {
    try {
      await adminApi.forceUnlock(worker.id);
      toast.success(`${worker.workerId} force-unlocked`);
      fetchAll();
    } catch (err) {
      toast.error('Failed to force unlock');
    }
  };

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-purple-400" />
        <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-elevated p-1 rounded-xl">
        {[
          { key: 'users', label: '👥 Users' },
          { key: 'workers', label: '⚙️ Workers' },
          { key: 'logs', label: '📋 Audit' },
        ].map((t) => (
          <button
            key={t.key}
            id={`admin-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? 'bg-primary text-bg' : 'text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {tab === 'users' && (
            <div className="animate-fade-in">
              <button
                id="add-user-btn"
                className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
                onClick={() => setShowAddUser(!showAddUser)}
              >
                <UserPlus className="w-4 h-4" />
                Add Supervisor / Admin
              </button>

              {showAddUser && (
                <form onSubmit={handleAddUser} className="card p-4 mb-4 flex flex-col gap-3 animate-slide-down">
                  <input id="new-user-name"  className="input text-sm" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} required />
                  <input id="new-user-phone" className="input text-sm" placeholder="Phone" type="tel" value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))} required />
                  <input id="new-user-pass"  className="input text-sm" placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))} required />
                  <select id="new-user-role" className="input text-sm" value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button id="confirm-add-user" type="submit" className="btn-primary" disabled={addingUser}>
                    {addingUser ? 'Adding...' : 'Add User'}
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {users.map((u) => (
                  <div key={u.id} className="card p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">{u.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium text-sm">{u.name}</p>
                      <p className="text-text-muted text-xs">{u.phone} • {u.role}</p>
                    </div>
                    {!u.isActive && <span className="text-red-400 text-xs">Inactive</span>}
                    {u.id !== user?.id && u.isActive && (
                      <button
                        id={`delete-user-${u.id}`}
                        className="text-red-400 p-2"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workers Admin Tab */}
          {tab === 'workers' && (
            <div className="animate-fade-in flex flex-col gap-2">
              {workers
                .filter((w) => w.status === 'COOLDOWN' || w.status === 'LOCKED')
                .map((w) => (
                  <div key={w.id} className="card p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-text-primary font-medium">{w.workerId} — {w.name}</p>
                        <p className="text-text-muted text-xs">{w.status}</p>
                      </div>
                      <div className="flex gap-2">
                        {w.status === 'COOLDOWN' && (
                          <button
                            id={`reset-cooldown-${w.id}`}
                            className="btn-secondary p-2 flex items-center gap-1 text-xs"
                            onClick={() => handleResetCooldown(w)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        )}
                        {w.status === 'LOCKED' && (
                          <button
                            id={`force-unlock-${w.id}`}
                            className="btn-danger p-2 flex items-center gap-1 text-xs"
                            onClick={() => handleForceUnlock(w)}
                          >
                            <Unlock className="w-3 h-3" />
                            Unlock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {workers.filter((w) => w.status === 'COOLDOWN' || w.status === 'LOCKED').length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-text-secondary">All workers are available</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Logs Tab */}
          {tab === 'logs' && (
            <div className="animate-fade-in flex flex-col gap-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="card p-3 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-text-primary text-sm font-medium">{log.action}</p>
                      <p className="text-text-muted text-xs">{log.user?.name || 'System'}</p>
                    </div>
                    <p className="text-text-muted text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-text-secondary">No audit logs</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
