import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Coins, Smartphone, FileText, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal';
  customerName: string;
  customerPhone: string;
  onConfirmPayment: (amountPaid: number, changeDue: number, notes: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  total,
  paymentMethod,
  customerName,
  customerPhone,
  onConfirmPayment,
}) => {
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [notes, setNotes] = useState('');
  const [txnId, setTxnId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const exchangeRate = 26000;
  const totalShSo = Math.round(total * exchangeRate);

  // Auto-fill amount paid for mobile payments since they usually pay exactly the total
  useEffect(() => {
    if (paymentMethod !== 'Cash') {
      setAmountPaidStr(total.toString());
    } else {
      setAmountPaidStr('');
    }
    setNotes('');
    setTxnId('');
    setErrorMsg('');
  }, [paymentMethod, total, isOpen]);

  if (!isOpen) return null;

  const amountPaid = parseFloat(amountPaidStr) || 0;
  const changeDue = Math.max(0, amountPaid - total);
  const changeDueShSo = Math.round(changeDue * exchangeRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaid < total) {
      setErrorMsg(`Lacagta la bixiyay (${amountPaid.toFixed(2)}) way ka yar tahay qiimaha la rabo (${total.toFixed(2)})!`);
      return;
    }

    // Embed TxnID in notes if mobile payment
    let finalNotes = notes;
    if (paymentMethod !== 'Cash' && txnId) {
      finalNotes = `[Ref ID: ${txnId}] ${notes}`.trim();
    }

    onConfirmPayment(amountPaid, changeDue, finalNotes);
  };

  // Mobile operator specific descriptions & USSD codes
  const getOperatorDetails = () => {
    switch (paymentMethod) {
      case 'EVC Plus':
        return {
          operator: 'Hormuud Telecom',
          ussd: `*712*SALAAM_ACC*${Math.round(total)}# or *727*MERCHANT*${Math.round(total)}#`,
          color: 'text-sky-400 border-sky-500/20 bg-sky-950/20',
          text: 'EVC Plus waa habka ugu caansan koonfurta iyo bartamaha Soomaaliya.',
        };
      case 'Zaad':
        return {
          operator: 'Telesom',
          ussd: `*889*MERCHANT*${Math.round(total)}#`,
          color: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
          text: 'Zaad waa adeegga rasmiga ah ee Somaliland.',
        };
      case 'Sahal':
        return {
          operator: 'Golis Telecom',
          ussd: `*909*MERCHANT*${Math.round(total)}#`,
          color: 'text-purple-400 border-purple-500/20 bg-purple-950/20',
          text: 'Sahal waa adeegga rasmiga ah ee Puntland.',
        };
      default:
        return null;
    }
  };

  const mobileDetails = getOperatorDetails();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {paymentMethod === 'Cash' ? (
              <Coins className="h-5 w-5 text-emerald-400" />
            ) : (
              <Smartphone className="h-5 w-5 text-sky-400" />
            )}
            <h2 className="text-base font-bold text-white">
              Bixinta Lacagta: <span className="text-emerald-400">{paymentMethod}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Bill Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Macmiilka:</span>
              <span className="font-semibold text-white">
                {customerName ? `${customerName} (${customerPhone || 'Taleefan la\'aan'})` : 'Macmiil caadi ah (Walk-in)'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Wadarta USD:</span>
              <span className="font-mono font-bold text-slate-200">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
              <span>Wadarta Sh.So:</span>
              <span className="font-mono font-bold text-yellow-400">{totalShSo.toLocaleString()} Sh.So</span>
            </div>
          </div>

          {/* Payment Method Specific Guide */}
          {mobileDetails && (
            <div className={`p-3.5 rounded-xl border ${mobileDetails.color} text-xs leading-relaxed`}>
              <p className="font-bold mb-1">{mobileDetails.operator} Instruction:</p>
              <p className="mb-2 text-slate-300 font-mono bg-slate-950/60 p-2 rounded border border-slate-850 select-all">
                Ku dir mobile-ka: {mobileDetails.ussd}
              </p>
              <p className="text-slate-400 text-[11px] italic">{mobileDetails.text}</p>
            </div>
          )}

          {/* Payment Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {paymentMethod === 'Cash' ? 'Lacagta uu ku siiyay (Amount Paid USD)' : 'Hubi wadarta lacagta lagu shubay ($)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold font-mono text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={amountPaidStr}
                  onChange={(e) => {
                    setAmountPaidStr(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-slate-950 text-white font-mono font-bold pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  autoFocus={paymentMethod === 'Cash'}
                />
              </div>
            </div>

            {/* Display Change Due (Haraaga) for Cash */}
            {paymentMethod === 'Cash' && amountPaid > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Haraaga macmiilka (Change Due):</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-400">${changeDue.toFixed(2)}</span>
                </div>
                {changeDue > 0 && (
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Shilling Soomaali:</span>
                    <span className="text-sm font-mono font-bold text-yellow-400">{changeDueShSo.toLocaleString()} Sh.So</span>
                  </div>
                )}
              </div>
            )}

            {/* Transaction ID for mobile */}
            {paymentMethod !== 'Cash' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Lambarka Cadaynta / Transaction ID (Ex: TXN73629)
                </label>
                <input
                  type="text"
                  placeholder="Geli Ref ID ama SMS Code"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                />
              </div>
            )}

            {/* General notes */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Xusuus-qor (Notes)</label>
              <textarea
                placeholder="Ex: Weyb bixin ama hadiyad..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs h-16 resize-none"
              />
            </div>
          </div>

          {/* Errors */}
          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-300 hover:text-white transition-colors bg-slate-850 rounded-xl hover:bg-slate-800 border border-slate-800"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              id="confirm-checkout-btn"
              className="flex-1 py-3 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              <span>Xaqiiji Iibka</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
