import Link from 'next/link';
import { createServerClient } from '@/lib/supabaseServer';
import { Tenant, TenantProfile } from '@/lib/types';

export default async function DirectoryPage() {
  const supabase = createServerClient();

  // Fetch all active verified merchants from Supabase
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, tenant_profiles(*)')
    .eq('status', 'active')
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false });

  const merchantList = (tenants || []) as Tenant[];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="glass-panel" style={{ margin: '14px 20px', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem', color: 'var(--gold-light)' }}>⚡</span>
          <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#FFF', letterSpacing: '-0.02em' }}>
            business-online.in
          </span>
          <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            Merchant Cloud OS
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/login" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '9px 16px' }}>
            Merchant Login
          </Link>
          <Link href="/signup" className="btn-gold" style={{ fontSize: '0.85rem', padding: '9px 18px' }}>
            <span>Register Store in 60s</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '70px 20px 50px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <div className="badge-gold" style={{ marginBottom: '18px' }}>
          ✨ India's Premier Direct-to-Consumer Merchant Cloud
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', color: '#FFF', lineHeight: '1.15', marginBottom: '22px', fontWeight: '700' }}>
          Discover Verified Local Businesses &amp; Luxury Studios
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6', maxWidth: '720px', margin: '0 auto 36px' }}>
          Direct verified storefronts for luxury wedding photographers, gourmet confectioneries, healthcare clinics, and artisans. Zero commission. Direct WhatsApp booking.
        </p>

        {/* Quick Stats Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '36px', flexWrap: 'wrap', margin: '20px 0 40px' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gold-light)' }}>100%</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Verified Merchants</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--emerald)' }}>Direct</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>WhatsApp Inquiries</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFF' }}>0%</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Middleman Fee</div>
          </div>
        </div>
      </section>

      {/* Verified Merchants Directory Grid */}
      <section style={{ maxWidth: '1180px', margin: '0 auto 80px', width: '100%', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFF' }}>Featured Certified Businesses</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Browse official merchant storefronts and dynamic portfolios</p>
          </div>
          <span className="badge-gold">
            {merchantList.length} Active Stores
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {merchantList.map(merchant => {
            const prof = (Array.isArray(merchant.tenant_profiles) ? merchant.tenant_profiles[0] : merchant.tenant_profiles) as TenantProfile || {};
            const storeHref = `/?tenant=${merchant.username}`;

            return (
              <div key={merchant.id} className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', transition: 'all 0.25s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #8C6A24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#0D0B09' }}>
                    {merchant.business_name?.charAt(0) || 'M'}
                  </div>
                  {merchant.is_verified && (
                    <span className="badge-verified">✓ Verified</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '6px', fontWeight: '700' }}>
                  {merchant.business_name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--gold-light)', marginBottom: '10px', fontWeight: '600' }}>
                  {merchant.category} • {prof.city || 'India'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', flex: 1, marginBottom: '22px' }}>
                  {prof.tagline || prof.about_bio || `Explore packages and connect directly on WhatsApp with ${merchant.business_name}.`}
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href={storeHref} className="btn-gold" style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}>
                    <span>Visit Storefront</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '40px 20px', marginTop: 'auto', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>business-online.in</strong> • Premier Multi-Tenant Merchant Cloud Platform
        </p>
        <p>© 2026 business-online.in. All Rights Reserved. 256-Bit Encrypted Edge Infrastructure.</p>
      </footer>
    </div>
  );
}
