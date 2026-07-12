import React, { useState } from 'react';
import { Search, Plus, Sparkles, Box, AlertTriangle, PlusCircle, Edit } from 'lucide-react';
import { Product, CartItem } from '../types';

interface ProductCatalogProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onAddCustomProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onOrderMore: (product: Product) => void;
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  onEditProduct?: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  cart,
  onAddToCart,
  onAddCustomProduct,
  onOrderMore,
  isSubscribed,
  subscriptionExpiresAt,
  onEditProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Dhammaan');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Form states for new product
  const [newName, setNewName] = useState('');
  const [newSomaliName, setNewSomaliName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('Raashin Core');

  // Extract unique categories
  const categories = ['Dhammaan', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.somali_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Dhammaan' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId: string) => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSomaliName || !newPrice || !newStock) return;

    const priceNum = parseFloat(newPrice);
    const stockNum = parseInt(newStock, 10);
    const skuVal = newSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    // Somali Shilling conversion (1 USD = 26,000 Sh.So.)
    const somaliPriceNum = Math.round(priceNum * 26000);

    await onAddCustomProduct({
      name: newName,
      somali_name: newSomaliName,
      sku: skuVal,
      price: priceNum,
      somali_price: somaliPriceNum,
      stock: stockNum,
      category: newCategory,
    });

    // Reset form
    setNewName('');
    setNewSomaliName('');
    setNewSku('');
    setNewPrice('');
    setNewStock('');
    setIsAddingProduct(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Search and Add Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi alaab (Magac, Somali, SKU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:outline-none text-sm transition-all shadow-inner"
          />
        </div>
        <button
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Ku dar Alaab cusub</span>
        </button>
      </div>

      {/* Add Product Collapsible Panel */}
      {isAddingProduct && (
        <form
          onSubmit={handleCreateProduct}
          className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl mb-5 space-y-3 transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-white border-b border-slate-700 pb-1.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Diiwan-geli Alaab Cusub (Koorow ama Offline)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Magaca (English)</label>
              <input
                type="text"
                required
                placeholder="Ex: Rice Basmati 1kg"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Magaca (Soomaali)</label>
              <input
                type="text"
                required
                placeholder="Ex: Bariis Baasmasoti 1kg"
                value={newSomaliName}
                onChange={(e) => setNewSomaliName(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SKU (Option)</label>
              <input
                type="text"
                placeholder="Ex: BAR-005"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Qaybta (Category)</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Raashin Core">Raashin Core (Food)</option>
                <option value="Cabitaano & Shaah">Cabitaano & Shaah</option>
                <option value="Hilib & Kaluun">Hilib & Kaluun</option>
                <option value="Nadaafadda">Nadaafadda (Hygiene)</option>
                <option value="Uunsi & Basbaas">Uunsi & Basbaas</option>
                <option value="Kuwo kale">Kuwo kale (Others)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Qiimaha USD ($)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="Ex: 2.50"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stock-ga Yaala</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Ex: 50"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Ka noqo
            </button>
            <button
              type="submit"
              className="bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer"
            >
              Kaydi Alaabta
            </button>
          </div>
        </form>
      )}

      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-lg shadow-emerald-500/15'
                : 'bg-slate-800 text-slate-400 border-slate-700/70 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            {cat === 'Dhammaan' ? 'Dhammaan Alaabta' : cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px]">
        {products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-slate-850 rounded-2xl text-center bg-slate-950/25 my-auto max-w-md mx-auto">
            <span className="text-5xl mb-4 select-none">📦</span>
            <h3 className="text-white font-bold text-base mb-1">Dukaanku waa maran yahay (Clean Slate)</h3>
            <p className="text-slate-400 text-xs max-w-xs mx-auto mb-5 leading-relaxed">
              Ma helin wax alaab ah deegaanka qalabkaaga (IndexedDB). Fadlan ku dar alaabtaada gaarka ah si aad u bilowdo iibinta.
            </p>
            <button 
              type="button"
              onClick={() => setIsAddingProduct(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <PlusCircle className="h-4 w-4" />
              Diiwángeli Alaab Cusub
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-16">
            <Box className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm font-medium">Wax alaab ah oo la helay ma jiraan.</p>
            <p className="text-xs text-slate-600 mt-1">Isku day inaad raadiso erey kale.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const inCartCount = getCartQuantity(product.id);
            const isLowStock = product.stock <= 5;
            const isMediumStock = product.stock > 5 && product.stock <= 15;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product.id}
                className={`flex flex-col justify-between bg-slate-800/40 rounded-xl border p-4 transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] relative group ${
                  inCartCount > 0 ? 'ring-2 ring-emerald-500/50 bg-slate-800/70 border-emerald-500/40' : 'border-slate-800'
                } ${!isSubscribed ? 'subscription-locked' : ''}`}
              >
                {/* Cart Badge */}
                {inCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-bold text-xs h-5.5 w-5.5 rounded-full flex items-center justify-center animate-fade-in shadow-md">
                    {inCartCount}
                  </span>
                )}

                {/* Category & Stock Warning */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 font-medium">
                      {product.category}
                    </span>
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct(product);
                        }}
                        className="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Wax ka bedel alaabta"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {isOutOfStock ? (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      Dhamaaday
                    </span>
                  ) : isLowStock ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Wuu dhamaanayaa
                    </span>
                  ) : null}
                </div>

                {/* Product Name & SKU */}
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {product.somali_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-normal line-clamp-1 italic">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Stock Level Slider */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Stock yaala:</span>
                    <span className={`font-mono font-bold ${
                      isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {product.stock} xabo
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOutOfStock ? 'w-0 bg-red-500' : isLowStock ? 'bg-amber-500 w-1/4' : isMediumStock ? 'bg-yellow-400 w-1/2' : 'bg-emerald-500 w-full'
                      }`}
                      style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Price and Add button */}
                <div id={`product-card-action-${product.id}`} className="product-action flex items-center justify-between mt-auto pt-2 border-t border-slate-800/60 gap-2">
                  <div>
                    <div className="text-base font-bold text-white tracking-tight font-mono">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {product.somali_price.toLocaleString()} Sh.So
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {isLowStock && !isOutOfStock && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm low-stock-alert-blink select-none">
                        ⚠️ {product.stock} Kaliya ayaa haray!
                      </span>
                    )}

                    <div className="action-buttons-container flex flex-row items-center gap-2">
                      {/* 1. Badhanka caadiga ah ee Iibso */}
                      <button
                        id={`btn-iibso-original-${product.id}`}
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock || !isSubscribed}
                        className={`btn-iibso-original p-2 px-3 rounded-lg flex items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer ${
                          isOutOfStock || !isSubscribed
                            ? 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/10'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ Iibso</span>
                      </button>

                      {/* 2. Badhanka 'Ku dar' oo dhinac yaal haddii stock-gu yahay 5 ama ka yar */}
                      {isLowStock && (
                        <button
                          id={`btn-ku-dar-side-${product.id}`}
                          onClick={() => onOrderMore(product)}
                          disabled={!isSubscribed}
                          title={isSubscribed ? "Dalbo alaab kale (Restock)" : "Kira la'aan"}
                          className={`btn-ku-dar-side font-bold text-xs p-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md cursor-pointer whitespace-nowrap ${
                            !isSubscribed
                              ? 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10'
                          }`}
                        >
                          <span>🔄 Ku dar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lock overlay if subscription is locked */}
                {!isSubscribed && (
                  <div className="lock-overlay">
                    <span className="lock-overlay-span flex flex-col items-center gap-1 text-center">
                      <span>🔒 Kirada waa lagaa gubay. La xiriir Kaab POS</span>
                      {subscriptionExpiresAt && (
                        <span className="text-[11px] opacity-90 font-mono font-normal border-t border-white/20 pt-1 mt-1 block">
                          Ku eg: {new Date(subscriptionExpiresAt).toLocaleDateString()} {new Date(subscriptionExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </span>
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
