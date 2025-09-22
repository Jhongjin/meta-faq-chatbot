import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 더미 클라이언트를 사용합니다.');
    return createServerClient('https://dummy.supabase.co', 'dummy-key', {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function createPureClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 더미 클라이언트를 사용합니다.');
    return createServerClient('https://dummy.supabase.co', 'dummy-key', {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
