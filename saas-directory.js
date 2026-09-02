/**
 * business-online.in — SaaS Directory & Multi-Tenant Engine Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initMultiTenantRouter();
});

function initMultiTenantRouter() {
  const activeTenant = window.BusinessOnlineEngine.resolveTenant();

  const saasContainer = document.getElementById('saasPlatformContainer');
  const customTenantContainer = document.getElementById('customTenantContainer');
  const genericTenantContainer = document.getElementById('genericTenantContainer');

  if (!saasContainer) return;

  if (activeTenant) {
    // Hide SaaS Platform Landing Page
    saasContainer.style.display = 'none';

    if (activeTenant.isCustomLayout) {
      // Show Bespoke Flagship Layout (Story by Clicker Babu)
      if (customTenantContainer) customTenantContainer.style.display = 'block';
      if (genericTenantContainer) genericTenantContainer.style.display = 'none';
      injectPoweredByBadge(activeTenant);
    } else {
      // Render Standard Multi-Tenant Storefront Layout dynamically
      if (customTenantContainer) customTenantContainer.style.display = 'none';
      if (genericTenantContainer) {
        genericTenantContainer.style.display = 'block';
        renderGenericTenant(activeTenant);
      }
      injectPoweredByBadge(activeTenant);
    }
  } else {
    // Render Main SaaS & Justdial Directory Platform
    saasContainer.style.display = 'block';
    if (customTenantContainer) customTenantContainer.style.display = 'none';
    if (genericTenantContainer) genericTenantContainer.style.display = 'none';
    
    initSaaSDirectoryFeatures();
  }
}

function initSaaSDirectoryFeatures() {
  // 1. Subdomain Availability Live Checker
  const subdomainInput = document.getElementById('subdomainClaimInput');
  const claimBtn = document.getElementById('subdomainClaimBtn');
  const statusMsg = document.getElementById('subdomainStatusMsg');

  if (subdomainInput && claimBtn) {
    const checkAvailability = () => {
      const val = subdomainInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      subdomainInput.value = val;
      
      if (!val) {
        statusMsg.style.display = 'none';
        return;
      }

      statusMsg.style.display = 'block';
      const existing = window.BusinessOnlineEngine.TENANTS[val];
      if (existing) {
        statusMsg.style.color = '#EF4444';
        statusMsg.innerHTML = `❌ <strong>${val}.business-online.in</strong> is already claimed by <em>${existing.businessName}</em>. <a href="?tenant=${val}" style="color:#60A5FA; text-decoration:underline;">View Website →</a>`;
      } else {
        statusMsg.style.color = '#10B981';
        statusMsg.innerHTML = `✨ <strong>${val}.business-online.in</strong> is available! Ready to launch in 60s.`;
      }
    };

    subdomainInput.addEventListener('input', checkAvailability);
    
    claimBtn.addEventListener('click', () => {
      const val = subdomainInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (val) {
        openOnboardingModal(val);
      } else {
        subdomainInput.focus();
      }
    });
  }

  // 2. Render Business Directory Cards
  renderDirectoryListingsings();

  // 3. Search & Filter Listeners
  const searchInput = document.getElementById('directorySearchInput');
  const citySelect = document.getElementById('directoryCitySelect');
  const categoryChips = document.querySelectorAll('.cat-chip');

  let currentCategory = 'all';

  function applyFilters() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const city = (citySelect?.value || 'all').toLowerCase();
    
    renderDirectoryListingsings(query, currentCategory, city);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (citySelect) citySelect.addEventListener('change', applyFilters);

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-cat') || 'all';
      applyFilters();
    });
  });

  // 4. Modal Triggers
  const openModalBtns = document.querySelectorAll('.js-open-onboarding');
  const closeModalBtn = document.getElementById('closeOnboardModal');
  const modalBackdrop = document.getElementById('onboardModalBackdrop');
  const onboardForm = document.getElementById('onboardVendorForm');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openOnboardingModal();
    });
  });

  if (closeModalBtn && modalBackdrop) {
    closeModalBtn.addEventListener('click', () => modalBackdrop.classList.remove('active'));
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.classList.remove('active');
    });
  }

  if (onboardForm) {
    onboardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        username: document.getElementById('newUsername').value,
        businessName: document.getElementById('newBusinessName').value,
        category: document.getElementById('newCategory').value,
        city: document.getElementById('newCity').value,
        phone: document.getElementById('newPhone').value,
        whatsapp: document.getElementById('newPhone').value,
        tagline: document.getElementById('newTagline').value || 'Proudly powered by business-online.in'
      };

      const newTenant = window.BusinessOnlineEngine.registerNewTenant(formData);
      if (newTenant) {
        modalBackdrop.classList.remove('active');
        alert(`🎉 Congratulations! Your website ${newTenant.username}.business-online.in has been generated!`);
        window.location.search = `?tenant=${newTenant.username}`;
      }
    });
  }
}

function openOnboardingModal(prefillUsername = '') {
  const modalBackdrop = document.getElementById('onboardModalBackdrop');
  const usernameInput = document.getElementById('newUsername');
  if (modalBackdrop) {
    if (usernameInput && prefillUsername) {
      usernameInput.value = prefillUsername;
    }
    modalBackdrop.classList.add('active');
  }
}

function renderDirectoryListingsings(query = '', category = 'all', city = 'all') {
  const grid = document.getElementById('directoryGrid');
  if (!grid) return;

  const allTenants = window.BusinessOnlineEngine.getAllTenants();
  
  const filtered = allTenants.filter(t => {
    const matchQuery = !query || 
      t.businessName.toLowerCase().includes(query) || 
      t.about.toLowerCase().includes(query) || 
      t.category.toLowerCase().includes(query) || 
      t.tagline.toLowerCase().includes(query);

    const matchCat = (category === 'all') || t.category.toLowerCase().includes(category.toLowerCase());
    const matchCity = (city === 'all') || (t.location.city && t.location.city.toLowerCase() === city);

    return matchQuery && matchCat && matchCity;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #9CA3AF;">
        <h3>No verified businesses found matching your criteria.</h3>
        <p style="margin-top: 8px;">Be the first to list your business in this category!</p>
        <button class="saas-btn-primary js-open-onboarding" style="margin-top: 16px;">+ Register Your Business</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(t => `
    <div class="business-card">
      <div class="card-cover" style="background-image: url('${t.heroCover || (t.catalog && t.catalog[0]?.img) || 'assets/images/portfolio/hero_monochrome_symphony.webp'}')">
        <div class="card-subdomain-pill">⚡ ${t.username}.business-online.in</div>
        <div class="card-verified-badge">✓ Verified</div>
      </div>
      <div class="card-body">
        <div class="card-category">${t.category}</div>
        <h3 class="card-title">${t.businessName}</h3>
        <div class="card-rating-row">
          <span class="rating-stars">★★★★★</span>
          <span class="rating-num">${t.rating || '5.0'}</span>
          <span class="reviews-cnt">(${t.reviewsCount || '1'} reviews) • 📍 ${t.location.city}</span>
        </div>
        <p class="card-desc">${t.about.substring(0, 130)}...</p>
        <div class="card-footer">
          <a href="?tenant=${t.username}" class="card-btn-visit">Visit Website →</a>
          <a href="https://wa.me/${t.contact.whatsapp}?text=Hi%20${encodeURIComponent(t.businessName)},%20I%20found%20you%20on%20business-online.in" target="_blank" rel="noopener" class="card-btn-wa" title="Instant WhatsApp">💬</a>
        </div>
      </div>
    </div>
  `).join('');
}

function renderGenericTenant(tenant) {
  const container = document.getElementById('genericTenantContainer');
  if (!container) return;

  document.title = `${tenant.businessName} | Official Store • business-online.in`;

  container.innerHTML = `
    <div class="generic-tenant-view" style="background-color: ${tenant.theme.bg || '#0F172A'}; color: ${tenant.theme.textColor || '#F8FAFC'};">
      <header class="generic-tenant-header">
        <div style="font-weight: 800; font-size: 1.3rem; color: ${tenant.theme.primaryColor || '#10B981'};">
          ${tenant.businessName}
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 0.85rem; color: #94A3B8;">📍 ${tenant.location.address || tenant.location.city}</span>
          <a href="https://wa.me/${tenant.contact.whatsapp}?text=Hi%20${encodeURIComponent(tenant.businessName)},%20I%20want%20to%20inquire" target="_blank" class="saas-btn-primary" style="background: ${tenant.theme.primaryColor || '#10B981'};">
            💬 WhatsApp Us
          </a>
        </div>
      </header>

      <section class="generic-hero" style="background: linear-gradient(to bottom, rgba(0,0,0,0.6), ${tenant.theme.bg || '#0F172A'}), url('${tenant.heroCover || ''}') center/cover;">
        <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(255,255,255,0.1); font-size: 0.82rem; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.15);">
          Official Verified Business • ${tenant.category}
        </div>
        <h1 style="font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 800; margin-bottom: 16px;">
          ${tenant.businessName}
        </h1>
        <p style="font-size: 1.2rem; color: #CBD5E1; margin-bottom: 30px; font-weight: 400;">
          ${tenant.tagline}
        </p>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
          <a href="#catalog" class="saas-btn-primary" style="background: ${tenant.theme.primaryColor || '#10B981'}; padding: 12px 28px;">
            Explore Services & Menu
          </a>
          <a href="tel:${tenant.contact.phone}" class="saas-btn-outline" style="padding: 12px 28px;">
            📞 Call Now: ${tenant.contact.phone}
          </a>
        </div>
      </section>

      <main style="max-width: 1100px; margin: 0 auto; padding: 60px 5%;">
        <div style="margin-bottom: 50px;">
          <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 12px; border-left: 4px solid ${tenant.theme.primaryColor || '#10B981'}; padding-left: 14px;">
            About Our Business
          </h2>
          <p style="font-size: 1.05rem; line-height: 1.8; color: #CBD5E1;">
            ${tenant.about}
          </p>
        </div>

        <div id="catalog" style="margin-bottom: 60px;">
          <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 24px; border-left: 4px solid ${tenant.theme.primaryColor || '#10B981'}; padding-left: 14px;">
            Featured Offerings & Pricing
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            ${(tenant.catalog || []).map(item => `
              <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;">
                ${item.img ? `<div style="height: 180px; background: url('${item.img}') center/cover;"></div>` : ''}
                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                  <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px;">${item.title}</h3>
                  <p style="color: #94A3B8; font-size: 0.9rem; margin-bottom: 16px; flex: 1;">${item.desc || ''}</p>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
                    <span style="font-size: 1.1rem; font-weight: 800; color: ${tenant.theme.primaryColor || '#10B981'};">${item.price || ''}</span>
                    <a href="https://wa.me/${tenant.contact.whatsapp}?text=Hi%20${encodeURIComponent(tenant.businessName)},%20I%20am%20interested%20in%20${encodeURIComponent(item.title)}" target="_blank" class="saas-btn-primary" style="padding: 6px 14px; font-size: 0.85rem; background: ${tenant.theme.primaryColor || '#10B981'};">
                      Inquire on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>
    </div>
  `;
}

function injectPoweredByBadge(tenant) {
  const existing = document.getElementById('saasPoweredBadge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'saasPoweredBadge';
  badge.className = 'top-tenant-badge-bar';
  badge.innerHTML = `
    <span>⚡ <strong>${tenant.username}.business-online.in</strong></span>
    <span>•</span>
    <a href="?">← Back to business-online.in Directory</a>
  `;
  document.body.appendChild(badge);
}
