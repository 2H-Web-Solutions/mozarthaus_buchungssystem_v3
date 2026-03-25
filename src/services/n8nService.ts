/**
 * Fires an asynchronous, non-blocking outbound webhook to the central n8n orchestrator.
 * Handles failure resilience gracefully without exposing runtime exceptions to synchronous client UI threads.
 */
export async function notifyN8n(eventType: string, payload: any) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn(`[n8n Sync Warning] Webhook URL not configured in .env. Skipping event: ${eventType}`);
    return;
  }

  try {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      })
    }).catch(err => {
      // Fire and forget strategy prevents long-running network overheads from breaking client loops
      console.warn('[n8n Transport Layer] Failed to dispatch webhook asynchronously:', err);
    });
  } catch (error) {
    console.error('[n8n Core Error] Webhook execution threw synchronous error:', error);
  }
}
