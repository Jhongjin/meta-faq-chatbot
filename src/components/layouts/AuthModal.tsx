"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "@nasmedia.co.kr",
    password: "",
    confirmPassword: "",
    name: ""
  });

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUp(formData.email, formData.password, formData.name);
        
        if (error) {
          alert(`회원가입 오류: ${error.message}`);
        } else {
          alert("회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.");
          onClose();
          setFormData({ email: "@nasmedia.co.kr", password: "", confirmPassword: "", name: "" });
        }
      } else {
        const { data, error } = await signIn(formData.email, formData.password);
        
        if (error) {
          alert(`로그인 오류: ${error.message}`);
        } else {
          alert("로그인이 완료되었습니다!");
          onClose();
          setFormData({ email: "@nasmedia.co.kr", password: "", confirmPassword: "", name: "" });
        }
      }
    } catch (error) {
      alert(`오류가 발생했습니다: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ email: "@nasmedia.co.kr", password: "", confirmPassword: "", name: "" });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? "회원가입" : "로그인"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                  이름
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="text"
                  placeholder="사용자명"
                  value={formData.email.replace('@nasmedia.co.kr', '')}
                  onChange={(e) => handleInputChange("email", e.target.value + '@nasmedia.co.kr')}
                  className="pl-10 pr-24 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  @nasmedia.co.kr
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? "회원가입 중..." : "로그인 중..."}</span>
                </div>
              ) : (
                <span>{isSignUp ? "회원가입" : "로그인"}</span>
              )}
            </Button>

            {/* Toggle Mode */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                {isSignUp ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {isSignUp ? "로그인" : "회원가입"}
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
