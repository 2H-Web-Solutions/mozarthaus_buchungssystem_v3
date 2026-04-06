/**
 * Generates an HMAC-SHA256 signature using the Web Crypto API (browser-compatible).
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const messageData = enc.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates the X-API headers for Regiondo authentication.
 */
export async function getRegiondoAuthHeaders(publicKey: string, privateKey: string, queryString: string = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestData = timestamp + publicKey + queryString;
  
  const hmac = await hmacSha256(privateKey, requestData);
  
  return {
    'X-API-ID': publicKey,
    'X-API-TIME': timestamp,
    'X-API-HASH': hmac,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}
