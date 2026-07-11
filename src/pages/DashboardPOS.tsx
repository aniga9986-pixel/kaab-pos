import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductCatalog } from '../components/ProductCatalog';
import { EditProductModal } from '../components/EditProductModal';
import { Cart } from '../components/Cart';
import { CheckoutModal } from '../components/CheckoutModal';
import { SalesHistory } from '../components/SalesHistory';
import { DailySales } from '../components/DailySales';
import { SupabaseSettings } from '../components/SupabaseSettings';
import { localDB, db } from '../db';
import { useSyncEngine } from '../hooks/useSyncEngine';
import { createSupabaseInstance, syncSaleToSupabase } from '../supabaseClient';
import { Product, CartItem, Sale, SaleItem, SyncStats } from '../types';
import { syncPendingSales } from '../syncEngine';
import { Sparkles, ShoppingBag, History, AlertCircle, CheckCircle, User } from 'lucide-react';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function DashboardPOS() {
  const navigate = useNavigate();

  // Database and UI state
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userName, setUserName] = useState('Ganacsade');
  
  // Tabs: 'pos' (Point of Sale) or 'history' (Taariikhda Iibka)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Network and Sync using useSyncEngine custom hook
  const syncEngine = useSyncEngine(db);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Connection settings
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState<{
    paymentMethod: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal';
    customerName: string;
    customerPhone: string;
    discount: number;
    subtotal: number;
    total: number;
  } | null>(null);

  // Restock modal states
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(50);

  // Edit product modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Subscription / Lease states
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaab_pos_subscribed');
    return saved !== 'false';
  });
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string>(() => {
    const saved = localStorage.getItem('kaab_pos_expires_at');
    return saved || '2027-01-01T00:00:00Z';
  });

  const handleToggleSubscription = (val: boolean) => {
    setIsSubscribed(val);
    localStorage.setItem('kaab_pos_subscribed', String(val));
    if (!val) {
      showTemporaryMessage('error', 'DIGNIIN: Kiradii Kaab POS waa lagaa gubay/xiray!');
    } else {
      showTemporaryMessage('success', 'GUUL: Kiradii Kaab POS dib ayaa loo furay!');
    }
  };

  const handleUpdateExpiresAt = (val: string) => {
    setSubscriptionExpiresAt(val);
    localStorage.setItem('kaab_pos_expires_at', val);
    
    // Auto-compute isSubscribed based on date
    const expired = new Date(val).getTime() < new Date().getTime();
    if (expired) {
      setIsSubscribed(false);
      localStorage.setItem('kaab_pos_subscribed', 'false');
      showTemporaryMessage('error', 'Cillad: Muddada kirada waa dhamaatay!');
    } else {
      setIsSubscribed(true);
      localStorage.setItem('kaab_pos_subscribed', 'true');
      showTemporaryMessage('success', 'GUUL: Muddada kirada waa la cusbooneysiiyay!');
    }
  };

  // Extract user info from session on load
  useEffect(() => {
    const sessionStr = localStorage.getItem('kaab_pos_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Load products and sales from IndexedDB on startup
  const loadData = async () => {
    try {
      await localDB.init();
      const loadedProducts = await localDB.getAllProducts();
      const loadedSales = await localDB.getAllSales();
      setProducts(loadedProducts);
      setSales(loadedSales);
    } catch (err) {
      console.error('Failure initializing database or loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if Supabase keys are configured and active
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
        console.warn('Supabase test request returned error:', error);
        setIsSupabaseConnected(false);
      }
    } catch (e) {
      console.warn('Could not ping Supabase instance:', e);
      setIsSupabaseConnected(false);
    }
  };

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  // Monitor and synchronize network status and sync activity from useSyncEngine custom hook
  useEffect(() => {
    setIsOnline(syncEngine.isOnline);
    if (syncEngine.isOnline) {
      showTemporaryMessage('info', 'Xiriirkii Internet-ka waa soo laabtay! Isku dayaya inaan midayno xogta...');
    } else {
      showTemporaryMessage('error', 'Internet-kii waa go\'ay! Barnaamijku wuxuu hadda ku shaqaynayaa "Offline-Mode".');
    }
  }, [syncEngine.isOnline]);

  useEffect(() => {
    setIsSyncing(syncEngine.isSyncing);
  }, [syncEngine.isSyncing]);

  // Auto Sync trigger on connection restore
  useEffect(() => {
    const effectiveOnline = isOnline && !isSimulatingOffline;
    if (effectiveOnline) {
      triggerAutomaticSync();
    }
  }, [isOnline, isSimulatingOffline]);

  const showTemporaryMessage = (type: 'success' | 'info' | 'error', text: string) => {
    setSyncMessage({ type, text });
    setTimeout(() => {
      setSyncMessage(null);
    }, 4500);
  };

  // Sync function that updates both local db statuses and optionally pushes to Supabase
  const triggerAutomaticSync = async () => {
    const effectiveOnline = isOnline && !isSimulatingOffline;
    if (!effectiveOnline || isSyncing) return;

    const pendingBefore = await localDB.getPendingSyncSales();
    if (pendingBefore.length === 0) return;

    setIsSyncing(true);

    try {
      // Execute the consolidated, non-blocking sync engine
      await syncPendingSales();

      // Retrieve remaining pending sales to check if any failed
      const pendingAfter = await localDB.getPendingSyncSales();
      const failedSales = pendingAfter.filter(s => s.status === 'failed_sync');
      const syncedCount = pendingBefore.length - pendingAfter.length;

      if (syncedCount > 0) {
        showTemporaryMessage('success', `Midaynta guul: ${syncedCount} iib oo dhowaan offline ahaa ayaa lagu shubay Supabase.`);
      }
      
      if (failedSales.length > 0) {
        const firstError = failedSales[0].sync_error || '';
        if (firstError.includes('relation "sales" does not exist')) {
          showTemporaryMessage('error', 'Cillad: Shaxda "sales" kama jirto Supabase. Guji icon-ka Settings si aad u abuurto!');
        } else if (firstError.toLowerCase().includes('row-level security') || 
                   firstError.toLowerCase().includes('row level security') || 
                   firstError.toLowerCase().includes('security policy')) {
          showTemporaryMessage('error', 'Cillad RLS: Supabase wuxuu u baahan yahay in RLS laga damiyo. Ka eeg xalka Settings-ka ama Taariikhda Iibka.');
        } else {
          showTemporaryMessage('error', `Cillad midayn: ${failedSales.length} iib ah waxaa ku dhacay khalad. Ka eeg Settings.`);
        }
      }

      await loadData();
    } catch (err) {
      console.warn('Synchronization process encountered warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    const effectiveOnline = isOnline && !isSimulatingOffline;
    if (!effectiveOnline) {
      alert('Ma midayn kartid hadda maxaa yeelay internet-ku wuu ka go\'an yahay!');
      return;
    }
    showTemporaryMessage('info', 'Midayntii ayaa la bilaabay...');
    await syncEngine.startSync();
    await loadData();
  };

  const handleLogout = async () => {
    if (confirm('Ma xaqiijinaysaa inaad ka baxdo dukaanka?')) {
      const supabase = createSupabaseInstance();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn(e);
        }
      }
      localStorage.removeItem('kaab_pos_session');
      navigate('/login');
    }
  };

  const handleAddCustomProduct = async (newProductFields: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductFields,
      id: `p-${generateUUID().slice(0, 8)}`,
    };

    try {
      await localDB.saveProduct(newProduct);
      showTemporaryMessage('success', `Waxaa lagu daray catalog-ga: ${newProduct.somali_name}`);
      await loadData();
    } catch (err) {
      console.error('Error adding custom product:', err);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingProduct || restockAmount <= 0) return;

    try {
      const updatedProduct = {
        ...restockingProduct,
        stock: restockingProduct.stock + restockAmount,
      };
      await localDB.saveProduct(updatedProduct);
      showTemporaryMessage('success', `Guul: Stock-ga "${restockingProduct.somali_name}" waxaa lagu daray ${restockAmount} xabo!`);
      setRestockingProduct(null);
      setRestockAmount(50);
      await loadData();
    } catch (err) {
      console.error('Error restocking product:', err);
      alert('Cilad ayaa dhacday intii stock-ga la kordhinayay.');
    }
  };

  const handleAddToCart = (product: Product) => {
    const currentCartItem = cart.find((item) => item.product.id === product.id);
    const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;

    if (currentQuantity >= product.stock) {
      alert(`Waan ka xunnahay, alaabtan stock-keedu wuu dhamaaday ama intaa ka badan ma hayno (${product.stock} xabo).`);
      return;
    }

    if (currentCartItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      alert(`Ma jiro stock ku filan! Kaliya ${item.product.stock} xabo ayaa haray.`);
      return;
    }

    setCart(
      cart.map((i) => (i.product.id === productId ? { ...i, quantity: newQuantity } : i))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckoutTrigger = (
    paymentMethod: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal',
    customerName: string,
    customerPhone: string,
    discount: number
  ) => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const total = Math.max(0, subtotal - discount);

    setCheckoutPayload({
      paymentMethod,
      customerName,
      customerPhone,
      discount,
      subtotal,
      total,
    });
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = async (amountPaid: number, changeDue: number, notes: string) => {
    if (!checkoutPayload || cart.length === 0) return;

    const saleId = generateUUID();
    const createdAt = new Date().toISOString();

    const saleItems: SaleItem[] = cart.map((item) => ({
      id: generateUUID(),
      sale_id: saleId,
      product_id: item.product.id,
      product_name: item.product.somali_name,
      quantity: item.quantity,
      price: item.product.price,
      total: item.product.price * item.quantity,
    }));

    const newSale: Sale = {
      id: saleId,
      created_at: createdAt,
      customer_name: checkoutPayload.customerName,
      customer_phone: checkoutPayload.customerPhone,
      items: saleItems,
      subtotal: checkoutPayload.subtotal,
      discount: checkoutPayload.discount,
      total: checkoutPayload.total,
      payment_method: checkoutPayload.paymentMethod,
      amount_paid: amountPaid,
      change_due: changeDue,
      status: 'pending_sync',
      notes,
    };

    try {
      await localDB.saveSale(newSale);
      showTemporaryMessage(
        'success',
        `Iibka waa la kaydiyay deegaanka! Haraaga: $${changeDue.toFixed(2)}`
      );

      setCart([]);
      setIsCheckoutOpen(false);
      setCheckoutPayload(null);

      await loadData();
      triggerAutomaticSync();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Waan ka xunnahay, cilad ayaa dhacday intii la kaydinayay iibka.');
    }
  };

  const handleSyncIndividualSale = async (sale: Sale) => {
    if (isSyncing) return;
    setIsSyncing(true);
    const supabase = createSupabaseInstance();

    try {
      if (supabase) {
        await syncSaleToSupabase(sale, supabase);
        await localDB.updateSaleSyncStatus(sale.id, 'synced', new Date().toISOString());
        showTemporaryMessage('success', 'Iibka guul ayaa loogu sync-gareeyay Supabase!');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await localDB.updateSaleSyncStatus(sale.id, 'synced', new Date().toISOString());
        showTemporaryMessage('success', '[Demo Mode] Iibka waa la calaamadeeyay Synced!');
      }
      await loadData();
    } catch (err) {
      console.error('Individual sync failure:', err);
      alert('Midayntu way fashilantay. Hubi schema-ga Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await localDB.clearAllSales();
      showTemporaryMessage('info', 'Taariikhda iibka ee deegaanka waa la faaruqiyay.');
      await loadData();
    } catch (err) {
      console.error('Error resetting database sales:', err);
    }
  };

  const pendingCount = sales.filter((s) => s.status === 'pending_sync').length;
  const syncedCount = sales.filter((s) => s.status === 'synced').length;
  const syncStats: SyncStats = {
    pendingCount,
    syncedCount,
    lastSyncedAt: sales.find((s) => s.status === 'synced')?.synced_at || null,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* HEADER SECTION */}
      <Header
        isOnline={isOnline}
        isSimulatingOffline={isSimulatingOffline}
        toggleOfflineSimulation={() => setIsSimulatingOffline(!isSimulatingOffline)}
        syncStats={syncStats}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onLogout={handleLogout}
      />

      {/* FLOATING SYNC STATUS BANNER */}
      {syncMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-bounce">
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
            syncMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : syncMessage.type === 'error'
              ? 'bg-red-950/90 border-red-500/30 text-red-300'
              : 'bg-slate-900/90 border-slate-750 text-slate-300'
          }`}>
            {syncMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{syncMessage.text}</p>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* User Greet bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold">
              Khasajirka furan: <span className="text-emerald-400 font-bold">{userName}</span>
            </p>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Saacadda: <span className="text-slate-300">{new Date().toLocaleDateString('so-SO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        {/* Navigation Tabs (Single Screen layout bento tabs) */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-center">
          <button
            onClick={() => setActiveTab('pos')}
            id="tab-pos-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            <span>Iibka Cusub (Point of Sale)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            id="tab-history-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4.5 w-4.5" />
            <span>Taariikhda & Midaynta ({sales.length})</span>
          </button>
        </div>

        {/* WORKSPACE VIEW DISTRIBUTION */}
        <div className="flex-1">
          {activeTab === 'pos' ? (
            /* Left/Right Grid Layout for Cashier POS panel */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Product Search & Cards */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <ProductCatalog
                  products={products}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onAddCustomProduct={handleAddCustomProduct}
                  onOrderMore={setRestockingProduct}
                  isSubscribed={isSubscribed}
                  subscriptionExpiresAt={subscriptionExpiresAt}
                  onEditProduct={setEditingProduct}
                />
              </div>

              {/* Right Column: Checkout Cart */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <Cart
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onCheckout={handleCheckoutTrigger}
                  isSubscribed={isSubscribed}
                />
              </div>

            </div>
          ) : (
            /* Sales History Audit / Sync Control Panel */
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
              <DailySales sales={sales} />

              <SalesHistory
                sales={sales}
                isOnline={isOnline && !isSimulatingOffline}
                onClearHistory={handleClearHistory}
                onSyncSale={handleSyncIndividualSale}
                isSyncing={isSyncing}
              />
            </div>
          )}
        </div>
      </main>

      {/* FOOTER STATS */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© {new Date().getFullYear()} Kaab POS - Somalia Localized & Offline Ready.</p>
          <div className="flex gap-4">
            <span>Dhiman (Pending): <strong className="text-amber-400">{pendingCount}</strong></span>
            <span>La Midayay (Synced): <strong className="text-emerald-400">{syncedCount}</strong></span>
          </div>
        </div>
      </footer>

      {/* CHECKOUT POPUP MODAL */}
      {checkoutPayload && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutPayload(null);
          }}
          subtotal={checkoutPayload.subtotal}
          discount={checkoutPayload.discount}
          total={checkoutPayload.total}
          paymentMethod={checkoutPayload.paymentMethod}
          customerName={checkoutPayload.customerName}
          customerPhone={checkoutPayload.customerPhone}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* RESTOCK POPUP MODAL */}
      {restockingProduct && (
        <div id="restock-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div id="restock-modal-content" className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">🔄</span> Ku dar Stock (Dalbo Alaab)
              </h3>
              <button
                onClick={() => setRestockingProduct(null)}
                className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-700/40 transition-colors cursor-pointer"
              >
                <span className="sr-only">Xidh</span>
                <span className="text-lg">✕</span>
              </button>
            </div>

            {/* Product Details info box */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Magaca Alaabta:</span>
                <span className="font-bold text-white text-right">{restockingProduct.somali_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">English Name:</span>
                <span className="text-slate-300 text-right italic">{restockingProduct.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">SKU:</span>
                <span className="font-mono text-slate-300 text-right">{restockingProduct.sku}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-800/60 pt-2 mt-2">
                <span className="text-slate-400">Stock-ga hadda yaala:</span>
                <span className="font-bold font-mono text-amber-400 text-right">{restockingProduct.stock} xabo</span>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Tirada aad rabto inaad ku darto (Amount to add)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 text-slate-100 font-mono font-bold text-center pl-4 pr-4 py-3 rounded-xl border border-slate-800 focus:border-amber-500 focus:outline-none transition-all shadow-inner text-base"
                    placeholder="Tusaale: 50"
                  />
                </div>
              </div>

              {/* Presets buttons to click quickly */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRestockAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      restockAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-sm py-3 rounded-xl border border-slate-700/40 transition-colors cursor-pointer"
                >
                  Iska daa
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
                >
                  Kaydi & Ku dar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT POPUP MODAL */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            loadData();
          }}
          db={db}
        />
      )}

      {/* SUPABASE CONNECTION CREDENTIALS PANEL */}
      <SupabaseSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigChanged={async () => {
          await checkSupabaseConnection();
          triggerAutomaticSync();
        }}
        isSupabaseConnected={isSupabaseConnected}
        isSubscribed={isSubscribed}
        expiresAt={subscriptionExpiresAt}
        onToggleSubscription={handleToggleSubscription}
        onUpdateExpiresAt={handleUpdateExpiresAt}
      />
    </div>
  );
}
