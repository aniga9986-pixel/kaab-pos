import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, CreditCard, Calendar, BarChart3, Receipt, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sale } from '../types';

interface DailySalesProps {
  sales: Sale[];
}

export const DailySales: React.FC<DailySalesProps> = ({ sales }) => {
  // Use local date as state to allow merchants to filter by specific days
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // Format YYYY-MM-DD in local time zone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Parse selected date
  const selectedDateObj = useMemo(() => {
    return new Date(selectedDate);
  }, [selectedDate]);

  // Filter sales for the selected date
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      return (
        saleDate.getFullYear() === selectedDateObj.getFullYear() &&
        saleDate.getMonth() === selectedDateObj.getMonth() &&
        saleDate.getDate() === selectedDateObj.getDate()
      );
    });
  }, [sales, selectedDateObj]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalUsd = 0;
    let evcTotal = 0;
    let zaadTotal = 0;
    let sahalTotal = 0;
    let cashTotal = 0;

    let evcCount = 0;
    let zaadCount = 0;
    let sahalCount = 0;
    let cashCount = 0;

    filteredSales.forEach((sale) => {
      const amount = sale.total || 0;
      totalUsd += amount;

      const method = sale.payment_method;
      if (method === 'EVC Plus') {
        evcTotal += amount;
        evcCount++;
      } else if (method === 'Zaad') {
        zaadTotal += amount;
        zaadCount++;
      } else if (method === 'Sahal') {
        sahalTotal += amount;
        sahalCount++;
      } else if (method === 'Cash') {
        cashTotal += amount;
        cashCount++;
      }
    });

    const totalSosh = Math.round(totalUsd * 26000);
    const averageSale = filteredSales.length > 0 ? totalUsd / filteredSales.length : 0;

    return {
      totalUsd,
      totalSosh,
      averageSale,
      methods: {
        evc: { total: evcTotal, count: evcCount, percentage: totalUsd > 0 ? (evcTotal / totalUsd) * 100 : 0 },
        zaad: { total: zaadTotal, count: zaadCount, percentage: totalUsd > 0 ? (zaadTotal / totalUsd) * 100 : 0 },
        sahal: { total: sahalTotal, count: sahalCount, percentage: totalUsd > 0 ? (sahalTotal / totalUsd) * 100 : 0 },
        cash: { total: cashTotal, count: cashCount, percentage: totalUsd > 0 ? (cashTotal / totalUsd) * 100 : 0 },
      },
    };
  }, [filteredSales]);

  // Navigation helpers for dates
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const isSelectedToday = useMemo(() => {
    const today = new Date();
    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return selectedDate === tStr;
  }, [selectedDate]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      
      {/* Header and Date Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Guud iibka Maalinlaha (Daily Sales Summary)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Xisaabinta maalinlaha ah ee habka lacag bixinta</p>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Maalintii ka horaysay"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold font-mono focus:outline-none cursor-pointer pr-1 pl-2 py-1"
            />
            {isSelectedToday && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold mr-2 select-none">
                MAANTA
              </span>
            )}
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Maalinta xigta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wadarta Dakhliga (Total Revenue)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">${stats.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span className="block text-[10px] font-mono text-slate-500">
              ≈ {stats.totalSosh.toLocaleString()} Sh.So
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        {/* Transaction Count Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mugga Iibka (Total Transactions)</span>
            <span className="block text-xl font-bold font-mono text-white">{filteredSales.length} xidho</span>
            <span className="block text-[10px] text-slate-500">Iib guul leh oo maanta diiwaangashan</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/15">
            <Receipt className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        {/* Average Transaction Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Celcelis ahaan Iibka (Average Basket)</span>
            <span className="block text-xl font-bold font-mono text-amber-400">${stats.averageSale.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="block text-[10px] text-slate-500">Dakhliga dhexe ee halkii macmiilba</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/15">
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Payment Method Group Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-slate-400" />
          Qaybta Hab-Lacageedka (Payment Breakdown)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* EVC PLUS */}
          <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#38bdf8] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                EVC Plus
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {stats.methods.evc.count} iib
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold font-mono text-white">${stats.methods.evc.total.toFixed(2)}</span>
              <span className="block text-[9px] font-mono text-slate-500">
                ≈ {(Math.round(stats.methods.evc.total * 26000)).toLocaleString()} Sh.So
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Saamaynta:</span>
                <span>{stats.methods.evc.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1">
                <div 
                  className="bg-[#0ea5e9] h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.methods.evc.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* ZAAD */}
          <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#fb923c] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                Zaad
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {stats.methods.zaad.count} iib
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold font-mono text-white">${stats.methods.zaad.total.toFixed(2)}</span>
              <span className="block text-[9px] font-mono text-slate-500">
                ≈ {(Math.round(stats.methods.zaad.total * 26000)).toLocaleString()} Sh.So
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Saamaynta:</span>
                <span>{stats.methods.zaad.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1">
                <div 
                  className="bg-[#f97316] h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.methods.zaad.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* SAHAL */}
          <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2dd4bf] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#14b8a6]" />
                Sahal
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {stats.methods.sahal.count} iib
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold font-mono text-white">${stats.methods.sahal.total.toFixed(2)}</span>
              <span className="block text-[9px] font-mono text-slate-500">
                ≈ {(Math.round(stats.methods.sahal.total * 26000)).toLocaleString()} Sh.So
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Saamaynta:</span>
                <span>{stats.methods.sahal.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1">
                <div 
                  className="bg-[#14b8a6] h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.methods.sahal.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* CASH */}
          <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Cash (Naqad)
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {stats.methods.cash.count} iib
              </span>
            </div>
            <div>
              <span className="block text-sm font-bold font-mono text-white">${stats.methods.cash.total.toFixed(2)}</span>
              <span className="block text-[9px] font-mono text-slate-500">
                ≈ {(Math.round(stats.methods.cash.total * 26000)).toLocaleString()} Sh.So
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Saamaynta:</span>
                <span>{stats.methods.cash.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1">
                <div 
                  className="bg-slate-450 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.methods.cash.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
