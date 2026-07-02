import { db } from './db';
import { createSupabaseInstance, syncSaleToSupabase } from './supabaseClient';

function isNetworkError(err: any): boolean {
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('connect') ||
    msg.includes('timeout') ||
    msg.includes('abort') ||
    msg.includes('dns') ||
    msg.includes('internet')
  );
}

/**
 * Midaynta xogta offline-ka ah iyo Supabase (Sync Pending Sales)
 * Waxay ka shaqaysaa labada xaaladood: marka internetku soo laabto iyo marka la rabo midayn gacan ah.
 */
export async function syncPendingSales(): Promise<void> {
  // 1. Soo hel dhamaan iibka aan weli cloud-ka tegin (pending_insert ama pending_update)
  const pendingBySyncStatus = await db.sales
    .where('sync_status')
    .anyOf(['pending_insert', 'pending_update'])
    .toArray();

  // Sidoo kale soo qabo haddii ay jiraan kuwo leh status 'pending_sync'
  const pendingByStatus = await db.sales
    .where('status')
    .equals('pending_sync')
    .toArray();

  // Miji labada array si aan midayn isku mid ah u helno
  const allPending = [...pendingBySyncStatus];
  for (const sale of pendingByStatus) {
    if (!allPending.some((s) => s.id === sale.id)) {
      allPending.push(sale);
    }
  }

  if (allPending.length === 0) {
    console.log('Ma jiraan iib u baahan in la midooyo hadda.');
    return;
  }

  console.log(`Waxaa la helay ${allPending.length} iib oo u baahan sync...`);

  const supabase = createSupabaseInstance();

  for (const sale of allPending) {
    try {
      if (supabase) {
        // 2. U rur Supabase (Midaynta Sale iyo SaleItems oo dhammaystiran)
        await syncSaleToSupabase(sale, supabase);

        // 3. Haddii ay guuleysato, u beddel xaaladda IndexedDB 'synced'
        await db.sales.update(sale.id, {
          status: 'synced',
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          sync_error: undefined
        });
        console.log(`Iibka ID: ${sale.id} waa la sync-gareeyay Supabase.`);
      } else {
        // Demo Mode fallback - haddii aan Supabase weli la xiriirin, u calaamadee sidii la midooyay si demo ah
        await db.sales.update(sale.id, {
          status: 'synced',
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          sync_error: undefined
        });
        console.log(`[Demo Sync] Iibka ID: ${sale.id} waxaa loo calaamadeeyay synced.`);
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`Sync fashil iibka ID: ${sale.id}:`, errMsg);

      // Save the error status in IndexedDB so we don't infinitely retry this item in the background loop
      await db.sales.update(sale.id, {
        status: 'failed_sync',
        sync_status: 'error',
        sync_error: errMsg
      });

      // If it is a network connectivity issue, stop trying subsequent transactions
      if (isNetworkError(err)) {
        console.log('Network/connectivity error detected. Stopping sync loop.');
        break;
      }
    }
  }
}
