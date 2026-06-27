import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Key, CheckCircle, Database, Copy, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig } from '../supabaseClient';

interface SupabaseSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
  isSupabaseConnected: boolean;
}

export const SupabaseSettings: React.FC<SupabaseSettingsProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  isSupabaseConnected,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setKey(config.anonKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), key.trim());
    onConfigChanged();
    alert('Qaabeynta Supabase waa la kaydiyay! Barnaamijku wuxuu isku dayi doonaa inuu ku xirmo.');
    onClose();
  };

  const handleClear = () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setKey('');
    onConfigChanged();
    alert('Custom Credentials waa la tirtiray! Barnaamijku wuxuu dib ugu noqday Habka Deegaanka (Simulated Mode).');
    onClose();
  };

  const sqlSchema = `-- 1. Abuur Shaxda Alaabta (Inventory/Products)
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  somali_name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL,
  somali_price NUMERIC NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL
);

-- 2. Abuur Shaxda Iibka (Sales)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  change_due NUMERIC NOT NULL DEFAULT 0,
  notes TEXT
);

-- 3. Abuur Shaxda Agabka la iibiyay (Sales Items)
CREATE TABLE IF NOT EXISTS sales_items (
  id UUID PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Xiriirinta Supabase (Sync Config)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Alert */}
          {isSupabaseConnected ? (
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-3 text-xs text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-bold">Supabase wuu ku xiran yahay!</p>
                <p className="text-slate-300 mt-1">Xogta iibka ee laguu calaamadeeyo 'pending_sync' si toos ah ayaa loola midayn doonaa miisaska Supabase markaad online tahay.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-3 text-xs text-amber-400">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Habka Deegaanka (Simulated offline mode)</p>
                <p className="text-slate-300 mt-1">
                  Xilligan ma jiro xiriir toos ah oo lala dhisay database-ka dhabta ah ee Supabase. Waxaad u isticmaali kartaa koodhkan sidii demo ku dhex shaqaynaysa browserka. Si aad u midayso xog dhab ah, geli hoos fureyaasha mashruucaaga Supabase.
                </p>
              </div>
            </div>
          )}

          {/* Setup Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Supabase URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {(url || key) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-950/35 hover:bg-red-950/60 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear Config
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Credentials</span>
              </button>
            </div>
          </form>

          {/* Database Tables creation Guide */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-emerald-400" />
                  Diyaarinta Shaxda (Supabase SQL)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Koobiyeey koodhkan hoose kuna shub SQL Editor-ka dashboard-ka Supabase.</p>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 flex items-center gap-1 text-[11px] cursor-pointer font-bold"
              >
                <Copy className="h-3 w-3" />
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed scrollbar-thin select-all">
              {sqlSchema}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-850 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
