import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Product } from '../types';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  db: any;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, db }) => {
  const [name, setName] = useState(product.name);
  const [somaliName, setSomaliName] = useState(product.somali_name);
  const [sku, setSku] = useState(product.sku);
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [category, setCategory] = useState(product.category);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceNum = parseFloat(String(price)) || 0;
      const stockNum = parseInt(String(stock), 10) || 0;
      const somaliPriceNum = Math.round(priceNum * 26000);

      // Waxaan ku update-gareynaynaa xogta IndexedDB-ga maxaliga ah
      await db.products.update(product.id, {
        name,
        somali_name: somaliName,
        sku,
        price: priceNum,
        somali_price: somaliPriceNum,
        stock: stockNum,
        category,
        sync_status: 'pending_update', // Waxaan u calaamadeynaynaa in Supabase loo rulo
        updated_at: new Date().toISOString()
      });

      console.log("✅ Alaabta si guul leh ayaa loo bedelay maxali ahaan!");
      onClose(); // Daaqada xir
    } catch (error) {
      console.error("❌ Cilad ayaa dhacday marka alaabta la bedelayay:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl w-full max-w-md text-white shadow-2xl relative animate-fade-in">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Wax ka bedel Alaabta</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Magaca Alaabta (English) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Magaca Alaabta (English)</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Magaca Alaabta (Soomaali) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Magaca Alaabta (Soomaali)</label>
            <input 
              type="text" 
              required
              value={somaliName} 
              onChange={(e) => setSomaliName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* SKU */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">SKU</label>
              <input 
                type="text" 
                required
                value={sku} 
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Qaybta (Category) */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Qaybta (Category)</label>
              <input 
                type="text" 
                required
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Qiimaha ($) */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Qiimaha ($)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={price} 
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Tirada Stock-ga */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Tirada Taala (Stock)</label>
              <input 
                type="number" 
                required
                value={stock} 
                onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Somali Shilling conversion hint */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg text-[11px] text-slate-400 flex justify-between items-center">
            <span>Qiimaha Sh.So (Qiyaas):</span>
            <span className="font-mono text-emerald-400 font-bold">
              {(Math.round((parseFloat(String(price)) || 0) * 26000)).toLocaleString()} Sh.So
            </span>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-750 transition-colors text-xs font-semibold"
            >
              Ka noqo
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-xs font-bold"
            >
              Diiwángeli
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
