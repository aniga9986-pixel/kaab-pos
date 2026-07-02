import React, { useState } from 'react';
import { Clock, RefreshCw, CheckCircle2, AlertCircle, Trash2, Search, Calendar, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Sale } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
  isOnline: boolean;
  onClearHistory: () => Promise<void>;
  onSyncSale: (sale: Sale) => Promise<void>;
  isSyncing: boolean;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  isOnline,
  onClearHistory,
  onSyncSale,
  isSyncing,
}) => {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const toggleExpand = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  const filteredSales = sales.filter((sale) => {
    const searchLower = filterSearch.toLowerCase();
    const customerMatch = sale.customer_name?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = sale.customer_phone?.includes(searchLower) || false;
    const idMatch = sale.id.toLowerCase().includes(searchLower);
    const methodMatch = sale.payment_method.toLowerCase().includes(searchLower);
    return customerMatch || phoneMatch || idMatch || methodMatch;
  });

  const handleClear = async () => {
    if (confirm('Ma xaqiijinaysaa inaad tirtirto dhammaan taariikhda iibka ee deegaanka? Tani ma saameynayso Supabase.')) {
      await onClearHistory();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Taariikhda Iibka (Sales History)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Xogta ku kaydsan qalabkaaga (IndexedDB)</p>
        </div>

        {sales.length > 0 && (
          <button
            onClick={handleClear}
            id="clear-history-btn"
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/15 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Tirtir Taariikhda</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Raadi iib (Macmiil, Method, ID)..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="w-full bg-slate-850 text-slate-100 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none text-xs transition-all"
        />
      </div>

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
        {filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-16">
            <Calendar className="h-10 w-10 text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium">Wax iib ah oo la helay ma jiraan.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Markaad iibiso alaab, halkan ayay ku kaydsami doontaa.</p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const isExpanded = expandedSaleId === sale.id;
            const isPending = sale.status === 'pending_sync';
            const isFailed = sale.status === 'failed_sync';

            return (
              <div
                key={sale.id}
                className={`bg-slate-800/25 border rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-slate-700' : 'border-slate-800/80 hover:border-slate-800'
                }`}
              >
                {/* Sale Row Header */}
                <div
                  onClick={() => toggleExpand(sale.id)}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800/20"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Status badge icon */}
                    {isPending ? (
                      <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="U baahan Sync" />
                    ) : isFailed ? (
                      <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" title="Midayntu way fashilantay" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-emerald-400" title="La midayay (Synced)" />
                    )}

                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{sale.customer_name || 'Walk-in Customer'}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">#{sale.id.slice(0, 8)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(sale.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400">${sale.total.toFixed(2)}</span>
                      <span className="block text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 rounded border border-slate-750 text-slate-400 font-bold mt-0.5 text-center">
                        {sale.payment_method}
                      </span>
                    </div>

                    {/* Sync action / Indicator */}
                    {isPending || isFailed ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!isOnline) {
                            alert('Fadlan daar internet-ka si aad u sync-garayso iibkan.');
                            return;
                          }
                          await onSyncSale(sale);
                        }}
                        disabled={isSyncing || !isOnline}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isOnline
                            ? isFailed
                              ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 border-red-500/20 hover:border-red-500'
                              : 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border-amber-500/20 hover:border-amber-500'
                            : 'bg-slate-800 text-slate-500 border-slate-750 cursor-not-allowed'
                        }`}
                        title={isFailed ? "Isku day mar kale" : "Sync-garee hadda"}
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isFailed ? 'Retry' : 'Sync'}</span>
                      </button>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Expand Chevron */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-300 space-y-3">
                    {/* Items table */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Agabka la iibsaday</span>
                      <div className="space-y-1.5">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-850">
                            <div>
                              <span className="font-semibold text-slate-200">{item.product_name}</span>
                              <span className="text-slate-500 font-mono ml-2">({item.quantity} x ${item.price.toFixed(2)})</span>
                            </div>
                            <span className="font-mono font-bold text-slate-200">${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment details summary */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] pt-1.5">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Lacag Bixinta</span>
                        <p className="text-slate-300 font-medium">Qaabka: {sale.payment_method}</p>
                        <p className="text-slate-400 font-mono">La dhiibay: ${sale.amount_paid.toFixed(2)}</p>
                        {sale.change_due > 0 && <p className="text-emerald-400 font-mono">Haraaga: ${sale.change_due.toFixed(2)}</p>}
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Sync Details</span>
                        <p className={`font-semibold ${
                          sale.status === 'synced' ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          Status: {sale.status === 'synced' ? 'Synced (Cloud)' : isFailed ? 'Midayntu waa fashilantay' : 'U baahan Sync'}
                        </p>
                        {sale.synced_at && (
                          <p className="text-slate-400 text-[10px] font-mono">
                            Midoo: {new Date(sale.synced_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Sync Error Block */}
                    {isFailed && sale.sync_error && (
                      <div className="bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg text-red-300 text-[11px] space-y-1.5">
                        <div className="font-bold text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Faahfaahinta Cilada (Sync Error Details)
                        </div>
                        <p className="font-mono text-[10px] bg-red-950/40 p-1.5 rounded border border-red-500/10 text-red-200 break-all">
                          {sale.sync_error}
                        </p>
                        {sale.sync_error.toLowerCase().includes('row-level security') && (
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            💡 <strong className="text-white">Xalka:</strong> Fadlan tag SQL Editor-ka Supabase oo ku shub koodhkan hoose: <br />
                            <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px] block my-1">ALTER TABLE sales DISABLE ROW LEVEL SECURITY;</code>
                            si loo midooyo iibkan oo RLS-ta loo damiyo.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Notes if any */}
                    {sale.notes && (
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                        <span className="block text-[9px] text-slate-500 uppercase font-bold mb-0.5">Xusuus-qor</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">{sale.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
