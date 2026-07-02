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
  }
}

export const dexieDB = new KaabPOSDexie();
export const db = dexieDB; // Alias for user's requested import name

// Seed standard products for Somali retail (Bariis, Baasto, Saliid, Canjeero, Hilib, etc.)
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Bariis Basmati 5kg',
    somali_name: 'Bariis Baasmasoti 5kg',
    sku: 'BAR-001',
    price: 7.50,
    somali_price: 195000, // Exchange rate: 1 USD = 26,000 Sh.So.
    stock: 45,
    category: 'Raashin Core',
    icon_name: 'Rice'
  },
  {
    id: 'p2',
    name: 'Baasto Santal 1kg',
    somali_name: 'Baasto Talyaani 1kg',
    sku: 'BAA-002',
    price: 1.20,
    somali_price: 31200,
    stock: 80,
    category: 'Raashin Core',
    icon_name: 'Soup'
  },
  {
    id: 'p3',
    name: 'Saliid Cadceedda 3L',
    somali_name: 'Saliid Macsarada 3L',
    sku: 'SAL-003',
    price: 5.80,
    somali_price: 150800,
    stock: 25,
    category: 'Raashin Core',
    icon_name: 'Droplet'
  },
  {
    id: 'p4',
    name: 'Sonkor Cad 10kg',
    somali_name: 'Sonkor Cad 10kg',
    sku: 'SON-004',
    price: 9.00,
    somali_price: 234000,
    stock: 15,
    category: 'Raashin Core',
    icon_name: 'Candy'
  },
  {
    id: 'p5',
    name: 'Shaah Jabuuti (Haleeb)',
    somali_name: 'Shaah Caleen Jabuuti',
    sku: 'SHH-005',
    price: 2.50,
    somali_price: 65000,
    stock: 30,
    category: 'Cabitaano & Shaah',
    icon_name: 'Coffee'
  },
  {
    id: 'p6',
    name: 'Hilib Ari 1kg (Fresh)',
    somali_name: 'Hilib Ari Fresh 1kg',
    sku: 'HIL-006',
    price: 8.00,
    somali_price: 208000,
    stock: 12,
    category: 'Hilib & Kaluun',
    icon_name: 'Beef'
  },
  {
    id: 'p7',
    name: 'Caano Boore Nido 900g',
    somali_name: 'Caano Boore Nido 900g',
    sku: 'CAA-007',
    price: 14.50,
    somali_price: 377000,
    stock: 18,
    category: 'Carruurta & Caanaha',
    icon_name: 'Milk'
  },
  {
    id: 'p8',
    name: 'Biyo Sifaysan Shabelle 1.5L',
    somali_name: 'Biyo Sifaysan 1.5L',
    sku: 'BIY-008',
    price: 0.50,
    somali_price: 13000,
    stock: 120,
    category: 'Cabitaano & Shaah',
    icon_name: 'CupSoap'
  },
  {
    id: 'p9',
    name: 'Saabuun dhar - Omo 1kg',
    somali_name: 'Omo Maydhista dhar 1kg',
    sku: 'SAB-009',
    price: 2.20,
    somali_price: 57200,
    stock: 35,
    category: 'Nadaafadda',
    icon_name: 'Wind'
  },
  {
    id: 'p10',
    name: 'Busbus Shidni (Local)',
    somali_name: 'Shidni Qandala Busbus',
    sku: 'BUS-010',
    price: 1.00,
    somali_price: 26000,
    stock: 50,
    category: 'Uunsi & Basbaas',
    icon_name: 'Flame'
  }
];

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
        sync_status: sale.sync_status || (sale.status === 'synced' ? 'synced' : 'pending_insert')
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
      synced_at: synced_at || undefined,
      sync_error: sync_error || undefined
    });
  }

  async clearAllSales(): Promise<void> {
    await dexieDB.sales.clear();
  }
}

export const localDB = new POSDatabase();
