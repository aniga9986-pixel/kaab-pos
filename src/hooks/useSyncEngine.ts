import { useEffect, useState } from 'react';
import { syncPendingSales } from '../syncEngine';

export function useSyncEngine(db: any) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      startSync(); // Markay online noqoto, toos u bilaaw sync-ga
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    console.log("🔄 Syncing dhowaan ayay bilaabanaysaa...");

    try {
      // 1. Soo qaad xogta deegaanka (Local) ee leh 'is_dirty: true' (ama durbadiiba u baahan midayn)
      const dirtySales = await db.sales.where('is_dirty').equals(1).toArray();

      if (dirtySales.length === 0) {
        console.log("✅ Xog cusub oo la rulo ma jirto.");
        setIsSyncing(false);
        return;
      }

      // 2. Midaynta rasmiga ah oo u dirtay Supabase
      await syncPendingSales();

      console.log(`🚀 Waxaa la sync-gareeyay ${dirtySales.length} iibyaal ah!`);
    } catch (error) {
      console.error("❌ Sync-ga waa fashilmay:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, startSync };
}
