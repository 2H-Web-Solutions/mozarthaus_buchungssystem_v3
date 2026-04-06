// src/services/n8nService.ts
import { Booking } from '../types/schema';

/**
 * Alter generischer Outbound-Webhhok (z.B. für Dashboard-Alerts, Statusmeldungen).
 */
export async function notifyN8n(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  const url = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!url) return;
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type, timestamp: new Date().toISOString() })
    }).catch(e => console.error(e));
  } catch(e) { console.error(e); }
}

/**
 * Spezifischer Outbound-Trigger für die Regiondo-Synchronisation.
 * Nutzt VITE_N8N_3_WEBHOOK_URL (Public) als primäre Route und fällt
 * lokal auf VITE_N8N_2_WEBHOOK_URL (Internal) zurück.
 * Enthält Loop-Protection.
 */
export async function triggerN8nOutboundSync(booking: Booking) {
  const regiondoWebhookUrl = import.meta.env.VITE_N8N_3_WEBHOOK_URL || import.meta.env.VITE_N8N_2_WEBHOOK_URL;
  
  if (!regiondoWebhookUrl) {
    console.warn('[n8n Regiondo Sync] VITE_N8N_3_WEBHOOK_URL and VITE_N8N_2_WEBHOOK_URL are missing in .env.');
    return;
  }

  // Loop Protection: Nicht zurück an Regiondo senden, wenn es von dort kam
  if (booking.source === 'regiondo') {
    console.log('[n8n Regiondo Sync] Skipping outbound sync: Booking originated from Regiondo.');
    return;
  }

  try {
    fetch(regiondoWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    }).catch(err => {
      console.warn('[n8n Regiondo Sync] Failed to dispatch webhook asynchronously:', err);
    });
  } catch (error) {
    console.error('[n8n Regiondo Sync] Webhook execution threw synchronous error:', error);
  }
}

/**
 * Sends a manual booking request from the admin interface to n8n for orchestration.
 */
export async function sendManualBookingToN8n(payload: any) {
  const url = import.meta.env.VITE_N8N_WEBHOOKOUTBOUND_URL;
  
  if (!url) {
    throw new Error('VITE_N8N_WEBHOOKOUTBOUND_URL is not configured in .env');
  }
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`n8n webhook error: ${text || res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('[n8n Manual Booking] Error:', error);
    throw error;
  }
}
