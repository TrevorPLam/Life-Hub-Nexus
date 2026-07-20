/**
 * Security utilities for Expo static build server.
 * Exported for testing purposes.
 */

/**
 * HTML-encode a string to prevent XSS.
 * Replaces &, <, >, ", ' with their HTML entities.
 */
function htmlEncode(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate and resolve the public origin from request headers.
 * Uses x-forwarded-proto and x-forwarded-host if present (reverse proxy),
 * otherwise falls back to the host header.
 * 
 * @param {Object} headers - Request headers
 * @param {string[]} trustedOrigins - Array of trusted domain names (optional)
 * @returns {{baseUrl: string, expsUrl: string} | null} - Resolved URLs or null if invalid
 */
function resolvePublicOrigin(headers, trustedOrigins = []) {
  const forwardedProto = headers['x-forwarded-proto'];
  const forwardedHost = headers['x-forwarded-host'];
  const host = headers['host'];
  
  // Determine protocol: trust x-forwarded-proto if present, default to https
  const protocol = forwardedProto ? forwardedProto.toLowerCase() : 'https';
  if (protocol !== 'http' && protocol !== 'https') {
    return null; // Invalid protocol
  }
  
  // Determine host: trust x-forwarded-host if present, otherwise use host
  const hostHeader = forwardedHost || host;
  if (!hostHeader) {
    return null; // No host header
  }
  
  // Validate host format (basic validation to prevent injection)
  // Allow: domain.com, sub.domain.com, domain.com:port, [IPv6]
  const hostRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*|\[?[a-fA-F0-9:.]+\]?)(?::\d{1,5})?$/;
  if (!hostRegex.test(hostHeader)) {
    return null; // Invalid host format
  }
  
  // Extract hostname (remove port if present)
  let hostname;
  try {
    hostname = hostHeader.split(':')[0].toLowerCase();
  } catch {
    return null;
  }
  
  // If trusted origins are configured, validate against allowlist
  if (trustedOrigins.length > 0) {
    const isTrusted = trustedOrigins.some(trusted => {
      // Exact match or subdomain match
      return hostname === trusted || hostname.endsWith('.' + trusted);
    });
    if (!isTrusted) {
      return null; // Origin not in allowlist
    }
  }
  
  const baseUrl = `${protocol}://${hostHeader}`;
  const expsUrl = hostHeader;
  
  return { baseUrl, expsUrl };
}

module.exports = {
  htmlEncode,
  resolvePublicOrigin,
};
