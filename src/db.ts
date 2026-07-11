import Dexie, { type Table } from 'dexie';
import { Product, Sale } from './types';

// Define the Dexie Database Schema and Class
export class KaabPOSDexie extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;

  constructor() {
    super('KaabPOSDB_Dexie');
    this.version(1).stores({
      products: 'id, name, sku, category',
      sales: 'id, status, created_at, payment_method'
    });
    this.version(2).stores({
      products: 'id, name, sku, category, sync_status',
      sales: 'id, status, created_at, payment_method, sync_status'
    });
    this.version(3).stores({
      products: 'id, name, sku, category, sync_status',
      sales: 'id, status, created_at, payment_method, sync_status, is_dirty'
    });
  }
}

export const dexieDB = new KaabPOSDexie();
export const db = dexieDB; // Alias for user's requested import name

// Seed standard products for Somali retail (Bariis, Baasto, Saliid, Canjeero, Hilib, etc.)
const INITIAL_PRODUCTS: Product[] = [];

// Helper class wrapper maintaining the exact API used by DashboardPOS
export class POSDatabase {
  async init(): Promise<void> {
    await dexieDB.open();
    await this.seedProductsIfEmpty();
  }

  private async seedProductsIfEmpty(): Promise<void> {
    const count = await dexieDB.products.count();
    if (count > 0) return;

    await dexieDB.products.bulkPut(INITIAL_PRODUCTS);
    console.log('Dexie DB seeded successfully with initial Somali products.');
  }

  // --- PRODUCTS / INVENTORY METHODS ---

  async getAllProducts(): Promise<Product[]> {
    return await dexieDB.products.toArray();
  }

  async saveProduct(product: Product): Promise<void> {
    await dexieDB.products.put(product);
  }

  async updateProductStock(id: string, decrementBy: number): Promise<void> {
    await dexieDB.transaction('rw', dexieDB.products, async () => {
      const prod = await dexieDB.products.get(id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - decrementBy);
        await dexieDB.products.put(prod);
      }
    });
  }

  // --- SALES / TRANSACTIONS METHODS ---

  async saveSale(sale: Sale): Promise<void> {
    // Save sale and decrease stock atomically in a transaction
    await dexieDB.transaction('rw', [dexieDB.sales, dexieDB.products], async () => {
      const enrichedSale: Sale = {
        ...sale,
        status: sale.status || 'pending_sync',
        sync_status: sale.sync_status || (sale.status === 'synced' ? 'synced' : 'pending_insert'),
        is_dirty: sale.status === 'synced' ? 0 : 1
      };
      await dexieDB.sales.put(enrichedSale);
      for (const item of sale.items) {
        const prod = await dexieDB.products.get(item.product_id);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          await dexieDB.products.put(prod);
        }
      }
    });
  }

  async getAllSales(): Promise<Sale[]> {
    const sales = await dexieDB.sales.toArray();
    // Sort sales by date descending
    return sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getPendingSyncSales(): Promise<Sale[]> {
    const pendingByStatus = await dexieDB.sales.where('status').equals('pending_sync').toArray();
    const pendingBySyncStatus = await dexieDB.sales
      .where('sync_status')
      .anyOf(['pending_insert', 'pending_update'])
      .toArray();

    // Merge uniquely
    const allPending = [...pendingByStatus];
    for (const sale of pendingBySyncStatus) {
      if (!allPending.some(s => s.id === sale.id)) {
        allPending.push(sale);
      }
    }
    return allPending;
  }

  async updateSaleSyncStatus(
    id: string, 
    status: 'synced' | 'pending_sync' | 'failed_sync', 
    synced_at?: string, 
    sync_error?: string
  ): Promise<void> {
    await dexieDB.sales.update(id, { 
      status, 
      sync_status: status === 'synced' ? 'synced' : (status === 'failed_sync' ? 'error' : 'pending_insert'), 
      is_dirty: status === 'synced' ? 0 : 1,
      synced_at: synced_at || undefined,
      sync_error: sync_error || undefined
    });
  }

  async clearAllSales(): Promise<void> {
    await dexieDB.sales.clear();
  }
}

export const localDB = new POSDatabase();
