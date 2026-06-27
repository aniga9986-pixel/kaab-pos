import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { Cart } from './components/Cart';
import { CheckoutModal } from './components/CheckoutModal';
import { SalesHistory } from './components/SalesHistory';
import { SupabaseSettings } from './components/SupabaseSettings';
import { localDB } from './db';
import { createSupabaseInstance, syncSaleToSupabase } from './supabaseClient';
import { Product, CartItem, Sale, SaleItem, SyncStats } from './types';
import { Sparkles, ShoppingBag, History, Database, AlertCircle, CheckCircle } from 'lucide-react';

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

export default function App() {
  // Database and UI state
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Tabs: 'pos' (Point of Sale) or 'history' (Taariikhda Iibka)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Network and Sync
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
      // Small test request to verify connection
      const { error } = await supabase.from('inventory').select('id').limit(1);
      // If error is 404, the tables don't exist yet, but connection is technically working
      if (!error || error.code === 'PGRST116' || (error as any).status === 406 || (error as any).status === 404) {
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

  // Monitor hardware network connections
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      showTemporaryMessage('info', 'Xiriirkii Internet-ka waa soo laabtay! Isku dayaya inaan midayno xogta...');
    };
    const goOffline = () => {
      setIsOnline(false);
      showTemporaryMessage('error', 'Internet-kii waa go\'ay! Barnaamijku wuxuu hadda ku shaqaynayaa "Offline-Mode".');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

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

    const pending = await localDB.getPendingSyncSales();
    if (pending.length === 0) return;

    setIsSyncing(true);
    const supabase = createSupabaseInstance();

    try {
      if (supabase) {
        // Real Supabase Synchronization
        let syncedCount = 0;
        for (const sale of pending) {
          try {
            await syncSaleToSupabase(sale, supabase);
            await localDB.updateSaleSyncStatus(sale.id, 'synced', new Date().toISOString());
            syncedCount++;
          } catch (itemError: any) {
            console.error(`Sync error for transaction ${sale.id}:`, itemError);
            // If table schema is missing, inform the developer/user gently
            if (itemError.message && itemError.message.includes('relation "sales" does not exist')) {
              showTemporaryMessage('error', 'Cillad: Shaxda "sales" kama jirto Supabase. Guji icon-ka Settings si aad u abuurto!');
              throw itemError;
            }
          }
        }
        if (syncedCount > 0) {
          showTemporaryMessage('success', `Midaynta guul: ${syncedCount} iib oo dhowaan offline ahaa ayaa lagu shubay Supabase.`);
        }
      } else {
        // Simulated / Local fallback Sync
        await new Promise((resolve) => setTimeout(resolve, 1500));
        for (const sale of pending) {
          await localDB.updateSaleSyncStatus(sale.id, 'synced', new Date().toISOString());
        }
        showTemporaryMessage('success', `[Demo Sync] ${pending.length} iib ah ayaa lagu kaydiyay xogta guud ee synced!`);
      }

      // Reload local data to refresh sync statuses
      await loadData();
    } catch (err) {
      console.error('Synchronization process encountered errors:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual trigger wrapper
  const handleManualSync = async () => {
    const effectiveOnline = isOnline && !isSimulatingOffline;
    if (!effectiveOnline) {
      alert('Ma midayn kartid hadda maxaa yeelay internet-ku wuu ka go\'an yahay!');
      return;
    }
    showTemporaryMessage('info', 'Midayntii ayaa la bilaabay...');
    await triggerAutomaticSync();
  };

  // Add Custom Product to IndexedDB Catalog while offline/online
  const handleAddCustomProduct = async (newProductFields: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductFields,
      id: `p-${generateUUID().slice(0, 8)}`,
    };

    try {
      await localDB.saveProduct(newProduct);
      showTemporaryMessage('success', `Waxaa lagu daray catalog-ga: ${newProduct.somali_name}`);
      await loadData(); // reload list
    } catch (err) {
      console.error('Error adding custom product:', err);
    }
  };

  // Cart operations
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

  // Trigger Checkout view with current calculations
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

  // Confirm payment & save transaction offline-first
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
      status: 'pending_sync', // Default offline flag
      notes,
    };

    try {
      // 1. Save to local IndexedDB (Deducts stock automatically)
      await localDB.saveSale(newSale);

      // 2. Display success toast
      showTemporaryMessage(
        'success',
        `Iibka waa la kaydiyay deegaanka! Haraaga: $${changeDue.toFixed(2)}`
      );

      // 3. Clear shopping state & close modals
      setCart([]);
      setIsCheckoutOpen(false);
      setCheckoutPayload(null);

      // 4. Reload DB items to refresh stock levels & transaction list in UI
      await loadData();

      // 5. Fire background sync automatically
      triggerAutomaticSync();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Waan ka xunnahay, cilad ayaa dhacday intii la kaydinayay iibka.');
    }
  };

  // Force individual manual sync for a specific history item
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

  // Clear local sales history
  const handleClearHistory = async () => {
    try {
      await localDB.clearAllSales();
      showTemporaryMessage('info', 'Taariikhda iibka ee deegaanka waa la faaruqiyay.');
      await loadData();
    } catch (err) {
      console.error('Error resetting database sales:', err);
    }
  };

  // Compute pending stats
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
                />
              </div>

            </div>
          ) : (
            /* Sales History Audit / Sync Control Panel */
            <div className="max-w-3xl mx-auto w-full">
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

      {/* SUPABASE CONNECTION CREDENTIALS PANEL */}
      <SupabaseSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigChanged={async () => {
          await checkSupabaseConnection();
          triggerAutomaticSync();
        }}
        isSupabaseConnected={isSupabaseConnected}
      />
    </div>
  );
}
