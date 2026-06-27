import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Sale } from './types';

// Let's store Supabase configs locally or read from env.
// This allows users to test with their own Supabase keys directly inside the preview.
const URL_STORAGE_KEY = 'kaab_pos_supabase_url';
const ANON_KEY_STORAGE_KEY = 'kaab_pos_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const localUrl = localStorage.getItem(URL_STORAGE_KEY) || '';
  const localKey = localStorage.getItem(ANON_KEY_STORAGE_KEY) || '';

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey, isCustom: true };
  }

  // Fallback to environment variables
  const envUrl = ((import.meta as any).env.VITE_SUPABASE_URL as string) || '';
  const envKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isCustom: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(URL_STORAGE_KEY, url);
    localStorage.setItem(ANON_KEY_STORAGE_KEY, anonKey);
  } else {
    localStorage.removeItem(URL_STORAGE_KEY);
    localStorage.removeItem(ANON_KEY_STORAGE_KEY);
  }
}

export function createSupabaseInstance(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Syncs a single Sale and its items to Supabase tables.
 * Tables expected in Supabase:
 * 1. `sales`: id (uuid), created_at (timestamptz), customer_name (text), customer_phone (text), subtotal (numeric), discount (numeric), total (numeric), payment_method (text), amount_paid (numeric), change_due (numeric), notes (text)
 * 2. `sales_items`: id (uuid), sale_id (uuid), product_id (text), product_name (text), quantity (int), price (numeric), total (numeric)
 * 3. `inventory`: updates stock if a product matching product_id exists.
 */
export async function syncSaleToSupabase(sale: Sale, supabase: SupabaseClient): Promise<void> {
  // 1. Insert into 'sales' table
  const { error: saleError } = await supabase.from('sales').insert({
    id: sale.id,
    created_at: sale.created_at,
    customer_name: sale.customer_name || null,
    customer_phone: sale.customer_phone || null,
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    payment_method: sale.payment_method,
    amount_paid: sale.amount_paid,
    change_due: sale.change_due,
    notes: sale.notes || null,
  });

  if (saleError) {
    throw new Error(`Error inserting sale: ${saleError.message}`);
  }

  // 2. Insert into 'sales_items' table
  const itemsPayload = sale.items.map((item) => ({
    id: item.id,
    sale_id: item.sale_id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
  }));

  const { error: itemsError } = await supabase.from('sales_items').insert(itemsPayload);

  if (itemsError) {
    // Attempt rollback or leave trace
    throw new Error(`Error inserting sale items: ${itemsError.message}`);
  }

  // 3. Update inventory stock for each product
  for (const item of sale.items) {
    // We fetch current stock, then decrement it
    const { data: currentItem, error: fetchError } = await supabase
      .from('inventory')
      .select('stock')
      .eq('id', item.product_id)
      .single();

    if (!fetchError && currentItem) {
      const newStock = Math.max(0, currentItem.stock - item.quantity);
      await supabase
        .from('inventory')
        .update({ stock: newStock })
        .eq('id', item.product_id);
    } else {
      // If table is named 'products' or similar, attempt fallback or ignore
      // (This avoids breaking the sync if 'inventory' schema is not fully configured)
      console.warn(`Could not find product ${item.product_id} in 'inventory' table:`, fetchError?.message);
    }
  }
}
