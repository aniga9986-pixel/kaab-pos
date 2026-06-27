import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, User, Percent, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (paymentMethod: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal', customerName: string, customerPhone: string, discount: number) => void;
}

export const Cart: React.FC<CartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountVal, setDiscountVal] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = parseFloat(discountVal) || 0;
  const total = Math.max(0, subtotal - discount);

  // Exchange rate Somali Shilling: 1 USD = 26,000 Sh.So.
  const exchangeRate = 26000;
  const totalShSo = Math.round(total * exchangeRate);

  const handleCheckoutClick = (method: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal') => {
    if (cart.length === 0) return;
    onCheckout(method, customerName, customerPhone, discount);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white">Cart-ka (Alaabta la doortay)</h2>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            id="clear-cart-btn"
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Faaruqi</span>
          </button>
        )}
      </div>

      {/* Customer Information (Macaamiil) */}
      <div className="bg-slate-800/20 border border-slate-800 p-3 rounded-xl mb-4 space-y-2">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-emerald-400" />
          <span>Macluumaadka Macmiilka (Ikhtiyaari)</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Magaca Macmiilka"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-slate-900/60 text-slate-100 placeholder-slate-500 text-xs px-2.5 py-2 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Taleefanka (Ex: 061...)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-slate-900/60 text-slate-100 placeholder-slate-500 text-xs px-2.5 py-2 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4 min-h-[180px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
            <ShoppingCart className="h-10 w-10 text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium">Cart-gu waa maran yahay.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Guji 'Iibso' si aad alaabta halkan ugu darto.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between bg-slate-800/30 border border-slate-800/80 p-3 rounded-xl hover:border-slate-700/60 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {item.product.somali_name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">${item.product.price.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(item.product.price * item.quantity).toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-2 text-xs font-mono font-bold text-white min-w-[20px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  disabled={item.quantity >= item.product.stock}
                  className={`p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
                    item.quantity >= item.product.stock ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => onRemoveFromCart(item.product.id)}
                className="ml-2.5 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Ka saar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals & Checkout Panel */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        {/* Discount Input */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Percent className="h-3 w-3 text-emerald-400" />
            Dhimis (Discount USD)
          </span>
          <input
            type="number"
            min="0"
            max={subtotal}
            placeholder="0.00"
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 font-mono text-right rounded px-2 py-1 w-20 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Calculations display */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Wadarta guud (Subtotal):</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-red-400 font-medium">
              <span>Dhimis (Discount):</span>
              <span className="font-mono">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-300 font-semibold pt-1 border-t border-slate-800/50">
            <span>Qiimaha kama dambaysta (Total USD):</span>
            <span className="font-mono text-emerald-400 font-bold">${total.toFixed(2)}</span>
          </div>
          {/* Somali Shilling total */}
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Qiimaha Shilling Soomaali:</span>
            <span className="font-mono text-yellow-400 font-bold">
              {totalShSo.toLocaleString()} Sh.So
            </span>
          </div>
        </div>

        {/* Warning if stock is critical */}
        {cart.some((item) => item.product.stock <= item.quantity) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400 leading-normal">
              Waxaa jira alaab aad ka qaadanayso stock-ga oo dhan.
            </p>
          </div>
        )}

        {/* Payment Methods Grid (Somali Local Payments) */}
        <div>
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Dooro Habka Lacag Bixinta (Checkout)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckoutClick('Cash')}
              disabled={cart.length === 0}
              id="pay-cash-btn"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-850 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 font-bold shadow-md shadow-emerald-500/10'
              }`}
            >
              <span className="text-xs">Kaash (Cash)</span>
              <span className="text-[10px] font-normal opacity-80">Gacan ku dhiib</span>
            </button>

            <button
              onClick={() => handleCheckoutClick('EVC Plus')}
              disabled={cart.length === 0}
              id="pay-evc-btn"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-850 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : 'bg-sky-600 text-white border-sky-500 hover:bg-sky-500 font-bold'
              }`}
            >
              <span className="text-xs">EVC Plus</span>
              <span className="text-[10px] font-normal opacity-80">Hormuud</span>
            </button>

            <button
              onClick={() => handleCheckoutClick('Zaad')}
              disabled={cart.length === 0}
              id="pay-zaad-btn"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-850 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 font-bold'
              }`}
            >
              <span className="text-xs">Zaad</span>
              <span className="text-[10px] font-normal opacity-80">Telesom</span>
            </button>

            <button
              onClick={() => handleCheckoutClick('Sahal')}
              disabled={cart.length === 0}
              id="pay-sahal-btn"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-850 border-slate-800/40 text-slate-600 cursor-not-allowed'
                  : 'bg-purple-600 text-white border-purple-500 hover:bg-purple-500 font-bold'
              }`}
            >
              <span className="text-xs">Sahal</span>
              <span className="text-[10px] font-normal opacity-80 font-normal">Golis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
