import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { APP_ID } from '../lib/constants';

export interface Action {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Timestamp;
}

/**
 * Bidirectional realtime listener hooking into the active App ID actions collection.
 * Isolates pending triggers deposited by n8n orchestrators, automatically signaling global UI indicators.
 * Mock-fulfills the inbound payload (moves to completed) to ensure idempotent state cycles.
 */
export function useN8nActions() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    // Listen for 'pending' actions in the apps/[APP_ID]/actions path
    const q = query(
      collection(db, `apps/${APP_ID}/actions`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
         setIsSyncing(false);
         return;
      }

      setIsSyncing(true);
      
      const pendingDocs = snapshot.docs;
      for (const d of pendingDocs) {
         const actionData = d.data() as Action;
         setLastAction(actionData.type);
         
         // Mockup processing delay matching Phase 2 specifications
         setTimeout(async () => {
           try {
             const docRef = doc(db, `apps/${APP_ID}/actions`, d.id);
             await updateDoc(docRef, { status: 'completed' });
           } catch (err) {
             console.error('Failed to acknowledge and finalize system action:', err);
           }
         }, 1500); // 1.5s simulated active processing window
      }
    }, (error) => {
       console.error('Core Background Action listener failed:', error);
       setIsSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  return { isSyncing, lastAction };
}
