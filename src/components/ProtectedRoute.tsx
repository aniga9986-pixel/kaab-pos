import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createSupabaseInstance } from '../supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // 1. Check local session (essential for Offline-First access)
      const localSession = localStorage.getItem('kaab_pos_session');
      if (localSession) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // 2. If no local session, check active Supabase session (if configured)
      const supabase = createSupabaseInstance();
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            // Save to localStorage to persist offline capability
            localStorage.setItem(
              'kaab_pos_session',
              JSON.stringify({
                user: {
                  email: data.session.user.email,
                  id: data.session.user.id,
                  name: data.session.user.user_metadata?.full_name || 'Ganacsade',
                },
                token: data.session.access_token,
              })
            );
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.warn('Could not verify Supabase session online:', err);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
        <p className="text-sm font-mono text-slate-400">Hubinta xaqiijinta aqoonsiga (Checking Auth)...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
