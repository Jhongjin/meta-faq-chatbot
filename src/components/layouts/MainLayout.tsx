"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [envError, setEnvError] = useState<string | null>(null);

  // 환경 변수 검증
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase 환경 변수가 설정되지 않았습니다. 더미 클라이언트를 사용합니다.');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen">
      {/* 헤더 - Lovable.dev 스타일, 스크롤 시에도 고정 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 py-3">
            {/* AdMate 로고 */}
            <div className="flex items-center">
              <motion.div 
                className="cursor-pointer"
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -2, 2, 0],
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.img 
                  src="/admate-logo.svg" 
                  alt="AdMate" 
                  className="h-8 w-auto"
                  whileHover={{
                    filter: "brightness(1.1) drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))",
                    transition: { duration: 0.2 }
                  }}
                />
              </motion.div>
            </div>

            {/* 사용자 프로필 */}
            <UserProfileDropdown user={user} onSignOut={() => {}} />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}
