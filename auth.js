/**
 * BusinessOnline Merchant Authentication Engine
 * Multi-credential resolution, Google OAuth integration, mandatory mobile binding,
 * 30-day Remember Me session management & route guards.
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
    const phoneDigits = clean.replace(/[^0-9]/g, '');
    if (phoneDigits.length >= 10 && phoneDigits.length <= 13) {
      return { type: 'phone', value: phoneDigits };
    }
    return { type: 'username', value: clean.toLowerCase().replace(/[^a-z0-9-]/g, '') };
  }

  // Main Merchant Authentication Method
  async function loginWithCredentials(identifier, password, rememberMe = false) {
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

      if (tenantRecord.status && tenantRecord.status !== 'active') {
        return { success: false, error: 'This business account is currently inactive. Contact support.' };
      }

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

      resetRateLimit();

      // Remember Me TTL: 30 Days if checked, 24 Hours if unchecked
      const ttl = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);

      const session = {
        tenantId: tenantRecord.id,
        username: tenantRecord.username,
        businessName: tenantRecord.business_name,
        category: tenantRecord.category || 'Local Business',
        planTier: tenantRecord.plan_tier || 'starter',
        city: profileRecord.city || 'Raipur',
        phone: profileRecord.phone || '',
        email: profileRecord.email || '',
        rememberMe: !!rememberMe,
        loginAt: Date.now(),
        expiresAt: Date.now() + ttl
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

  // Google OAuth Initiator with Redirect Target
  function signInWithGoogle() {
    const redirectTo = encodeURIComponent(window.location.origin + window.location.pathname);
    const googleAuthUrl = `${SUPABASE_CONFIG.url}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
    window.location.href = googleAuthUrl;
  }

  // Handle Google OAuth Callback (Parses Hash or Token)
  async function handleOAuthCallback() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return null;

    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    if (!accessToken) return null;

    try {
      // Get User info from Supabase Auth API
      const userRes = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userRes.ok) return null;
      const user = await userRes.json();
      const userEmail = (user.email || '').toLowerCase();
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0];

      // Check if user's email is already registered in tenant_profiles
      const checkRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/tenant_profiles?email=eq.${encodeURIComponent(userEmail)}&select=*,tenants(*)`, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (rows && rows.length > 0 && rows[0].phone) {
          // Existing vendor with verified phone -> Log in directly
          const prof = rows[0];
          const t = prof.tenants || {};
          const session = {
            tenantId: t.id,
            username: t.username,
            businessName: t.business_name,
            category: t.category || 'Local Business',
            planTier: t.plan_tier || 'starter',
            city: prof.city || 'Raipur',
            phone: prof.phone,
            email: userEmail,
            loginAt: Date.now(),
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
          };
          createMerchantSession(session);
          return { status: 'logged_in', session };
        }
      }

      // First-time Google user or missing mandatory mobile number
      return {
        status: 'needs_profile_completion',
        googleUser: {
          email: userEmail,
          name: userName,
          avatar: user.user_metadata?.avatar_url || ''
        }
      };

    } catch (err) {
      console.error('OAuth callback parsing error:', err);
      return null;
    }
  }

  // Complete First-Time Google Merchant Profile with Mandatory Mobile & Subdomain
  async function completeGoogleMerchantProfile(profileData) {
    const phone = (profileData.phone || '').trim().replace(/[^0-9]/g, '');
    if (phone.length < 10) {
      return { success: false, error: 'A valid 10-digit WhatsApp mobile number is mandatory to receive customer leads.' };
    }
    if (!profileData.username) {
      return { success: false, error: 'Please choose your unique business username.' };
    }

    const cleanUser = profileData.username.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check availability
    const isAvail = await window.BusinessOnlineEngine?.isUsernameAvailable(cleanUser);
    if (!isAvail) {
      return { success: false, error: `Subdomain @${cleanUser} is already taken. Please choose another.` };
    }

    try {
      // 1. Create Tenant Record
      const tPayload = {
        username: cleanUser,
        business_name: profileData.businessName || cleanUser,
        category: profileData.category || 'Photography & Cinema',
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
        body: JSON.stringify(tPayload)
      });

      if (!tRes.ok) return { success: false, error: 'Could not create tenant profile.' };
      const created = (await tRes.json())[0];

      // 2. Create Profile with Mandatory Mobile Number
      const pPayload = {
        tenant_id: created.id,
        tagline: profileData.tagline || 'Official Verified Store on business-online.in',
        about_bio: `Welcome to ${profileData.businessName || cleanUser}.`,
        city: profileData.city || 'Raipur',
        phone: phone,
        whatsapp: phone,
        email: profileData.email || '',
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
        body: JSON.stringify(pPayload)
      });

      // 3. Create Session
      const session = {
        tenantId: created.id,
        username: cleanUser,
        businessName: tPayload.business_name,
        category: tPayload.category,
        planTier: 'starter',
        city: pPayload.city,
        phone: phone,
        email: pPayload.email,
        loginAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      createMerchantSession(session);
      return { success: true, session };

    } catch (err) {
      return { success: false, error: err.message };
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
    signInWithGoogle,
    handleOAuthCallback,
    completeGoogleMerchantProfile,
    getMerchantSession,
    logoutMerchant,
    requireAuthGuard,
    getRateLimitState,
    resolveIdentifierType
  };
})();
