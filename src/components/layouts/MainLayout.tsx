"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function MainLayout({ children, currentPage }: MainLayoutProps) {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { user, signOut } = useAuth();



  return (
    <div className="min-h-screen text-white">
      {/* Header - Lovable.dev Style */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-black/20 backdrop-blur-xl">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group p-2 -m-2 rounded-lg hover:bg-white/5 transition-all duration-300"
              aria-label="AdMate 홈페이지로 이동"
              title="메인 페이지로 이동"
            >
                                            {/* Creative AdMate Logo */}
               <div className="relative w-12 h-12">
                 <div className="absolute inset-0 transform transition-all duration-300 hover:scale-110 group-hover:rotate-6">
                   <svg 
                     viewBox="0 0 24 24" 
                     className="w-full h-full"
                     fill="none" 
                     stroke="currentColor" 
                     strokeWidth="1.5"
                   >
                     <defs>
                       <filter id="glow">
                         <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                         <feMerge> 
                           <feMergeNode in="coloredBlur"/>
                           <feMergeNode in="SourceGraphic"/>
                         </feMerge>
                       </filter>
                     </defs>
                     
                                                                 {/* 파란 말풍선 - 이미지와 동일한 모양 */}
                      <path 
                        d="M6 6C6 4.5 7.5 3 9 3H15C16.5 3 18 4.5 18 6V12C18 13.5 16.5 15 15 15H9C7.5 15 6 13.5 6 12V6Z" 
                        fill="currentColor"
                        className="text-blue-500 group-hover:text-blue-400 transition-colors duration-300"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))'
                        }}
                      />
                      {/* 말풍선 꼬리 - 아래쪽 중앙에 삼각형 */}
                      <path 
                        d="M11 15L13 15L12 18L11 15Z" 
                        fill="currentColor"
                        className="text-blue-500 group-hover:text-blue-400 transition-colors duration-300"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))'
                        }}
                      />
                      {/* 흰색 무한대 기호 - 말풍선 안에 중앙 배치 */}
                      <path 
                        d="M9.5 7.5C10.5 7.5 11.5 8.5 11.5 9.5C11.5 10.5 10.5 11.5 9.5 11.5C8.5 11.5 7.5 10.5 7.5 9.5C7.5 8.5 8.5 7.5 9.5 7.5ZM14.5 7.5C15.5 7.5 16.5 8.5 16.5 9.5C16.5 10.5 15.5 11.5 14.5 11.5C13.5 11.5 12.5 10.5 12.5 9.5C12.5 8.5 13.5 7.5 14.5 7.5ZM12 9.5L12 9.5" 
                        fill="currentColor"
                        className="text-white group-hover:text-blue-100 transition-colors duration-300"
                        style={{
                          filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.4))'
                        }}
                      />
                   </svg>
                 </div>
               </div>
              
              {/* Brand name */}
              <span className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors duration-300">
                AdMate
              </span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-6">
            {user ? (
              <UserProfileDropdown 
                user={user} 
                onSignOut={() => {
                  // 로그아웃 후 상태 업데이트
                  setShowSignIn(false);
                  setShowSignUp(false);
                }} 
              />
            ) : (
              <>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  Sign Up
                </button>
              </>
            )}
            

          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Auth Modals */}
      <AuthModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        mode="signin"
      />
      <AuthModal
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        mode="signup"
      />
    </div>
  );
}