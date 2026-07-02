import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSupabaseInstance } from '../supabaseClient';
import { User, Mail, Key, Sparkles, Building, ArrowLeft, RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { SupabaseSettings } from '../components/SupabaseSettings';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg('Password-ku waa inuu ka koobnaadaa ugu yaraan 6 xaraf.');
      setLoading(false);
      return;
    }

    const supabase = createSupabaseInstance();

    // 1. If Supabase is active and network is online, attempt real database signup
    if (supabase && isNetworkOnline) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName,
              shop_name: shopName,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data) {
          setSuccessMsg('Akoonkaaga waa la abuuray! E-mail xaqiijin ah ayaa laga yaabaa in laguu soo diro.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
      } catch (err: any) {
        console.warn('Supabase Register error:', err);
        setErrorMsg(`Supabase Error: ${err.message || 'Cilad ayaa dhacday intii la abuurayay user Supabase.'}`);
        setLoading(false);
        return;
      }
    }

    // 2. Offline / Local Storage Registration Fallback
    // Save credentials to local storage for local/offline usage simulation
    try {
      const storedUsersStr = localStorage.getItem('kaab_pos_local_users') || '[]';
      const localUsers = JSON.parse(storedUsersStr);

      const exists = localUsers.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) {
        setErrorMsg('E-mail-kan horey ayaa loo is-diiwaan geliyay deegaanka.');
        setLoading(false);
        return;
      }

      const newUser = {
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        name: fullName,
        email: email.trim(),
        password: password,
        shop: shopName,
      };

      localUsers.push(newUser);
      localStorage.setItem('kaab_pos_local_users', JSON.stringify(localUsers));

      setSuccessMsg('Is-diiwaan gelinta deegaanka waa guul! Ku soo gal akoonkaaga dhowaan.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setErrorMsg('Cilad ayaa ku dhacday kaydinta deegaanka.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header / Logo */}
        <div className="space-y-2 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ku laabo Login-ka</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Diiwaan Geli Dukaan Cusub</h1>
          <p className="text-xs text-slate-400">Abuur xisaab dukaamaysi si aad u bilowdo iibka</p>
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
            id="register-supabase-settings-btn"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-all underline decoration-dotted underline-offset-4 cursor-pointer"
          >
            Config Supabase
          </button>
        </div>

        {/* Warning if local simulation is used */}
        {!isNetworkOnline && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-400">
            <p>
              <strong>FIIRO GAAR AH:</strong> Maadaama aad offline tahay, user-kan waxaa lagu kaydin doonaa browser-ka mashiinkaaga si aad ugu shaqayso demo offline ah.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Magacaaga Oo Buuxa (Full Name)</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Ex: Axmed Cali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Magaca Ganacsiga (Shop Name)</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Ex: Kaab Mini Market"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="magacaaga@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Ugu yaraan 6 xaraf"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
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
            id="register-submit-btn"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>La abuurayaa akoonka...</span>
              </>
            ) : (
              <span>Abuur Akoonkaaga</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Horey miyaad u is-diiwaan gelisay?{' '}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Soo gal halkaan
          </Link>
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
