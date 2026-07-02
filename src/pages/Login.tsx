import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSupabaseInstance } from '../supabaseClient';
import { Sparkles, Key, Mail, ShieldAlert, ArrowRight, WifiOff, RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { SupabaseSettings } from '../components/SupabaseSettings';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const navigate = useNavigate();
  const isNetworkOnline = navigator.onLine;

  const checkSupabaseConnection = async () => {
    const supabase = createSupabaseInstance();
    if (!supabase) {
      setIsSupabaseConnected(false);
      return;
    }
    try {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        setIsSupabaseConnected(true);
      } else {
        setIsSupabaseConnected(false);
      }
    } catch (e) {
      setIsSupabaseConnected(false);
    }
  };

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const supabase = createSupabaseInstance();

    // 1. If Supabase is active and network is online, attempt real login
    if (supabase && isNetworkOnline) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data?.session) {
          // Store session locally to allow offline-first check next time
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
          setSuccessMsg('Guul! Waa lagu soo xaqiijiyay...');
          setTimeout(() => navigate('/'), 1000);
          return;
        }
      } catch (err: any) {
        console.warn('Supabase Auth error:', err);
        setErrorMsg(`Supabase Auth Error: ${err.message || 'Cilad ayaa ka dhacday xaqiijinta.'}`);
        setLoading(false);
        return;
      }
    } else if (!supabase && email !== 'demo@kaabpos.com') {
      // If user tried to log in with custom email but Supabase isn't configured
      setErrorMsg('Mawa ku xirna Supabase dhab ah! Fadlan guji "Setup Supabase" si aad u geliso xogtaada ama u isticmaal Demo Account-ka hoose.');
      setLoading(false);
      return;
    }

    // 2. Offline / Local Credentials Fallback
    // For local ease of use and testing, check if email/password match a local user, or if password is '123456' / demo
    const storedUsersStr = localStorage.getItem('kaab_pos_local_users') || '[]';
    const localUsers = JSON.parse(storedUsersStr);
    
    // Find matching local user
    const matchedUser = localUsers.find(
      (u: any) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      localStorage.setItem(
        'kaab_pos_session',
        JSON.stringify({
          user: {
            email: matchedUser.email,
            id: matchedUser.id,
            name: matchedUser.name,
          },
          token: 'offline_token',
        })
      );
      setSuccessMsg('Muuqaal Offline: Waa lagu xaqiijiyay deegaanka!');
      setTimeout(() => navigate('/'), 1000);
    } else if (email === 'demo@kaabpos.com' && password === '123456') {
      // Default demo bypass
      localStorage.setItem(
        'kaab_pos_session',
        JSON.stringify({
          user: {
            email: 'demo@kaabpos.com',
            id: 'demo-user-id',
            name: 'Ganacsade Demo',
          },
          token: 'demo_token',
        })
      );
      setSuccessMsg('Demo Mode: Ku soo dhowow Kaab POS!');
      setTimeout(() => navigate('/'), 1000);
    } else {
      setErrorMsg(
        !isNetworkOnline
          ? 'Internet-ka waa maqan yahay. Geli email-ka iyo furaha demo (demo@kaabpos.com / 123456) si aad offline ugu gasho.'
          : 'Email-ka ama Password-ka waa khalad. Fadlan mar kale isku day.'
      );
    }
    setLoading(false);
  };

  const handleDemoBypass = () => {
    localStorage.setItem(
      'kaab_pos_session',
      JSON.stringify({
        user: {
          email: 'demo@kaabpos.com',
          id: 'demo-user',
          name: 'Maamulaha dukaanka (Demo)',
        },
        token: 'demo_token',
      })
    );
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-block bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl font-black text-2xl tracking-wider shadow-lg shadow-emerald-500/10 mb-2">
            KB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Kaab POS</h1>
          <p className="text-xs text-slate-400">Ku soo dhowow barnaamijka maaraynta iibka ee Soomaaliya</p>
        </div>

        {/* Supabase connection banner and config trigger */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-amber-500 shadow-lg shadow-amber-500/50'}`}></span>
            <span className="text-[11px] font-semibold text-slate-300">
              {isSupabaseConnected ? 'Supabase Connected' : 'Simulated Offline Mode'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            id="login-supabase-settings-btn"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-all underline decoration-dotted underline-offset-4 cursor-pointer"
          >
            Config Supabase
          </button>
        </div>

        {/* Network indicator warning */}
        {!isNetworkOnline && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-400">
            <WifiOff className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <p>
              Hadda offline ayaad tahay. Waxaad ku geli kartaa furihii aad horey u dhowratay ama demo account-ka hoose.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="magac@shirkad.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Password-ka</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>

          {/* Feedback */}
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 leading-relaxed font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>La xaqiijinayaa...</span>
              </>
            ) : (
              <>
                <span>Soo gal dukaanka</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Bypass Trigger */}
        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-400 mb-2">Ma haysatid xiriir Supabase dhab ah?</p>
          <button
            onClick={handleDemoBypass}
            id="demo-bypass-btn"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Sii wad Demo Mode-ka deegaanka (Instant POS)
          </button>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-slate-500">
          Ma haysatid akoon?{' '}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Is-diiwaan geli hadda
          </Link>
        </div>

        {/* Quick Credentials Info Box */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-500 space-y-1">
          <p className="font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            Quick Demo Login Account:
          </p>
          <p className="font-mono">Email: demo@kaabpos.com</p>
          <p className="font-mono">Password: 123456</p>
        </div>

      </div>

      {/* SUPABASE CONNECTION CREDENTIALS MODAL */}
      <SupabaseSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigChanged={async () => {
          await checkSupabaseConnection();
        }}
        isSupabaseConnected={isSupabaseConnected}
      />
    </div>
  );
}
