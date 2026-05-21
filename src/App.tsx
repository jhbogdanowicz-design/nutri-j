import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useTranslations } from './lib/i18n';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function App() {
  const t = useTranslations();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nutri-j-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nutri-j-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <img src="/favicon.svg" alt="Nutri J Logo" className="animate-pulse" style={{ width: '64px', height: '64px' }} />
        <span className="logo-text animate-pulse" style={{ fontSize: '2rem' }}>
          Nutri <span>J</span>
        </span>
        <p>{t.loading}</p>
      </div>
    );
  }

  return session ? (
    <Dashboard user={session.user} theme={theme} toggleTheme={toggleTheme} />
  ) : (
    <Auth />
  );
}

export default App;
