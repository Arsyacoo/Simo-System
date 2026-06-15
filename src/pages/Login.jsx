import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { getDefaultPathForRole } from '../auth/roleAccess';
import { SHARED_DEMO_CODE } from '../data/demoAuth';
import { useAuth } from '../context/AuthCore';

export default function Login() {
  const navigate = useNavigate();
  const { authMode, currentUser, demoUsers, isAuthenticated, isRestoringSession, login } = useAuth();
  const [form, setForm] = useState({
    email: demoUsers[0]?.email || '',
    demoCode: SHARED_DEMO_CODE,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 text-sm font-semibold text-slate-500">
        Restoring session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultPathForRole(currentUser.roleId)} replace />;
  }

  const handleChange = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(form);
      navigate(getDefaultPathForRole(user.roleId), { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setForm({ email: user.email, demoCode: SHARED_DEMO_CODE });
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email: user.email, demoCode: SHARED_DEMO_CODE });
      navigate(getDefaultPathForRole(loggedInUser.roleId), { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-slate-800">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">SIMO Mugi Jaya</h1>
              <p className="text-sm font-medium text-slate-500">Production, logistics, and QC operations</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Login</h2>
                <p className="text-sm font-medium text-slate-500">
                  {authMode === 'signed-out' ? 'Demo access' : authMode}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Demo Code</label>
                <input
                  type="password"
                  value={form.demoCode}
                  onChange={(event) => handleChange('demoCode', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LogIn size={18} />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-800">Demo Accounts</h2>
            <p className="text-sm font-medium text-slate-500">Shared code: {SHARED_DEMO_CODE}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickLogin(user)}
                disabled={isSubmitting}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">{user.name}</p>
                    <p className="truncate text-sm font-medium text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {user.roleName}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
