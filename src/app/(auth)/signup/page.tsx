'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [category, setCategory] = useState('Photography & Cinema');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setErrorMsg('Subdomain handle must be at least 3 characters.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp mobile number.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check Subdomain Availability
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('username', cleanUsername)
        .limit(1);

      if (existing && existing.length > 0) {
        setErrorMsg(`Subdomain @${cleanUsername} is already registered. Please choose another handle.`);
        setIsLoading(false);
        return;
      }

      // 2. Sign up with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            business_name: businessName.trim(),
            username: cleanUsername,
            phone: cleanPhone,
          },
        },
      });

      if (authErr && !authErr.message.includes('already registered')) {
        setErrorMsg(authErr.message);
        setIsLoading(false);
        return;
      }

      // 3. Insert into tenants table
      const { data: tenantData, error: tenantErr } = await supabase
        .from('tenants')
        .insert([{
          username: cleanUsername,
          business_name: businessName.trim(),
          category: category,
          plan_tier: 'starter',
          status: 'active',
          is_verified: true,
        }])
        .select();

      if (tenantErr || !tenantData) {
        setErrorMsg('Failed to register store profile. Please try again.');
        setIsLoading(false);
        return;
      }

      const newTenant = tenantData[0];

      // 4. Insert into tenant_profiles table
      await supabase
        .from('tenant_profiles')
        .insert([{
          tenant_id: newTenant.id,
          tagline: 'Official Verified Store on business-online.in',
          about_bio: `Welcome to ${businessName.trim()}. Contact us directly on WhatsApp for bookings and inquiries.`,
          city: city.trim() || 'Raipur',
          phone: `+91${cleanPhone.slice(-10)}`,
          whatsapp: cleanPhone.slice(-10),
          email: cleanEmail,
          rating: 5.0,
          reviews_count: 1,
        }]);

      // 5. Establish Session
      const session = {
        tenantId: newTenant.id,
        username: cleanUsername,
        businessName: businessName.trim(),
        category: category,
        planTier: 'starter',
        email: cleanEmail,
        loginAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      };

      localStorage.setItem('bo_merchant_session', JSON.stringify(session));
      router.push('/dashboard');

    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed due to network error.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <nav style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.05rem', color: '#FFF' }}>
          <span style={{ color: 'var(--gold-light)' }}>⚡</span>
          <span>business-online.in</span>
        </Link>
        <Link href="/login" style={{ fontSize: '0.82rem', color: 'var(--gold-light)' }}>
          Sign In instead →
        </Link>
      </nav>

      <main className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '36px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px var(--gold-glow)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="badge-gold" style={{ marginBottom: '12px' }}>
            Instant Onboarding
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#FFF', marginBottom: '6px' }}>
            Claim Your Business Store
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Launch your official merchant subdomain and portfolio in 60 seconds.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--rose-bg)', border: '1px solid var(--rose-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: '#FECACA', fontSize: '0.84rem', marginBottom: '18px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Business / Studio Name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => {
                setBusinessName(e.target.value);
                if (!subdomain) {
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                }
              }}
              placeholder="e.g. Royal Cinematic Studio"
              required
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Choose Store Subdomain</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="royalcinematics"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 140px 11px 14px', color: 'var(--gold-light)', fontWeight: '600', fontSize: '0.9rem', outline: 'none' }}
              />
              <span style={{ position: 'absolute', right: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                .business-online.in
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', background: '#1A1714', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 10px', color: '#FFF', fontSize: '0.85rem', outline: 'none' }}
              >
                <option value="Photography & Cinema">Photography & Cinema</option>
                <option value="Sweets & Confectionery">Sweets & Bakery</option>
                <option value="Healthcare & Clinics">Healthcare & Clinics</option>
                <option value="Fashion & Couture">Fashion & Couture</option>
                <option value="Hospitality & Catering">Hospitality</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Raipur"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>WhatsApp Mobile</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Login Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@studio.com"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Create Secure Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-gold" style={{ width: '100%' }}>
            {isLoading ? 'Creating Store on Supabase...' : 'Launch Verified Storefront →'}
          </button>
        </form>
      </main>
    </div>
  );
}
