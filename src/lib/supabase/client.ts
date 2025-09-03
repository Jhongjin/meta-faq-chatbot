import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시에는 더미 값을 사용하여 오류 방지
    if (typeof window === 'undefined') {
      return createBrowserClient('https://dummy.supabase.co', 'dummy-key');
    }
    throw new Error('Supabase URL과 Anon Key가 설정되지 않았습니다.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
