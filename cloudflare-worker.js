/**
 * Cloudflare Edge Worker for business-online.in
 * Handles Wildcard Subdomains (*.business-online.in),
 * Multi-Tenant Edge Routing, Custom Domains, and Sub-Millisecond Caching.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    
    // Reserved subdomains routed to internal services
    const RESERVED_SUBDOMAINS = ['app', 'api', 'admin', 'auth', 'cdn', 'mail', 'status'];

    // 1. Root Domain (business-online.in or www.business-online.in) -> SaaS Marketplace & Directory
    if (hostname === 'business-online.in' || hostname === 'www.business-online.in' || hostname === 'localhost') {
      // Pass-through to origin or main directory bundle
      return fetch(request);
    }

    // 2. Parse Subdomains (*.business-online.in)
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[parts.length - 2] === 'business-online' && parts[parts.length - 1] === 'in') {
      const subdomain = parts[0];

      // If reserved service subdomain (e.g. app.business-online.in)
      if (RESERVED_SUBDOMAINS.includes(subdomain)) {
        return fetch(request);
      }

      // Tenant Subdomain (e.g. clickerbabu.business-online.in)
      // Inject tenant query parameter internally without client-side redirect
      url.searchParams.set('tenant', subdomain);
      
      // Edge Caching Strategy
      const cacheKey = new Request(url.toString(), request);
      const cache = caches.default;
      let response = await cache.match(cacheKey);

      if (!response) {
        response = await fetch(new Request(url.toString(), request));
        
        // Clone response and apply Edge Security & SEO headers
        const newHeaders = new Headers(response.headers);
        newHeaders.set('X-Tenant-Subdomain', subdomain);
        newHeaders.set('X-Powered-By', 'BusinessOnline SaaS Platform');
        newHeaders.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');

        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    }

    // 3. White-Label Custom Domains (e.g. clientbrand.com pointing via CNAME)
    // Lookup tenant associated with custom domain in Cloudflare KV
    if (env.TENANT_DOMAINS_KV) {
      const tenantUsername = await env.TENANT_DOMAINS_KV.get(hostname);
      if (tenantUsername) {
        url.searchParams.set('tenant', tenantUsername);
        return fetch(new Request(url.toString(), request));
      }
    }

    return fetch(request);
  }
};
