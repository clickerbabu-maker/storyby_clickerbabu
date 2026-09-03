'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CatalogItem, LeadInquiry, Tenant, TenantProfile } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'catalog' | 'leads' | 'seo'>('overview');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profile, setProfile] = useState<TenantProfile>({ tenant_id: '' });
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [leads, setLeads] = useState<LeadInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Profile Form States
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Catalog Add Form States
  const [showAddCatalog, setShowAddCatalog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isAddingCatalog, setIsAddingCatalog] = useState(false);

  // File upload state & handler
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenant.id);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewImage(data.url);
        showToast('Photo uploaded to Supabase Storage!');
      } else {
        showToast(data.error || 'Failed to upload photo.');
      }
    } catch (err) {
      showToast('Error uploading photo.');
    } finally {
      setIsUploading(false);
    }
  }

  // SEO Verification
  const [googleVerification, setGoogleVerification] = useState('');
  const [isSavingVerification, setIsSavingVerification] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  }

  // Load Session and Hydrate Dashboard
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setFatalError('');

    try {
      const sessionRaw = localStorage.getItem('bo_merchant_session') || sessionStorage.getItem('bo_merchant_session');
      if (!sessionRaw) {
        router.push('/login');
        return;
      }

      const session = JSON.parse(sessionRaw);
      if (!session.tenantId) {
        router.push('/login');
        return;
      }

      // Fetch live tenant & profile
      const { data: tenantRows, error: tenantErr } = await supabase
        .from('tenants')
        .select('*, tenant_profiles(*)')
        .eq('id', session.tenantId)
        .limit(1);

      if (tenantErr || !tenantRows || tenantRows.length === 0) {
        setFatalError('Merchant records could not be loaded from database. Please sign in again.');
        setIsLoading(false);
        return;
      }

      const t = tenantRows[0] as Tenant;
      const p = (Array.isArray(t.tenant_profiles) ? t.tenant_profiles[0] : t.tenant_profiles) as TenantProfile || { tenant_id: t.id };

      setTenant(t);
      setProfile(p);

      // Fill profile inputs
      setEditBusinessName(t.business_name || '');
      setEditCategory(t.category || 'Business Store');
      setEditTagline(p.tagline || '');
      setEditPhone(p.phone || '');
      setEditEmail(p.email || '');
      setEditCity(p.city || '');
      setEditAddress(p.address || '');
      setEditAbout(p.about_bio || '');
      setGoogleVerification(p.theme_config?.google_verification || '');

      // Load Catalog & Leads in parallel
      const [catRes, leadsRes] = await Promise.all([
        supabase
          .from('catalogs_and_services')
          .select('*')
          .eq('tenant_id', t.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('leads_and_inquiries')
          .select('*')
          .eq('tenant_id', t.id)
          .order('created_at', { ascending: false }),
      ]);

      setCatalogItems((catRes.data || []) as CatalogItem[]);
      setLeads((leadsRes.data || []) as LeadInquiry[]);

    } catch (err: any) {
      setFatalError('Network error connecting to database.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Profile Save
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setIsSavingProfile(true);

    try {
      await Promise.all([
        supabase
          .from('tenants')
          .update({ business_name: editBusinessName, category: editCategory })
          .eq('id', tenant.id),
        supabase
          .from('tenant_profiles')
          .update({
            tagline: editTagline,
            about_bio: editAbout,
            city: editCity,
            address: editAddress,
            phone: editPhone,
            whatsapp: editPhone,
            email: editEmail,
          })
          .eq('tenant_id', tenant.id),
      ]);

      setTenant({ ...tenant, business_name: editBusinessName, category: editCategory });
      setProfile({
        ...profile,
        tagline: editTagline,
        about_bio: editAbout,
        city: editCity,
        address: editAddress,
        phone: editPhone,
        whatsapp: editPhone,
        email: editEmail,
      });

      showToast('Storefront profile updated live in database!');
    } catch (e) {
      showToast('Error saving profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Catalog Add
  async function handleAddCatalogItem(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setIsAddingCatalog(true);

    const defaultImg = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80';
    const payload = {
      tenant_id: tenant.id,
      title: newTitle.trim(),
      price_display: newPrice.trim(),
      description: newDesc.trim(),
      image_url: newImage.trim() || defaultImg,
      category_tag: tenant.category,
      is_featured: true,
      display_order: catalogItems.length + 1,
    };

    try {
      const { data, error } = await supabase
        .from('catalogs_and_services')
        .insert([payload])
        .select();

      if (!error && data) {
        setCatalogItems([data[0] as CatalogItem, ...catalogItems]);
        setNewTitle('');
        setNewPrice('');
        setNewDesc('');
        setNewImage('');
        setShowAddCatalog(false);
        showToast(`"${payload.title}" added to live catalog!`);
      } else {
        showToast('Failed to add catalog item.');
      }
    } catch (e) {
      showToast('Network error saving item.');
    } finally {
      setIsAddingCatalog(false);
    }
  }

  // Catalog Delete
  async function handleDeleteCatalogItem(id: string, title: string) {
    if (!confirm(`Are you sure you want to remove "${title}" from your live store?`)) return;

    try {
      await supabase.from('catalogs_and_services').delete().eq('id', id);
      setCatalogItems(catalogItems.filter(i => i.id !== id));
      showToast('Item deleted from live store.');
    } catch (e) {
      showToast('Error deleting item.');
    }
  }

  // Lead Status Toggle
  async function handleToggleLeadStatus(lead: LeadInquiry) {
    const newStatus = lead.status === 'contacted' ? 'new' : 'contacted';
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));

    try {
      await supabase.from('leads_and_inquiries').update({ status: newStatus }).eq('id', lead.id);
    } catch (e) {}
  }

  // Delete Lead
  async function handleDeleteLead(id: string) {
    if (!confirm('Permanently delete this inquiry?')) return;
    setLeads(leads.filter(l => l.id !== id));
    showToast('Inquiry removed.');

    try {
      await supabase.from('leads_and_inquiries').delete().eq('id', id);
    } catch (e) {}
  }

  // Save Google Verification
  async function handleSaveVerification() {
    if (!tenant) return;
    setIsSavingVerification(true);

    const updatedConfig = {
      ...(profile.theme_config || {}),
      google_verification: googleVerification.trim(),
    };

    try {
      await supabase
        .from('tenant_profiles')
        .update({ theme_config: updatedConfig })
        .eq('tenant_id', tenant.id);

      setProfile({ ...profile, theme_config: updatedConfig });
      showToast('Google Site Verification token saved!');
    } catch (e) {
      showToast('Error saving verification token.');
    } finally {
      setIsSavingVerification(false);
    }
  }

  function handleLogout() {
    if (confirm('Are you sure you want to sign out of your merchant control panel?')) {
      localStorage.removeItem('bo_merchant_session');
      sessionStorage.removeItem('bo_merchant_session');
      router.push('/login');
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
          <p style={{ color: 'var(--gold-light)', fontWeight: '600' }}>Loading Merchant Cloud OS...</p>
        </div>
      </div>
    );
  }

  if (fatalError || !tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center' }}>
          <span style={{ fontSize: '2.8rem' }}>⚠️</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#FFF', margin: '14px 0 8px' }}>Connection Error</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>{fatalError}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={loadDashboardData} className="btn-gold" style={{ flex: 1 }}>Retry</button>
            <button onClick={handleLogout} className="btn-ghost" style={{ flex: 1 }}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const storeUrl = `http://localhost:3000?tenant=${tenant.username}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--bg-card)', border: '1px solid var(--gold-light)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', boxShadow: '0 12px 30px rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--gold-light)' }}>✓</span>
          <span style={{ fontSize: '0.88rem' }}>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="glass-panel" style={{ margin: '12px 20px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #8C6A24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0D0B09' }}>
            {tenant.business_name?.charAt(0) || 'M'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#FFF' }}>{tenant.business_name}</span>
              <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {tenant.plan_tier ? tenant.plan_tier.toUpperCase() : 'PRO'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              @{tenant.username}.business-online.in
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
            <span>View Live Store</span>
            <span>↗</span>
          </a>
          <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#FDA4AF' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', padding: '20px 20px 80px' }}>
        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '32px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Storefront Views</div>
            <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#FFF' }}>{(tenant.views_count || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '6px' }}>⚡ Atomic Real-Time Edge Counter</div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Inquiries Received</div>
            <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--gold-light)' }}>{leads.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Direct customer inquiries</div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Customer Rating</div>
            <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#FFF' }}>{profile.rating ? Number(profile.rating).toFixed(1) : '5.0'} ★</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Based on {profile.reviews_count || 1} reviews</div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Active Plan</div>
            <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#FFF', textTransform: 'capitalize' }}>{tenant.plan_tier || 'Starter'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '6px' }}>✓ 256-Bit Encrypted Multi-Tenant</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '28px', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: '📊 Store Overview' },
            { id: 'catalog', label: `🛍️ Catalog Offerings (${catalogItems.length})` },
            { id: 'leads', label: `💬 Customer Inquiries (${leads.length})` },
            { id: 'profile', label: '👤 Profile & Contact' },
            { id: 'seo', label: '🔍 Google SEO & Verification' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? '#0D0B09' : 'var(--text-secondary)',
                background: activeTab === tab.id ? 'var(--gold-light)' : 'transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFF', marginBottom: '12px' }}>Storefront Configuration</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your business is active and visible on the merchant discovery network.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Store Subdomain</label>
                <input
                  type="text"
                  readOnly
                  value={`${tenant.username}.business-online.in`}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', color: 'var(--gold-light)', marginTop: '6px', fontWeight: '600' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Primary Contact Phone</label>
                <input
                  type="text"
                  readOnly
                  value={profile.phone || 'Not set'}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '14px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(storeUrl);
                  showToast('Live store URL copied to clipboard!');
                }}
                className="btn-gold"
              >
                Copy Storefront Link 🔗
              </button>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                Open Storefront In New Tab ↗
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG CRUD */}
        {activeTab === 'catalog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFF' }}>Catalog Packages &amp; Offerings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Direct Supabase REST database synchronization</p>
              </div>
              <button
                onClick={() => setShowAddCatalog(!showAddCatalog)}
                className="btn-gold"
                style={{ fontSize: '0.88rem', padding: '10px 20px' }}
              >
                {showAddCatalog ? '✕ Cancel' : '+ Add New Offering'}
              </button>
            </div>

            {/* Add Service Box */}
            {showAddCatalog && (
              <form onSubmit={handleAddCatalogItem} className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
                <h4 style={{ color: '#FFF', marginBottom: '18px' }}>Create New Offering</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Service / Package Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Royal Wedding Package"
                      required
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Display Price</label>
                    <input
                      type="text"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="e.g. ₹1,50,000"
                      required
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Upload Photo from Device (or enter URL)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '6px 0 8px' }}>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                    />
                    {isUploading && <span style={{ fontSize: '0.8rem', color: 'var(--gold-light)' }}>Uploading to Storage...</span>}
                  </div>
                  <input
                    type="url"
                    value={newImage}
                    onChange={e => setNewImage(e.target.value)}
                    placeholder="Or paste photo URL (https://...)"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: '#FFF' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Details about what is included in this service..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                  />
                </div>

                <button type="submit" disabled={isAddingCatalog} className="btn-gold">
                  {isAddingCatalog ? 'Saving to Database...' : 'Publish Offering to Live Store →'}
                </button>
              </form>
            )}

            {/* Catalog Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '22px' }}>
              {catalogItems.map(item => (
                <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                    <Image
                      src={item.image_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'}
                      alt={item.title}
                      fill
                      sizes="300px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ color: '#FFF', fontSize: '1.05rem', fontWeight: '600' }}>{item.title}</h4>
                      <span style={{ color: 'var(--gold-light)', fontWeight: '700', fontSize: '0.92rem' }}>{item.price_display}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flex: 1, marginBottom: '16px' }}>{item.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id.slice(0, 8)}...</span>
                      <button
                        onClick={() => handleDeleteCatalogItem(item.id, item.title)}
                        style={{ color: '#FDA4AF', fontSize: '0.8rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244,63,94,0.3)' }}
                      >
                        Delete Offering
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER LEADS INBOX */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFF' }}>Customer Inquiries Inbox</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leads submitted directly from your storefront</p>
              </div>
              <button onClick={loadDashboardData} className="btn-ghost" style={{ fontSize: '0.82rem' }}>
                🔄 Refresh Leads
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>💬</span>
                <h4 style={{ color: '#FFF', marginBottom: '6px' }}>No Inquiries Yet</h4>
                <p style={{ fontSize: '0.88rem' }}>When visitors click inquiry buttons on your store, their details will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {leads.map(lead => {
                  const waNumber = (lead.customer_phone || '').replace(/[^0-9]/g, '');
                  const waReply = waNumber
                    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.customer_name}, thank you for inquiring about ${lead.service_interested || 'our services'} with ${tenant.business_name}!`)}`
                    : '#';

                  return (
                    <div key={lead.id} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', color: '#FFF', fontSize: '1.05rem' }}>{lead.customer_name}</span>
                          <span className={lead.status === 'contacted' ? 'badge-gold' : 'badge-verified'} style={{ fontSize: '0.7rem' }}>
                            {lead.status === 'contacted' ? 'Contacted' : 'New Lead'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Inquired: <strong>{lead.service_interested || 'General Service'}</strong> • Phone: {lead.customer_phone || 'WhatsApp Visitor'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {waNumber && (
                          <a href={waReply} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
                            <span>Reply on WhatsApp</span>
                            <span>↗</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleToggleLeadStatus(lead)}
                          className="btn-ghost"
                          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                        >
                          {lead.status === 'contacted' ? 'Mark New' : 'Mark Contacted'}
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          style={{ color: '#FDA4AF', padding: '8px 12px', fontSize: '0.88rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE & CONTACT SETTINGS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFF', marginBottom: '8px' }}>Storefront Business Profile</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Update your public business identity and WhatsApp contact numbers</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Business Name</label>
                <input
                  type="text"
                  value={editBusinessName}
                  onChange={e => setEditBusinessName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Category</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tagline / Headline</label>
              <input
                type="text"
                value={editTagline}
                onChange={e => setEditTagline(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>WhatsApp Mobile (+91)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>City &amp; State</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>About Studio / Bio</label>
              <textarea
                rows={4}
                value={editAbout}
                onChange={e => setEditAbout(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
              />
            </div>

            <button type="submit" disabled={isSavingProfile} className="btn-gold">
              {isSavingProfile ? 'Saving to Database...' : 'Save Profile Changes →'}
            </button>
          </form>
        )}

        {/* TAB 5: GOOGLE SEO & VERIFICATION */}
        {activeTab === 'seo' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFF', marginBottom: '8px' }}>Google Search Console Verification</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Connect your verified Google Search Console HTML verification token to index your storefront on Google Search.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>google-site-verification Token</label>
              <input
                type="text"
                value={googleVerification}
                onChange={e => setGoogleVerification(e.target.value)}
                placeholder="e.g. WNrYgNcywMp8yDodU1Awa_qfCWM08myee2ZKr_SW_To"
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', borderRadius: 'var(--radius-md)', color: '#FFF', marginTop: '6px' }}
              />
            </div>

            <button onClick={handleSaveVerification} disabled={isSavingVerification} className="btn-gold">
              {isSavingVerification ? 'Saving Token...' : 'Save Verification Token'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
