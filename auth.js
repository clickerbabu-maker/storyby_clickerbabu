/**
 * BusinessOnline Merchant Authentication Engine
 * Multi-credential resolution, rate-limiting, session management & route guards.
 */

window.MerchantAuth = (function() {
  const SUPABASE_CONFIG = {
    url: 'https://defrfqtyrqywwpwancza.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZnJmcXR5cnF5d3dwd2FuY3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzE4MjksImV4cCI6MjEwMzkwNzgyOX0.MP2B8J8HcZU0cGSf4ZhQhIGH5IK4klPpsqzWhZbhPGw'
  };

  const SESSION_KEY = 'bo_merchant_session';
  const LOCKOUT_KEY = 'bo_auth_lockout';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 60;

  // Rate Limiting Logic
  function getRateLimitState() {
    try {
      const data = JSON.parse(sessionStorage.getItem(LOCKOUT_KEY) || '{}');
      const now = Date.now();
      if (data.lockoutUntil && data.lockoutUntil > now) {
        return { isLocked: true, remainingSecs: Math.ceil((data.lockoutUntil - now) / 1000) };
      }
      return { isLocked: false, failedCount: data.failedCount || 0 };
    } catch(e) {
      return { isLocked: false, failedCount: 0 };
    }
  }

  function recordFailedAttempt() {
    const current = getRateLimitState();
    const newCount = (current.failedCount || 0) + 1;
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + (LOCKOUT_SECONDS * 1000);
      sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ lockoutUntil, failedCount: newCount }));
      return { isLocked: true, remainingSecs: LOCKOUT_SECONDS };
    } else {
      sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ failedCount: newCount }));
      return { isLocked: false, failedCount: newCount };
    }
  }

  function resetRateLimit() {
    sessionStorage.removeItem(LOCKOUT_KEY);
  }

  // Detect whether identifier is Phone, Email, or Subdomain Username
  function resolveIdentifierType(input) {
    const clean = input.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return { type: 'email', value: clean.toLowerCase() };
    }
    // Check if phone (with or without +91)
    const phoneDigits = clean.replace(/[^0-9]/g, '');
    if (phoneDigits.length >= 10 && phoneDigits.length <= 13) {
      return { type: 'phone', value: phoneDigits };
    }
    // Otherwise treated as Subdomain Username
    return { type: 'username', value: clean.toLowerCase().replace(/[^a-z0-9-]/g, '') };
  }

  // Main Merchant Authentication Method
  async function loginWithCredentials(identifier, password) {
    // 1. Check Brute-Force Rate Limiter
    const rateLimit = getRateLimitState();
    if (rateLimit.isLocked) {
      return {
        success: false,
        error: `Security Lockout Active. Too many failed attempts. Please wait ${rateLimit.remainingSecs} seconds.`,
        isLocked: true,
        remainingSecs: rateLimit.remainingSecs
      };
    }

    if (!identifier || !identifier.trim()) {
      return { success: false, error: 'Please enter your username, mobile number, or email.' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your account password.' };
    }

    const idInfo = resolveIdentifierType(identifier);

    try {
      let queryUrl = '';
      if (idInfo.type === 'username') {
        queryUrl = `${SUPABASE_CONFIG.url}/rest/v1/tenants?username=eq.${encodeURIComponent(idInfo.value)}&select=*,tenant_profiles(*)`;
      } else if (idInfo.type === 'phone') {
        // Query profile by phone
        queryUrl = `${SUPABASE_CONFIG.url}/rest/v1/tenant_profiles?phone=ilike.*${idInfo.value.slice(-10)}*&select=*,tenants(*)`;
      } else if (idInfo.type === 'email') {
        queryUrl = `${SUPABASE_CONFIG.url}/rest/v1/tenant_profiles?email=eq.${encodeURIComponent(idInfo.value)}&select=*,tenants(*)`;
      }

      const res = await fetch(queryUrl, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (!res.ok) {
        return { success: false, error: 'Connection error while contacting authorization server. Please try again.' };
      }

      const data = await res.json();
      let tenantRecord = null;
      let profileRecord = null;

      if (idInfo.type === 'username') {
        if (data && data.length > 0) {
          tenantRecord = data[0];
          profileRecord = data[0].tenant_profiles || {};
        }
      } else {
        if (data && data.length > 0) {
          profileRecord = data[0];
          tenantRecord = data[0].tenants || {};
        }
      }

      // Check if tenant exists
      if (!tenantRecord || !tenantRecord.id) {
        // Check local fallback
        const local = window.BusinessOnlineEngine?.TENANTS[idInfo.value];
        if (local) {
          tenantRecord = {
            id: local.tenantId,
            username: local.username,
            business_name: local.businessName,
            status: 'active',
            password_hash: local.username === 'clickerbabu' ? 'ClickerBabu@2026' : 'Sharma@1984'
          };
          profileRecord = {
            city: local.location?.city,
            phone: local.contact?.phone,
            tagline: local.tagline
          };
        } else {
          recordFailedAttempt();
          return {
            success: false,
            error: `No business found with this ${idInfo.type}.`,
            notFound: true,
            suggestedUser: idInfo.type === 'username' ? idInfo.value : ''
          };
        }
      }

      // Check if store is suspended / active
      if (tenantRecord.status && tenantRecord.status !== 'active') {
        return { success: false, error: 'This business account is currently inactive. Contact support.' };
      }

      // Verify Password (In production this checks bcrypt hash, here matching against seeded password)
      const expectedPassword = tenantRecord.password_hash || (tenantRecord.username === 'clickerbabu' ? 'ClickerBabu@2026' : 'ClickerBabu@2026');

      if (password !== expectedPassword) {
        const afterFail = recordFailedAttempt();
        if (afterFail.isLocked) {
          return {
            success: false,
            error: `Too many wrong attempts! Account temporarily locked for 60 seconds.`,
            isLocked: true,
            remainingSecs: LOCKOUT_SECONDS
          };
        }
        const remainingTries = MAX_FAILED_ATTEMPTS - afterFail.failedCount;
        return {
          success: false,
          error: `Incorrect password for @${tenantRecord.username}. (${remainingTries} attempts remaining)`
        };
      }

      // Successful Authentication
      resetRateLimit();

      const session = {
        tenantId: tenantRecord.id,
        username: tenantRecord.username,
        businessName: tenantRecord.business_name,
        category: tenantRecord.category || 'Local Business',
        planTier: tenantRecord.plan_tier || 'starter',
        city: profileRecord.city || 'Raipur',
        phone: profileRecord.phone || '',
        loginAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 Hours validity
      };

      createMerchantSession(session);

      return {
        success: true,
        session: session
      };

    } catch(err) {
      console.error('Merchant auth exception:', err);
      return { success: false, error: 'Network timeout. Please check your internet connection.' };
    }
  }

  function createMerchantSession(sessionData) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch(e) {}
  }

  function getMerchantSession() {
    try {
      const str = localStorage.getItem(SESSION_KEY);
      if (!str) return null;
      const sess = JSON.parse(str);
      if (sess.expiresAt && sess.expiresAt > Date.now()) {
        return sess;
      } else {
        logoutMerchant();
        return null;
      }
    } catch(e) {
      return null;
    }
  }

  function logoutMerchant() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  // Global Route Guard to Protect Merchant Dashboard Pages
  function requireAuthGuard(redirectTarget = 'login.html') {
    const session = getMerchantSession();
    if (!session) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirectTarget}?redirect=${currentPath}`;
      return null;
    }
    return session;
  }

  return {
    loginWithCredentials,
    getMerchantSession,
    logoutMerchant,
    requireAuthGuard,
    getRateLimitState,
    resolveIdentifierType
  };
})();
