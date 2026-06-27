import React from 'react';
import { Wifi, WifiOff, Database, RefreshCw, Settings } from 'lucide-react';
import { SyncStats } from '../types';

interface HeaderProps {
  isOnline: boolean;
  isSimulatingOffline: boolean;
  toggleOfflineSimulation: () => void;
  syncStats: SyncStats;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenSettings: () => void;
  isSupabaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isSimulatingOffline,
  toggleOfflineSimulation,
  syncStats,
  isSyncing,
  onManualSync,
  onOpenSettings,
  isSupabaseConnected,
}) => {
  const finalOnlineState = isOnline && !isSimulatingOffline;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo & Slogan */}
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl font-bold text-xl tracking-wider shadow-lg shadow-emerald-500/20">
            KB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Kaab POS <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">v1.0 - Somali First</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Barnaamijka Iibka ee Offline-First</p>
          </div>
        </div>

        {/* Network and Sync Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Supabase Connection Indicator */}
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
            isSupabaseConnected 
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <Database className="h-3.5 w-3.5" />
            <span>{isSupabaseConnected ? 'Supabase: Connected' : 'Supabase: Local Only'}</span>
          </div>

          {/* Network Connection Badge */}
          <button
            onClick={toggleOfflineSimulation}
            id="network-simulation-btn"
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-300 ${
              finalOnlineState
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 animate-pulse'
            }`}
            title="Guji si aad u bedesho Internet Connection-ka (Simulation)"
          >
            {finalOnlineState ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>ONLINE (Cagaar)</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>OFFLINE (Cas)</span>
              </>
            )}
          </button>

          {/* Pending Sync Badge */}
          {syncStats.pendingCount > 0 && (
            <div className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/10 animate-bounce">
              <span>{syncStats.pendingCount} Iib oo dhiman</span>
            </div>
          )}

          {/* Sync Trigger Button */}
          <button
            onClick={onManualSync}
            disabled={!finalOnlineState || isSyncing}
            id="manual-sync-btn"
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all border ${
              finalOnlineState
                ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700 cursor-pointer'
                : 'bg-slate-800/40 text-slate-500 border-slate-800/60 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'La midaynayaa...' : 'Midoobi (Sync)'}</span>
          </button>

          {/* Configuration Settings Button */}
          <button
            onClick={onOpenSettings}
            id="settings-toggle-btn"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Supabase Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
