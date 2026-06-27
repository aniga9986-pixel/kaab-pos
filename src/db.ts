import { Product, Sale } from './types';

const DB_NAME = 'KaabPOSDB';
const DB_VERSION = 1;

export class POSDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products / Inventory Store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }

        // Sales Store (for POS transactions)
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('status', 'status', { unique: false });
          salesStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedProductsIfEmpty();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };
    });
  }

  private async getStore(storeName: 'products' | 'sales', mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Seed standard products for Somali retail (Bariis, Baasto, Saliid, Canjeero, Hilib, etc.)
  private async seedProductsIfEmpty(): Promise<void> {
    const products = await this.getAllProducts();
    if (products.length > 0) return;

    const initialProducts: Product[] = [
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

    const store = await this.getStore('products', 'readwrite');
    for (const prod of initialProducts) {
      await new Promise<void>((resolve, reject) => {
        const req = store.put(prod);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
    console.log('IndexedDB seeded with initial Somali products.');
  }

  // --- PRODUCTS / INVENTORY METHODS ---

  async getAllProducts(): Promise<Product[]> {
    const store = await this.getStore('products', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProduct(product: Product): Promise<void> {
    const store = await this.getStore('products', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(product);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateProductStock(id: string, decrementBy: number): Promise<void> {
    const store = await this.getStore('products', 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const prod = getReq.result as Product;
        if (prod) {
          prod.stock = Math.max(0, prod.stock - decrementBy);
          const updateReq = store.put(prod);
          updateReq.onsuccess = () => resolve();
          updateReq.onerror = () => reject(updateReq.error);
        } else {
          resolve(); // product not found, nothing to update
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- SALES / TRANSACTIONS METHODS ---

  async saveSale(sale: Sale): Promise<void> {
    // 1. Save Sale locally to IndexedDB
    const salesStore = await this.getStore('sales', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = salesStore.put(sale);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 2. Adjust product stocks locally
    for (const item of sale.items) {
      await this.updateProductStock(item.product_id, item.quantity);
    }
  }

  async getAllSales(): Promise<Sale[]> {
    const store = await this.getStore('sales', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const result = req.result || [];
        // Sort sales by date descending
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingSyncSales(): Promise<Sale[]> {
    const db = await this.init();
    const transaction = db.transaction('sales', 'readonly');
    const store = transaction.objectStore('sales');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const req = index.getAll(IDBKeyRange.only('pending_sync'));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async updateSaleSyncStatus(id: string, status: 'synced', synced_at: string): Promise<void> {
    const store = await this.getStore('sales', 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const sale = getReq.result as Sale;
        if (sale) {
          sale.status = status;
          sale.synced_at = synced_at;
          const updateReq = store.put(sale);
          updateReq.onsuccess = () => resolve();
          updateReq.onerror = () => reject(updateReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clearAllSales(): Promise<void> {
    const store = await this.getStore('sales', 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const localDB = new POSDatabase();
