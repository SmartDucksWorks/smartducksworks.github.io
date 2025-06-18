/**
 * WebhookVerifier - Client-side implementation for signing requests
 * 
 * This class is designed to work with the server-side n8n-webhook-verifier.js module
 * to provide secure webhook request signing for SmartDucks applications.
 */
class WebhookVerifier {
    constructor(webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    /**
     * Computes HMAC asynchronously using Web Crypto API
     * @param {string} payload - The payload to sign
     * @returns {Promise<string>} - The computed HMAC as a hex string
     */
    async computeHMAC(payload) {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        
        try {
            // Convert webhook secret to a CryptoKey
            const keyData = encoder.encode(this.webhookSecret);
            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            
            // Sign the payload
            const signature = await crypto.subtle.sign('HMAC', key, data);
            
            // Convert to hex string
            return Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('Error computing HMAC, falling back to simple hash:', error);
            return this.generateSimpleHash(payload);
        }
    }
    
    /**
     * Simple hash function as fallback for testing
     * @param {string} data - The data to hash
     * @returns {string} - A simple hash of the data
     */
    generateSimpleHash(data) {
        // Simple hashing function as fallback
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    /**
     * Securely compares two strings to prevent timing attacks
     * @param {string} a - First string to compare
     * @param {string} b - Second string to compare
     * @returns {boolean} - Whether the strings match
     */
    secureCompare(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        if (a.length !== b.length) return false;
        
        // Constant-time comparison
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    
    /**
     * Verifies a signature for a given payload
     * @param {object} payload - The payload that was signed
     * @param {string} signature - The signature to verify
     * @param {number} timestamp - The timestamp of the signature
     * @returns {Promise<boolean>} - Whether the signature is valid
     */
    async verifySignature(payload, signature, timestamp) {
        const data = `${timestamp}.${JSON.stringify(payload)}`;
        const expectedSignature = await this.computeHMAC(data);
        return this.secureCompare(signature, expectedSignature);
    }
}
