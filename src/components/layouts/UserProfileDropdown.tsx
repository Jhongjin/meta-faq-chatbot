"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, Lock, Trash2, ChevronDown, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { DeleteAccountModal } from "./DeleteAccountModal";

interface UserProfileDropdownProps {
  user: any;
  onSignOut: () => void;
}

export function UserProfileDropdown({ user, onSignOut }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  // 관리자 이메일 목록
  const ADMIN_EMAILS = [
    "secho@nasmedia.co.kr",
    "woolela@nasmedia.co.kr",
    "dsko@nasmedia.co.kr",
    "hjchoi@nasmedia.co.kr",
    "sunjung@nasmedia.co.kr",
    "sy230@nasmedia.co.kr",
    "jeng351@nasmedia.co.kr"
  ];

  // 관리자 권한 체크
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const handleSignOut = async () => {
    await signOut();
    onSignOut();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 p-2"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">{user.user_metadata?.name || user.email}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* User Info */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.user_metadata?.name || '사용자'}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* 관리자 메뉴 */}
                {isAdmin && (
                  <>
                    <a
                      href="/admin"
                      className="w-full flex items-center space-x-3 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-gray-800 transition-colors duration-200"
                    >
                      <Shield className="w-4 h-4" />
                      <span>관리자 페이지</span>
                    </a>
                    
                    {/* 구분선 */}
                    <div className="border-t border-gray-700 my-2"></div>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowPasswordModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  <Lock className="w-4 h-4" />
                  <span>비밀번호 변경</span>
                </button>

                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>회원탈퇴</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={user}
        onSignOut={onSignOut}
      />
    </>
  );
}
