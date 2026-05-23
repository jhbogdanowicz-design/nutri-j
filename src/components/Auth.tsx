import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations } from '../lib/i18n';
import { AlertCircle, Loader2, LogOut, Sun, Moon } from 'lucide-react';

interface AuthProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Auth: React.FC<AuthProps> = ({ theme, toggleTheme }) => {
  const t = useTranslations();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(t.passwordMismatch);
        }
        if (formData.password.length < 6) {
          throw new Error(t.passwordTooShort);
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { nome: formData.nome }
          }
        });
        if (signUpError) throw signUpError;

        // Login automático após cadastro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || t.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="theme-toggle-wrap" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-outline"
          style={{ 
            padding: '0.5rem', 
            borderRadius: '999px', 
            width: '42px', 
            height: '42px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer'
          }}
          type="button"
          title={theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
        >
          {theme === 'light' ? (
            <Moon size={20} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <Sun size={20} style={{ color: 'var(--secondary)' }} />
          )}
        </button>
      </div>

      {/* ── LADO ESQUERDO ── */}
      <div className="auth-left">
        <div className="auth-left-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <img src="/favicon.svg" alt="Nutri J Logo" style={{ width: '36px', height: '36px' }} />
          <span className="logo-text" style={{ fontSize: '1.65rem', margin: 0 }}>
            Nutri <span>J</span>
            <span className="logo-badge">Beta</span>
          </span>
        </div>

        <h1 className="auth-left-headline">
          {t.headline1}
          <span>{t.headline2}</span>
        </h1>
        <p className="auth-left-sub">{t.subtext}</p>

        <div className="auth-features">
          {[t.feature1, t.feature2, t.feature3, t.feature4].map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <div className="auth-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── LADO DIREITO ── */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">
            {isRegistering ? t.registerTitle : t.loginTitle}
          </h2>
          <p className="auth-card-subtitle">
            {isRegistering ? t.registerSubtitle : t.loginSubtitle}
          </p>

          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="form-group">
                <label htmlFor="nome">{t.fullName}</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder={t.fullNamePlaceholder}
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">{t.email}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t.password}</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder={t.passwordPlaceholder}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {isRegistering && (
              <div className="form-group">
                <label htmlFor="confirmPassword">{t.confirmPassword}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div style={{ marginTop: '1.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : (isRegistering ? t.signUp : t.signIn)
                }
              </button>
            </div>
          </form>

          <div className="auth-divider">{t.or}</div>

          <div className="auth-footer">
            {isRegistering ? (
              <span>{t.hasAccount} <button onClick={() => setIsRegistering(false)}>{t.login}</button></span>
            ) : (
              <span>{t.noAccount} <button onClick={() => setIsRegistering(true)}>{t.register}</button></span>
            )}
          </div>

          <div className="session-btn-wrap">
            <button
              className="btn-session"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              <LogOut size={12} />
              {t.clearSession}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
