"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";

export function EnvironmentSetupGuide() {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const envContent = `# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key

# 문서 처리 설정
MAX_FILE_SIZE=10485760  # 10MB in bytes
SUPPORTED_FILE_TYPES=pdf,docx,txt
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# 벡터 검색 설정
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=10`;

  const steps = [
    {
      title: "1. Supabase 프로젝트 생성",
      description: "Supabase에서 새 프로젝트를 생성하거나 기존 프로젝트를 선택하세요.",
      action: "Supabase 대시보드로 이동",
      url: "https://supabase.com/dashboard",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: "2. API 키 확인",
      description: "Settings > API에서 Project URL과 API 키를 확인하세요.",
      action: "API 설정 페이지로 이동",
      url: "https://supabase.com/dashboard/project/_/settings/api",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: "3. .env.local 파일 생성",
      description: "프로젝트 루트에 .env.local 파일을 생성하고 환경 변수를 설정하세요.",
      action: "파일 내용 복사",
      content: envContent,
      icon: <Copy className="w-4 h-4" />
    },
    {
      title: "4. 개발 서버 재시작",
      description: "환경 변수 설정 후 개발 서버를 재시작하세요.",
      action: "터미널에서 실행",
      content: "npm run dev",
      icon: <Copy className="w-4 h-4" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">환경 변수 설정 가이드</h1>
        <p className="text-gray-300 text-lg">
          비밀번호 변경 기능을 사용하려면 Supabase 환경 변수를 설정해야 합니다.
        </p>
      </div>

      <div className="grid gap-6">
        {steps.map((step, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500">
                  {index + 1}
                </Badge>
                <span>{step.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">{step.description}</p>
              
              {step.content && (
                <div className="bg-gray-800 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {step.content}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(step.content!, `step-${index}`)}
                  >
                    {copiedItems.has(`step-${index}`) ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (step.url) {
                    window.open(step.url, '_blank');
                  } else if (step.content) {
                    copyToClipboard(step.content, `step-${index}`);
                  }
                }}
              >
                {step.icon}
                <span className="ml-2">{step.action}</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-blue-400 mt-0.5">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">문제 해결 팁</h3>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• 환경 변수 설정 후 반드시 개발 서버를 재시작하세요</li>
                <li>• .env.local 파일이 .gitignore에 포함되어 있는지 확인하세요</li>
                <li>• Supabase 프로젝트가 활성화되어 있는지 확인하세요</li>
                <li>• API 키가 올바르게 복사되었는지 확인하세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
