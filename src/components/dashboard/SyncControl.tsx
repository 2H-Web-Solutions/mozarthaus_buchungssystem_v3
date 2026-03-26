import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import toast from 'react-hot-toast';

export function SyncControl() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Listen to Firebase sync_status timestamp
    const syncDocRef = doc(db, `apps/${APP_ID}/system`, 'sync_status');
    const unsubscribe = onSnapshot(syncDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().lastSync) {
        const timestamp = docSnap.data().lastSync;
        setLastSync(timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // FORCE HTTPS to prevent Mixed Content errors
      let webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.deine-domain.com/webhook/regiondo-sync';
      if (webhookUrl.startsWith('http://')) {
        webhookUrl = webhookUrl.replace('http://', 'https://');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual_dashboard_sync', timestamp: new Date().toISOString() })
      });

      if (!response.ok) {
        throw new Error('Sync-Request fehlgeschlagen');
      }

      toast.success('Regiondo Sync Controller (n8n) erfolgreich angestoßen!');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Starten des Regiondo Syncs.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-gray-900 text-lg">Regiondo & System Sync</h3>
        <RefreshCw className={`w-5 h-5 text-gray-400 ${isSyncing ? 'animate-spin text-brand-primary' : ''}`} />
      </div>
      
      <p className="text-sm text-gray-500 mb-6 flex-1">
        Überwacht und steuert die automatische Synchronisierung von externen Buchungen (Regiondo) über unsere n8n Automatisierungs-Schnittstelle.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          {lastSync ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
             <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Letzter Sync</p>
            <p className="text-sm font-medium text-gray-900">
              {lastSync ? lastSync.toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' }) : 'Noch nie synchronisiert'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Synchronisiere...' : 'Regiondo Sync jetzt starten'}
      </button>
    </div>
  );
}
