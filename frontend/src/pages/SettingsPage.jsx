import { useState, useEffect } from 'react';
import { Settings, Save, LogOut, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, authApi } from '../services/api';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, setSettings, settings } = useStore();
  const [localSettings, setLocalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await settingsApi.list();
        setLocalSettings(
          Object.fromEntries(Object.entries(res.data.data).map(([k, v]) => [k, v.value]))
        );
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async (key) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await settingsApi.update(key, localSettings[key]);
      toast.success('Setting saved!');
    } catch (e) {
      toast.error('Failed to save setting');
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const settingLabels = {
    payPerQr:      { label: 'Pay Per QR (₹)', type: 'number' },
    maxBatchSize:  { label: 'Max Batch Size', type: 'number' },
    cooldownHours: { label: 'Cooldown Hours', type: 'number' },
    lockTimeout:   { label: 'Lock Timeout (minutes)', type: 'number' },
    currency:      { label: 'Currency', type: 'text' },
    timezone:      { label: 'Timezone', type: 'text' },
  };

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <Settings className="w-5 h-5 text-primary" />
      </div>

      {/* User Info */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-text-primary font-semibold">{user?.name}</p>
            <p className="text-text-muted text-xs">{user?.phone} • {user?.role}</p>
          </div>
          <div className="ml-auto">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              user?.role === 'ADMIN'
                ? 'bg-purple-900/30 text-purple-400 border border-purple-800'
                : 'bg-primary/10 text-primary border border-primary/30'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* System Settings (Admin Only) */}
      {user?.role === 'ADMIN' && (
        <div className="card p-4 mb-5">
          <h2 className="font-semibold text-text-primary mb-4">System Settings</h2>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(settingLabels).map(([key, meta]) => (
                <div key={key} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-text-muted text-xs mb-1 block">{meta.label}</label>
                    <input
                      id={`setting-${key}`}
                      type={meta.type}
                      className="input text-sm"
                      value={localSettings[key] ?? ''}
                      onChange={(e) =>
                        setLocalSettings((s) => ({ ...s, [key]: e.target.value }))
                      }
                    />
                  </div>
                  <button
                    id={`save-${key}`}
                    className="btn-primary px-3 py-3 flex-shrink-0"
                    onClick={() => handleSave(key)}
                    disabled={saving[key]}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Panel link */}
      {user?.role === 'ADMIN' && (
        <button
          id="go-admin"
          className="card p-4 w-full text-left mb-5 flex items-center gap-3 active:scale-[0.98] transition-all"
          onClick={() => navigate('/admin')}
        >
          <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-800 flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-text-primary font-medium">Admin Panel</p>
            <p className="text-text-muted text-xs">Manage users, workers, and more</p>
          </div>
        </button>
      )}

      {/* Change Password */}
      <div className="card p-4 mb-5">
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            id="current-password"
            type="password"
            className="input text-sm"
            placeholder="Current Password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
          />
          <input
            id="new-password"
            type="password"
            className="input text-sm"
            placeholder="New Password (min 6 chars)"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
          <button id="change-password-btn" type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button
        id="logout-btn"
        className="btn-danger w-full flex items-center justify-center gap-2"
        onClick={() => { logout(); navigate('/login'); toast('Signed out', { icon: '👋' }); }}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
