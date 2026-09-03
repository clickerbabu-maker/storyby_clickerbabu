export interface Tenant {
  id: string;
  username: string;
  business_name: string;
  category: string;
  custom_domain?: string | null;
  plan_tier: string;
  status: string;
  is_verified: boolean;
  views_count: number;
  created_at?: string;
  tenant_profiles?: TenantProfile | TenantProfile[];
}

export interface TenantProfile {
  tenant_id: string;
  tagline?: string | null;
  about_bio?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  theme_config?: {
    google_verification?: string;
    primary_color?: string;
    accent_color?: string;
    [key: string]: unknown;
  } | null;
}

export interface CatalogItem {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  price_display?: string | null;
  image_url?: string | null;
  category_tag?: string | null;
  is_featured: boolean;
  display_order: number;
  created_at?: string;
}

export interface LeadInquiry {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_phone?: string | null;
  service_interested?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
}

export interface MerchantSession {
  tenantId: string;
  username: string;
  businessName: string;
  category: string;
  planTier: string;
  city?: string;
  phone?: string;
  email?: string;
  loginAt: number;
  expiresAt: number;
}
