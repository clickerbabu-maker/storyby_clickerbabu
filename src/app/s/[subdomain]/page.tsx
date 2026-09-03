import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabaseServer';
import { CatalogItem, Tenant, TenantProfile } from '@/lib/types';

interface StorefrontProps {
  params: Promise<{ subdomain: string }>;
}

// 1. Dynamic Server-Side SEO & WhatsApp / Social Link Preview Cards
export async function generateMetadata({ params }: StorefrontProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = createServerClient();

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, tenant_profiles(*)')
    .eq('username', subdomain.toLowerCase())
    .limit(1);

  if (!tenants || tenants.length === 0) {
    return {
      title: 'Store Not Found | business-online.in',
      description: 'The requested business merchant store does not exist.',
    };
  }

  const tenant = tenants[0] as Tenant;
  const profile = (Array.isArray(tenant.tenant_profiles) ? tenant.tenant_profiles[0] : tenant.tenant_profiles) as TenantProfile || {};

  const title = `${tenant.business_name} | Verified ${tenant.category} on business-online.in`;
  const description = profile.tagline || profile.about_bio || `Connect directly with ${tenant.business_name} on WhatsApp.`;
  const heroImage = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${tenant.username}.business-online.in`,
      siteName: 'business-online.in',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: tenant.business_name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
    other: profile.theme_config?.google_verification ? {
      'google-site-verification': profile.theme_config.google_verification,
    } : {},
  };
}

// 2. Server-Side Rendered Storefront Page
export default async function StorefrontPage({ params }: StorefrontProps) {
  const { subdomain } = await params;
  const supabase = createServerClient();

  // Fetch full merchant data, profile, and catalog items in parallel
  const [tenantRes, catalogRes] = await Promise.all([
    supabase
      .from('tenants')
      .select('*, tenant_profiles(*)')
      .eq('username', subdomain.toLowerCase())
      .limit(1),
    supabase
      .from('catalogs_and_services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
  ]);

  if (!tenantRes.data || tenantRes.data.length === 0) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '40px 28px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🏪</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFF', marginBottom: '10px' }}>Store Handle Not Registered</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
            The subdomain <strong>@{subdomain}</strong> is currently available. You can claim it and build your verified business storefront in under 60 seconds.
          </p>
          <a href="/signup" className="btn-gold" style={{ width: '100%' }}>
            Claim @{subdomain} &amp; Create Store →
          </a>
        </div>
      </main>
    );
  }

  const tenant = tenantRes.data[0] as Tenant;
  const profile = (Array.isArray(tenant.tenant_profiles) ? tenant.tenant_profiles[0] : tenant.tenant_profiles) as TenantProfile || {};
  
  // Filter catalog by tenant_id
  const catalogItems = ((catalogRes.data || []) as CatalogItem[]).filter(item => item.tenant_id === tenant.id);

  // Trigger atomic view increment RPC in background
  try {
    await supabase.rpc('increment_tenant_views', { target_tenant_id: tenant.id });
  } catch (e) {
    // Non-blocking view ping
  }

  const waNumber = (profile.whatsapp || profile.phone || '917047470742').replace(/[^0-9]/g, '');
  const generalWaLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${tenant.business_name}, I saw your verified store on business-online.in and would like to inquire about your services.`)}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Merchant Sticky Header */}
      <header className="glass-panel" style={{ position: 'sticky', top: '12px', zIndex: 100, margin: '12px 20px', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #8C6A24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', color: '#0D0B09' }}>
            {tenant.business_name?.charAt(0) || 'M'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#FFF' }}>{tenant.business_name}</span>
              {tenant.is_verified && (
                <span className="badge-verified">✓ Verified Store</span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {tenant.category} • {profile.city ? `${profile.city}, India` : 'India'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/login" className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
            Merchant Login
          </a>
          <a href={generalWaLink} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ fontSize: '0.85rem', padding: '9px 18px' }}>
            <span>Connect on WhatsApp</span>
            <span>↗</span>
          </a>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <section style={{ padding: '60px 20px 40px', maxWidth: '1140px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <div className="badge-gold" style={{ marginBottom: '16px' }}>
          ⭐ Official Verified Merchant • {tenant.plan_tier ? tenant.plan_tier.toUpperCase() : 'STARTER'} TIER
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: '700', color: '#FFF', lineHeight: '1.2', marginBottom: '18px' }}>
          {profile.tagline || `Exclusive Services & Portfolio by ${tenant.business_name}`}
        </h1>
        <p style={{ maxWidth: '680px', margin: '0 auto 28px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          {profile.about_bio || `Welcome to ${tenant.business_name}. Book direct with verified owner pricing and instant confirmation via WhatsApp.`}
        </p>

        {/* Quick Social & Trust Metrics */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', margin: '24px 0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold-light)', fontSize: '1.2rem' }}>★</span>
            <span style={{ fontWeight: '700', color: '#FFF' }}>{profile.rating ? Number(profile.rating).toFixed(1) : '5.0'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({profile.reviews_count || 1} verified reviews)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--emerald)', fontSize: '1.1rem' }}>👁️</span>
            <span style={{ fontWeight: '700', color: '#FFF' }}>{(tenant.views_count || 0).toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>storefront views</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>📍</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{profile.city || 'Raipur'}, {profile.state || 'Chhattisgarh'}</span>
          </div>
        </div>
      </section>

      {/* Catalog & Services Grid */}
      <section style={{ maxWidth: '1140px', margin: '0 auto 80px', width: '100%', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFF', marginBottom: '6px' }}>
              Featured Packages &amp; Offerings
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Select a service to initiate an instant direct inquiry on WhatsApp.
            </p>
          </div>
          <span className="badge-gold">
            {catalogItems.length} {catalogItems.length === 1 ? 'Offering' : 'Offerings'}
          </span>
        </div>

        {catalogItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>No catalog items added yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Merchant will be publishing new packages shortly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {catalogItems.map((item) => {
              const fallbackImg = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';
              const itemImg = item.image_url || fallbackImg;
              const waItemLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${tenant.business_name}, I am interested in booking "${item.title}" listed on your verified storefront for ${item.price_display || 'the advertised price'}.`)}`;

              return (
                <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease' }}>
                  <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                    <Image
                      src={itemImg}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      <span style={{ background: 'rgba(13, 11, 9, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-gold)', color: 'var(--gold-light)', padding: '5px 12px', borderRadius: 'var(--radius-full)', fontWeight: '700', fontSize: '0.82rem' }}>
                        {item.price_display || 'Price on request'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#FFF', marginBottom: '8px', fontWeight: '600' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                      {item.description || 'Verified authentic offering from this certified merchant.'}
                    </p>

                    <a href={waItemLink} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ width: '100%', padding: '11px 18px', fontSize: '0.88rem' }}>
                      <span>Book on WhatsApp</span>
                      <span>💬</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 20px', marginTop: 'auto', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '8px' }}>
          Official Storefront of <strong>{tenant.business_name}</strong> • Powered by{' '}
          <a href="/" style={{ color: 'var(--gold-light)', textDecoration: 'underline' }}>business-online.in</a>
        </p>
        <p>Merchant Cloud OS &bull; 256-Bit Encrypted Multi-Tenant Infrastructure</p>
      </footer>
    </div>
  );
}
