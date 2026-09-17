import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, password, fullName, orgId, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swsmmnuisefafzofezus.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3c21tbnVpc2VmYWZ6b2ZlenVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODgyODE4NCwiZXhwIjoyMTA0NDA0MTg0fQ._lFOC1AQUPuu7O3m96_ltI-RQ-inqHlKc86Ew-vWOos';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Create or update user in Supabase auth.users directly via admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: fullName?.trim() || '',
        org_id: orgId || '',
        role: role || 'super_admin',
      },
    });

    if (error) {
      // If user already exists in auth.users, ignore or return success
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return NextResponse.json({ success: true, message: 'User already exists in auth.users' });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
