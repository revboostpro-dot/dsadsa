import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import useStore from '../store/useStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success(`Welcome, ${res.data.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-glow-green animate-pulse-green">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient">WorkerMgr</h1>
          <p className="text-text-secondary text-sm mt-1">QR Worker Management System</p>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="glass p-6 shadow-elevated">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                className="input pl-11"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input pl-11 pr-11"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          QR Worker Manager v1.0 • Secure Login
        </p>
      </div>
    </div>
  );
}
