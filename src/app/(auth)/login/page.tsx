'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimUsername, setClaimUsername] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState('');
  const [claimError, setClaimError] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Check URL query parameters (e.g. /login?tenant=clickerbabu)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const user = params.get('user') || params.get('tenant');
      if (user) setIdentifier(user);
    }
  }, []);

  // Lockout timer countdown effect
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Main Submit Handler (100% Pure Supabase Auth)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (lockoutTimer > 0) return;
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both identifier and password.');
      return;
    }

    setIsLoading(true);

    try {
      let resolvedEmail: string | null = null;
      let tenantRecord: any = null;
      const cleanId = identifier.trim().toLowerCase();

      // Check if identifier is email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
        resolvedEmail = cleanId;
        const { data: profiles } = await supabase
          .from('tenant_profiles')
          .select('*, tenants(*)')
          .eq('email', cleanId)
          .limit(1);
        if (profiles && profiles.length > 0) {
          tenantRecord = profiles[0].tenants;
        }
      } else if (/^[0-9]{10}$/.test(cleanId.replace(/[^0-9]/g, '').slice(-10))) {
        // Identifier is phone
        const cleanPhone = cleanId.replace(/[^0-9]/g, '').slice(-10);
        const { data: profiles } = await supabase
          .from('tenant_profiles')
          .select('*, tenants(*)')
          .ilike('phone', `%${cleanPhone}%`)
          .limit(1);
        if (profiles && profiles.length > 0) {
          resolvedEmail = profiles[0].email;
          tenantRecord = profiles[0].tenants;
        }
      } else {
        // Identifier is username/subdomain
        const { data: tenants } = await supabase
          .from('tenants')
          .select('*, tenant_profiles(*)')
          .eq('username', cleanId)
          .limit(1);
        if (tenants && tenants.length > 0) {
          tenantRecord = tenants[0];
          const prof = Array.isArray(tenantRecord.tenant_profiles) ? tenantRecord.tenant_profiles[0] : tenantRecord.tenant_profiles;
          resolvedEmail = prof?.email || null;
        }
      }

      if (!resolvedEmail) {
        setErrorMessage(`No registered merchant account found for "${identifier}".`);
        setIsLoading(false);
        return;
      }

      // Supabase Auth bcrypt verification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: password,
      });

      if (authError || !authData.session) {
        setErrorMessage('Invalid login password. Please check your credentials or click "Forgot Password?".');
        setIsLoading(false);
        return;
      }

      // Store session in storage
      const session = {
        tenantId: tenantRecord?.id || authData.user.id,
        username: tenantRecord?.username || cleanId,
        businessName: tenantRecord?.business_name || 'Merchant Store',
        category: tenantRecord?.category || 'Business Store',
        planTier: tenantRecord?.plan_tier || 'starter',
        email: resolvedEmail,
        loginAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('bo_merchant_session', JSON.stringify(session));

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network communication error connecting to database.');
    } finally {
      setIsLoading(false);
    }
  }

  // Claim Store Account Handler
  async function handleClaimStore(e: React.FormEvent) {
    e.preventDefault();
    setClaimError('');

    if (claimPassword !== claimConfirmPassword) {
      setClaimError('Passwords do not match.');
      return;
    }

    setIsClaiming(true);

    try {
      const cleanUser = claimUsername.trim().toLowerCase();
      const cleanMail = claimEmail.trim().toLowerCase();

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanMail,
        password: claimPassword,
      });

      if (authError) {
        setClaimError(authError.message);
        setIsClaiming(false);
        return;
      }

      // Update tenant_profiles email
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .eq('username', cleanUser)
        .limit(1);

      if (tenantData && tenantData.length > 0) {
        await supabase
          .from('tenant_profiles')
          .update({ email: cleanMail })
          .eq('tenant_id', tenantData[0].id);
      }

      setShowClaimModal(false);
      alert('Account secured successfully! Please sign in with your new password.');
    } catch (err: any) {
      setClaimError(err.message || 'Error claiming account.');
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {/* Top Brand Link */}
      <nav style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.05rem', color: '#FFF' }}>
          <span style={{ color: 'var(--gold-light)' }}>⚡</span>
          <span>business-online.in</span>
        </a>
        <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          ← Back to Directory
        </a>
      </nav>

      {/* Main Login Card */}
      <main className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px var(--gold-glow)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="badge-gold" style={{ marginBottom: '12px' }}>
            Merchant Cloud OS
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#FFF', marginBottom: '6px' }}>
            Merchant Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Access your studio control panel, portfolio manager, and customer leads.
          </p>
        </div>

        {/* 1. Google OAuth Button */}
        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 'var(--radius-md)', padding: '12px 18px', color: '#FFF', fontWeight: '600', fontSize: '0.92rem', marginBottom: '20px', transition: 'all 0.2s ease' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* 2. Divider */}
        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 12px' }}>or sign in with credentials</span>
          <span style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        {/* 3. Error Alert */}
        {errorMessage && (
          <div style={{ background: 'var(--rose-bg)', border: '1px solid var(--rose-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: '#FECACA', fontSize: '0.84rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠️</span>
            <div style={{ flex: 1 }}>{errorMessage}</div>
          </div>
        )}

        {/* 4. Single-Step Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '7px', fontWeight: '500' }}>
              Business Username, Mobile, or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. clickerbabu or 7047470742"
              required
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '13px 16px', color: '#FFF', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Password</label>
              <a href="https://wa.me/917047470742?text=Hi%20Support,%20I%20forgot%20my%20merchant%20password%20for%20business-online.in" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--gold-light)' }}>
                Forgot Password?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '13px 44px 13px 16px', color: '#FFF', fontSize: '0.95rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)', fontSize: '1rem' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
            <input
              type="checkbox"
              id="remCheck"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--gold-primary)', width: '16px', height: '16px' }}
            />
            <label htmlFor="remCheck" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Remember me on this device (30 Days)
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || lockoutTimer > 0}
            className="btn-gold"
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <span>⏳ Authenticating with Supabase...</span>
            ) : lockoutTimer > 0 ? (
              <span>🔒 Locked ({lockoutTimer}s)</span>
            ) : (
              <>
                <span>Sign In to Merchant Dashboard</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <footer style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Don't have a business subdomain yet?{' '}
          <button
            type="button"
            onClick={() => setShowClaimModal(true)}
            style={{ color: 'var(--gold-light)', textDecoration: 'underline', fontWeight: '600' }}
          >
            Claim your store in 60s →
          </button>
        </footer>
      </main>

      {/* Centered Fixed Claim Modal (Strictly Overlay) */}
      {showClaimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px 26px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge-gold">🔐 Store Account Claim</span>
              <button type="button" onClick={() => setShowClaimModal(false)} style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#FFF', marginBottom: '6px' }}>Claim &amp; Secure Store</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.4', marginBottom: '20px' }}>
              Bind your registered business store to an official email and create your secure password.
            </p>

            {claimError && (
              <div style={{ background: 'var(--rose-bg)', border: '1px solid var(--rose-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#FECACA', fontSize: '0.82rem', marginBottom: '16px' }}>
                {claimError}
              </div>
            )}

            <form onSubmit={handleClaimStore}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Business Subdomain / Store Handle</label>
                <input
                  type="text"
                  value={claimUsername}
                  onChange={e => setClaimUsername(e.target.value)}
                  placeholder="e.g. clickerbabu"
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Official Login Email</label>
                <input
                  type="email"
                  value={claimEmail}
                  onChange={e => setClaimEmail(e.target.value)}
                  placeholder="e.g. owner@clickerbabu.com"
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Create Secure Password (min 8 chars)</label>
                <input
                  type="password"
                  value={claimPassword}
                  onChange={e => setClaimPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Confirm Password</label>
                <input
                  type="password"
                  value={claimConfirmPassword}
                  onChange={e => setClaimConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <button type="submit" disabled={isClaiming} className="btn-gold" style={{ width: '100%' }}>
                {isClaiming ? 'Saving to Database...' : 'Claim Store & Secure Password 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
