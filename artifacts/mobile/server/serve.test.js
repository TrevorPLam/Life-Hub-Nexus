/**
 * Security tests for Expo static build server.
 * Tests use Node.js built-in test runner (node --test).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { htmlEncode, resolvePublicOrigin } = require('./security');

describe('Server Security', () => {
  describe('HTML encoding', () => {
    it('Given app name with HTML special characters, when encoding, then characters are HTML-encoded', () => {
      assert.strictEqual(htmlEncode('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      assert.strictEqual(htmlEncode('Test & "quotes"'), 'Test &amp; &quot;quotes&quot;');
      assert.strictEqual(htmlEncode("Test 'apostrophe'"), "Test &#39;apostrophe&#39;");
      assert.strictEqual(htmlEncode('Test <tag>'), 'Test &lt;tag&gt;');
    });

    it('Given base URL with HTML special characters, when encoding, then characters are HTML-encoded', () => {
      assert.strictEqual(htmlEncode('https://example.com?x=<script>'), 'https://example.com?x=&lt;script&gt;');
      assert.strictEqual(htmlEncode('https://example.com?foo=bar&baz=qux'), 'https://example.com?foo=bar&amp;baz=qux');
    });
  });

  describe('valid public-origin resolver', () => {
    it('Given valid host header without allowlist, when resolving, then returns valid origin', () => {
      // Test with no TRUSTED_ORIGINS set (default behavior)
      const result = resolvePublicOrigin({ host: 'example.com' });
      assert.ok(result);
      assert.strictEqual(result.baseUrl, 'https://example.com');
      assert.strictEqual(result.expsUrl, 'example.com');
    });

    it('Given valid host header with port, when resolving, then returns valid origin with port', () => {
      const result = resolvePublicOrigin({ host: 'example.com:3000' });
      assert.ok(result);
      assert.strictEqual(result.baseUrl, 'https://example.com:3000');
      assert.strictEqual(result.expsUrl, 'example.com:3000');
    });

    it('Given x-forwarded-proto http, when resolving, then uses http protocol', () => {
      const result = resolvePublicOrigin({ 'x-forwarded-proto': 'http', host: 'example.com' });
      assert.ok(result);
      assert.strictEqual(result.baseUrl, 'http://example.com');
    });

    it('Given invalid protocol, when resolving, then returns null', () => {
      const result = resolvePublicOrigin({ 'x-forwarded-proto': 'ftp', host: 'example.com' });
      assert.strictEqual(result, null);
    });

    it('Given malformed host header, when resolving, then returns null', () => {
      const result = resolvePublicOrigin({ host: 'evil.com<script>' });
      assert.strictEqual(result, null);
    });

    it('Given host header with injection attempt, when resolving, then returns null', () => {
      const result = resolvePublicOrigin({ host: 'example.com\r\nX-Injected: true' });
      assert.strictEqual(result, null);
    });

    it('Given missing host header, when resolving, then returns null', () => {
      const result = resolvePublicOrigin({});
      assert.strictEqual(result, null);
    });

    it('Given trusted origin in allowlist, when resolving, then returns valid origin', () => {
      const result = resolvePublicOrigin({ host: 'example.com' }, ['example.com']);
      assert.ok(result);
      assert.strictEqual(result.baseUrl, 'https://example.com');
    });

    it('Given untrusted origin not in allowlist, when resolving, then returns null', () => {
      const result = resolvePublicOrigin({ host: 'evil.com' }, ['example.com']);
      assert.strictEqual(result, null);
    });

    it('Given subdomain of trusted origin, when resolving, then returns valid origin', () => {
      const result = resolvePublicOrigin({ host: 'sub.example.com' }, ['example.com']);
      assert.ok(result);
      assert.strictEqual(result.baseUrl, 'https://sub.example.com');
    });
  });
});
