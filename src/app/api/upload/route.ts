import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenant_id') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed.' }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const cleanExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('storefront-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('Supabase storage upload error:', uploadErr);
      return NextResponse.json({ error: 'Failed to upload image to cloud storage.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('storefront-media')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
    });
  } catch (err: any) {
    console.error('Upload exception:', err);
    return NextResponse.json({ error: 'Internal server error processing file upload.' }, { status: 500 });
  }
}
