"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PasswordChangeModal } from "@/components/layouts/PasswordChangeModal";

export default function TestPage() {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const testUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {
      name: "테스트 사용자"
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">비밀번호 변경 테스트 페이지</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">환경 변수 상태</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-400" : "text-red-400"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 미설정"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "text-green-400" : "text-red-400"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 미설정"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                console.log("Toast 테스트 버튼 클릭됨");
                toast({
                  title: "Toast 테스트",
                  description: "Toast 알림이 정상적으로 작동합니다!",
                });
              }}
              className="w-full"
            >
              🧪 Toast 알림 테스트
            </Button>

            <Button
              onClick={() => {
                console.log("비밀번호 변경 모달 열기");
                setShowModal(true);
              }}
              className="w-full"
            >
              🔐 비밀번호 변경 모달 열기
            </Button>

            <Button
              onClick={() => {
                console.log("환경 변수 정보 출력");
                console.log("환경 변수:", {
                  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                });
                toast({
                  title: "환경 변수 정보",
                  description: "콘솔을 확인하세요",
                });
              }}
              variant="outline"
              className="w-full"
            >
              📋 환경 변수 정보 출력
            </Button>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">테스트 방법</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>먼저 "Toast 알림 테스트" 버튼을 클릭하여 Toast가 작동하는지 확인</li>
              <li>"비밀번호 변경 모달 열기" 버튼을 클릭하여 모달이 열리는지 확인</li>
              <li>모달 내의 "Toast 테스트" 버튼을 클릭하여 모달 내에서 Toast가 작동하는지 확인</li>
              <li>환경 변수가 설정되지 않은 경우 환경 설정 가이드가 표시되는지 확인</li>
            </ol>
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={testUser}
      />
    </div>
  );
}
