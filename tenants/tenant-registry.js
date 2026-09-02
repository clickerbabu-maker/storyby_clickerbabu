/**
 * BusinessOnline Multi-Tenant Engine & Registry
 * Handles zero-latency tenant resolution, live Supabase database sync,
 * dynamic theme injection, and white-label storefront rendering.
 */

window.BusinessOnlineEngine = (function() {
  const SUPABASE_CONFIG = {
    url: 'https://defrfqtyrqywwpwancza.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZnJmcXR5cnF5d3dwd2FuY3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzE4MjksImV4cCI6MjEwMzkwNzgyOX0.MP2B8J8HcZU0cGSf4ZhQhIGH5IK4klPpsqzWhZbhPGw'
  };

  // Seed / Local Cache Data (Fallback for sub-5ms instant rendering & offline resilience)
  const LOCAL_CACHE = {
    "clickerbabu": {
      "tenantId": "11111111-1111-1111-1111-111111111111",
      "username": "clickerbabu",
      "businessName": "Story by Clicker Babu",
      "tagline": "Luxury Wedding Photography & Couture Films",
      "about": "Award-winning luxury wedding photography and couture cinematography based in Raipur, Chhattisgarh. Preserving royal destination weddings, raw emotions, and timeless grace across India and worldwide.",
      "category": "Photography & Cinema",
      "location": { "city": "Raipur", "state": "Chhattisgarh", "address": "Civil Lines, Raipur" },
      "contact": { "phone": "+917047470742", "whatsapp": "917047470742", "email": "hello@business-online.in", "instagram": "storyby_clickerbabu" },
      "theme": { "preset": "luxury_dark_gold", "primaryColor": "#B89758", "accentColor": "#D4AF37", "bg": "#141210", "textColor": "#E6DCCA" },
      "rating": 4.9,
      "reviewsCount": 84,
      "badges": ["Top 1% Luxury Visual Artists", "250+ Royal Weddings", "Featured on WedMeGood"],
      "verified": true,
      "isCustomLayout": true
    },
    "sharmasweets": {
      "tenantId": "22222222-2222-2222-2222-222222222222",
      "username": "sharmasweets",
      "businessName": "Sharma Sweets & Bakery",
      "tagline": "Pure Desi Ghee Confectionery & Festive Hampers",
      "about": "Serving authentic Indian sweets, pure desi ghee delicacies, premium dry fruits, and bespoke festive hampers since 1984. Trusted by 50,000+ families across Raipur and Central India.",
      "category": "Sweets & Restaurant",
      "location": { "city": "Raipur", "state": "Chhattisgarh", "address": "Pandri Main Road, Raipur" },
      "contact": { "phone": "+919893012345", "whatsapp": "919893012345", "email": "orders@sharmasweets.in", "instagram": "sharmasweetsraipur" },
      "theme": { "preset": "warm_terracotta", "primaryColor": "#D97706", "accentColor": "#F59E0B", "bg": "#1C1917", "textColor": "#F3F4F6" },
      "rating": 4.8,
      "reviewsCount": 142,
      "badges": ["100% Pure Desi Ghee", "FSSAI Certified", "Since 1984"],
      "verified": true,
      "heroCover": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200&auto=format&fit=crop&q=80",
      "catalog": [
        { "id": "1", "title": "Royal Kaju Katli (Silver Foil)", "price": "₹950 / kg", "desc": "Handcrafted with premium Goan cashews and pure saffron aroma.", "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80" },
        { "id": "2", "title": "Pure Desi Ghee Motichoor Ladoo", "price": "₹680 / kg", "desc": "Authentic melt-in-mouth pearls soaked in rich desi ghee and pistachios.", "img": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80" },
        { "id": "3", "title": "Royal Wedding Gift Box", "price": "₹1,200", "desc": "Luxury tin packaging with assorted dry fruits and gourmet sweets.", "img": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" }
      ]
    },
    "royaldental": {
      "tenantId": "33333333-3333-3333-3333-333333333333",
      "username": "royaldental",
      "businessName": "Dr. Verma's Royal Dental & Implant Clinic",
      "tagline": "Advanced Painless Dentistry & Smile Design",
      "about": "State-of-the-art dental healthcare facility equipped with 3D digital scanners, laser treatment, and certified implantologists. Providing painless root canal, clear aligners, and cosmetic smile makeovers.",
      "category": "Healthcare & Clinic",
      "location": { "city": "Raipur", "state": "Chhattisgarh", "address": "Shankar Nagar Main Road, Raipur" },
      "contact": { "phone": "+917714012345", "whatsapp": "917714012345", "email": "care@royaldentalclinic.in", "instagram": "royaldentalraipur" },
      "theme": { "preset": "vibrant_emerald", "primaryColor": "#0D9488", "accentColor": "#14B8A6", "bg": "#0F172A", "textColor": "#F8FAFC" },
      "rating": 5.0,
      "reviewsCount": 96,
      "badges": ["NABH Compliant", "15+ Years Clinical Excellence", "10,000+ Happy Smiles"],
      "verified": true,
      "heroCover": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop&q=80",
      "catalog": [
        { "id": "1", "title": "Invisible Clear Aligners & Braces", "price": "From ₹25,000", "desc": "Customized 3D digital teeth straightening without metal wires.", "img": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80" },
        { "id": "2", "title": "Single Sitting Painless RCT", "price": "From ₹3,500", "desc": "Computerized rotary endodontics with zero pain and crown fitting.", "img": "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80" },
        { "id": "3", "title": "Laser Teeth Whitening & Smile Makeover", "price": "From ₹5,000", "desc": "Instant 4-shade brighter teeth in 45 minutes using diode laser.", "img": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80" }
      ]
    }
  };

  // Load from localStorage if present
  try {
    const saved = localStorage.getItem('bo_tenants_cache');
    if (saved) {
      Object.assign(LOCAL_CACHE, JSON.parse(saved));
    }
  } catch (e) {
    // Ignore storage errors
  }

  const TENANTS = LOCAL_CACHE;

  // Initialize background live sync with Supabase
  async function syncFromCloud() {
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/tenants?select=*,tenant_profiles(*)&status=eq.active`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (!res.ok) return false;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach(r => {
          const u = (r.username || '').toLowerCase();
          if (!u) return;
          const p = r.tenant_profiles || {};
          TENANTS[u] = {
            tenantId: r.id,
            username: u,
            businessName: r.business_name || u,
            tagline: p.tagline || 'Proudly powered by business-online.in',
            about: p.about_bio || 'Welcome to our official business portal.',
            category: r.category || 'Local Business',
            location: { city: p.city || 'Raipur', state: p.state || 'Chhattisgarh', address: p.address || '' },
            contact: { phone: p.phone || '', whatsapp: p.whatsapp || p.phone || '', email: p.email || '', instagram: p.instagram || '' },
            theme: p.theme_config && Object.keys(p.theme_config).length ? p.theme_config : (TENANTS[u]?.theme || { preset: 'luxury_dark_gold', primaryColor: '#B89758', accentColor: '#D4AF37', bg: '#141210', textColor: '#E6DCCA' }),
            rating: p.rating ? parseFloat(p.rating) : (TENANTS[u]?.rating || 5.0),
            reviewsCount: p.reviews_count || (TENANTS[u]?.reviewsCount || 1),
            badges: p.badges || ['Verified Business'],
            verified: r.is_verified ?? true,
            heroCover: p.hero_cover_url || (TENANTS[u]?.heroCover || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80'),
            catalog: TENANTS[u]?.catalog || [
              { id: '1', title: 'Featured Service / Product', price: 'Best Price', desc: 'Contact us directly on WhatsApp for instant quote.', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80' }
            ],
            isCustomLayout: u === 'clickerbabu'
          };
        });

        try {
          localStorage.setItem('bo_tenants_cache', JSON.stringify(TENANTS));
        } catch (e) {}

        // Trigger UI update event if directory is active
        window.dispatchEvent(new CustomEvent('tenants-synced', { detail: { count: rows.length } }));
        return true;
      }
    } catch (err) {
      console.warn('Cloud database sync fallback active:', err.message);
    }
    return false;
  }

  // Detect Active Tenant based on Subdomain or Query Param
  function resolveTenant() {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant') || urlParams.get('user');
    if (tenantParam && TENANTS[tenantParam.toLowerCase()]) {
      return TENANTS[tenantParam.toLowerCase()];
    }

    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    
    // Check if host is a subdomain of business-online.in (e.g. clickerbabu.business-online.in)
    if (parts.length >= 3 && parts[parts.length - 2] === 'business-online' && parts[parts.length - 1] === 'in') {
      const subdomain = parts[0];
      if (TENANTS[subdomain]) {
        return TENANTS[subdomain];
      }
    }
    
    // In local development or main domain, check hash
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('tenant=')) {
      const tName = hash.replace('tenant=', '').toLowerCase();
      if (TENANTS[tName]) return TENANTS[tName];
    }

    return null; // Null means render Main SaaS & Justdial Directory
  }

  function getAllTenants() {
    return Object.values(TENANTS);
  }

  async function isUsernameAvailable(username) {
    if (!username) return false;
    const cleanUser = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (TENANTS[cleanUser]) return false;

    // Double check on Supabase Live
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/tenants?username=eq.${encodeURIComponent(cleanUser)}&select=id`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) && data.length === 0;
      }
    } catch (e) {}

    return !TENANTS[cleanUser];
  }

  async function registerNewTenant(tenantData) {
    if (!tenantData.username) return null;
    const cleanUser = tenantData.username.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const newObj = {
      tenantId: 't_' + Date.now(),
      username: cleanUser,
      businessName: tenantData.businessName || cleanUser,
      tagline: tenantData.tagline || 'Proudly powered by business-online.in',
      about: tenantData.about || `Welcome to ${tenantData.businessName || cleanUser}. We provide quality services and premium products in ${tenantData.city || 'Raipur'}.`,
      category: tenantData.category || 'Local Business',
      location: { city: tenantData.city || 'Raipur', state: 'Chhattisgarh', address: tenantData.address || '' },
      contact: { phone: tenantData.phone || '', whatsapp: tenantData.whatsapp || tenantData.phone || '', email: tenantData.email || '' },
      theme: { preset: 'luxury_dark_gold', primaryColor: '#B89758', accentColor: '#D4AF37', bg: '#141210', textColor: '#E6DCCA' },
      rating: 5.0,
      reviewsCount: 1,
      badges: ['Newly Verified Store', 'Instant WhatsApp Support'],
      verified: true,
      heroCover: tenantData.heroCover || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      catalog: [
        { id: '1', title: 'Featured Service / Product', price: 'Best Price', desc: 'Contact us directly on WhatsApp for an instant custom quote.', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80' }
      ]
    };

    // 1. Immediately store in local memory and storage for zero latency
    TENANTS[cleanUser] = newObj;
    try {
      localStorage.setItem('bo_tenants_cache', JSON.stringify(TENANTS));
    } catch (e) {}

    // 2. Persist to Supabase Live Cloud Database
    try {
      const tenantPayload = {
        username: cleanUser,
        business_name: newObj.businessName,
        category: newObj.category,
        plan_tier: 'starter',
        status: 'active',
        is_verified: true
      };

      const tRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/tenants`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(tenantPayload)
      });

      if (tRes.ok) {
        const insertedTenants = await tRes.json();
        const createdTenant = insertedTenants[0];
        if (createdTenant && createdTenant.id) {
          newObj.tenantId = createdTenant.id;

          const profilePayload = {
            tenant_id: createdTenant.id,
            tagline: newObj.tagline,
            about_bio: newObj.about,
            city: newObj.location.city,
            state: newObj.location.state,
            address: newObj.location.address,
            phone: newObj.contact.phone,
            whatsapp: newObj.contact.whatsapp,
            email: newObj.contact.email,
            rating: 5.0,
            reviews_count: 1
          };

          await fetch(`${SUPABASE_CONFIG.url}/rest/v1/tenant_profiles`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(profilePayload)
          });
        }
      }
    } catch (err) {
      console.warn('Background Supabase persistence note:', err.message);
    }

    return newObj;
  }

  // Trigger sync on load
  if (typeof window !== 'undefined') {
    setTimeout(syncFromCloud, 100);
  }

  return {
    resolveTenant,
    getAllTenants,
    registerNewTenant,
    isUsernameAvailable,
    syncFromCloud,
    TENANTS,
    SUPABASE_CONFIG
  };
})();
