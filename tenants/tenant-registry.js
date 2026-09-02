/**
 * BusinessOnline Multi-Tenant Engine & Registry
 * Handles zero-latency tenant resolution, dynamic theme injection,
 * and white-label storefront rendering.
 */

window.BusinessOnlineEngine = (function() {
  const TENANTS = {
    "clickerbabu": {
      "tenantId": "t_cb_001",
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
      "isCustomLayout": true // Clicker Babu uses bespoke luxury index layout
    },
    "sharmasweets": {
      "tenantId": "t_ss_002",
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
      "tenantId": "t_rd_003",
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

  function registerNewTenant(tenantData) {
    if (!tenantData.username) return false;
    const cleanUser = tenantData.username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    TENANTS[cleanUser] = {
      tenantId: 't_' + Date.now(),
      username: cleanUser,
      businessName: tenantData.businessName || cleanUser,
      tagline: tenantData.tagline || 'Proudly powered by business-online.in',
      about: tenantData.about || 'Welcome to our official business portal.',
      category: tenantData.category || 'Local Business',
      location: { city: tenantData.city || 'India', state: '', address: tenantData.address || '' },
      contact: { phone: tenantData.phone || '', whatsapp: tenantData.whatsapp || tenantData.phone || '', email: tenantData.email || '' },
      theme: { preset: 'luxury_dark_gold', primaryColor: '#B89758', accentColor: '#D4AF37', bg: '#141210', textColor: '#E6DCCA' },
      rating: 5.0,
      reviewsCount: 1,
      badges: ['Newly Verified', 'Online Verified Store'],
      verified: true,
      heroCover: tenantData.heroCover || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      catalog: [
        { id: '1', title: 'Featured Service / Product', price: 'Best Price', desc: 'Contact us directly on WhatsApp for instant quote.', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80' }
      ]
    };
    return TENANTS[cleanUser];
  }

  return {
    resolveTenant,
    getAllTenants,
    registerNewTenant,
    TENANTS
  };
})();
