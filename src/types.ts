export interface Product {
  id: string; // UUID or unique string
  name: string;
  somali_name: string;
  sku: string;
  price: number; // in USD (default currency)
  somali_price: number; // in Somali Shilling (e.g., 1 USD = 26,000 Sh.So.)
  stock: number;
  category: string;
  image?: string;
  icon_name?: string; // used for custom icons when image is not available
  sync_status?: 'pending_insert' | 'pending_update' | 'synced';
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  id: string; // client generated UUID
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number; // sale-time price in USD
  total: number; // quantity * price
}

export interface Sale {
  id: string; // client generated UUID
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'Cash' | 'EVC Plus' | 'Zaad' | 'Sahal';
  amount_paid: number;
  change_due: number;
  status: 'pending_sync' | 'synced' | 'failed_sync';
  sync_status?: 'pending_insert' | 'pending_update' | 'synced' | 'error';
  synced_at?: string;
  notes?: string;
  sync_error?: string;
}

export interface SyncStats {
  pendingCount: number;
  syncedCount: number;
  lastSyncedAt: string | null;
}
