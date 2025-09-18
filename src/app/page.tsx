"use client";

import { motion } from "framer-motion";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare, 
  History, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  Shield,
  Globe,
  Send,
  Search,
  FileText,
  Brain,
  Info,
  AlertTriangle,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStats, useChatStats, useSystemStatus, useLatestUpdate } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";


export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 실제 데이터 가져오기
  const { data: dashboardStats, isLoading: dashboardLoading, error: dashboardError } = useDashboardStats();
  const { data: chatStats, isLoading: chatLoading, error: chatError } = useChatStats();
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useSystemStatus();
  const { data: latestUpdate, isLoading: updateLoading, error: updateError } = useLatestUpdate();

  // 로딩 상태 확인 (개별적으로 처리)
  const isAnyLoading = dashboardLoading || chatLoading || statusLoading || updateLoading;
  
  // 에러 상태 확인
  const hasError = dashboardError || chatError || statusError || updateError;

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    try {
      setIsLoading(true);
      
      // 로그인 체크
      if (!user) {
        alert('채팅 기능을 사용하려면 먼저 로그인해주세요.');
        setIsLoading(false);
        return;
      }
      
      // 즉시 채팅 페이지로 이동 (지연 제거)
      const encodedQuestion = encodeURIComponent(chatInput.trim());
      router.push(`/chat?q=${encodedQuestion}`);
      
    } catch (error) {
      console.error('Chat submit error:', error);
      setIsLoading(false);
    }
  };

  const focusInput = () => {
    try {
      inputRef.current?.focus();
    } catch (error) {
      console.error('Focus input error:', error);
    }
  };


  const features = [
    {
      icon: "🧠",
      title: "AI 챗봇 대화",
      description: "자연어로 질문하면 AI가 관련 문서를 찾아 정확한 답변을 제공합니다.",
      badges: ["실시간 답변", "출처 표시", "한국어 지원"]
    },
    {
      icon: "📚",
      title: "히스토리 관리",
      description: "이전 질문과 답변을 언제든지 확인할 수 있습니다.",
      badges: ["검색 가능", "90일 보관"]
    },
    {
      icon: "🛡️",
      title: "보안 & 권한 관리",
      description: "사내 보안 정책에 맞춘 접근 제어와 데이터 보호를 제공합니다.",
      badges: ["SSO 연동", "권한 관리", "데이터 암호화"]
    },
    {
      icon: "🌐",
      title: "실시간 동기화",
      description: "최신 정책과 가이드라인이 실시간으로 반영되어 항상 최신 정보를 제공합니다.",
      badges: ["자동 업데이트", "실시간 반영", "버전 관리"]
    }
  ];

  // 실제 데이터 기반 통계
  const stats = [
    {
      icon: "👥",
      value: dashboardStats?.weeklyStats?.users ? `${dashboardStats.weeklyStats.users}+` : "0+",
      label: "활성 사용자",
      description: "전사 직원들이 매일 사용"
    },
    {
      icon: "⏱️",
      value: chatStats?.averageResponseTime ? `${(chatStats.averageResponseTime / 1000).toFixed(1)}초` : "0초",
      label: "평균 응답 시간",
      description: "빠른 답변으로 업무 효율 향상"
    },
    {
      icon: "📈",
      value: chatStats?.userSatisfaction ? `${Math.round(chatStats.userSatisfaction * 100)}%` : "0%",
      label: "사용자 만족도",
      description: "정확하고 유용한 답변 제공"
    },
    {
      icon: "📄",
      value: dashboardStats?.totalDocuments ? `${dashboardStats.totalDocuments}+` : "0+",
      label: "문서 데이터베이스",
      description: "최신 정책과 가이드라인"
    }
  ];

  // 실제 성능 데이터
  const performanceData = [
    { 
      metric: "평균 응답 시간", 
      value: chatStats?.averageResponseTime ? `${(chatStats.averageResponseTime / 1000).toFixed(1)}초` : "0초", 
      trend: "+0%", 
      status: "good" as const 
    },
    { 
      metric: "일일 질문 수", 
      value: chatStats?.dailyQuestions ? `${chatStats.dailyQuestions.toLocaleString()}개` : "0개", 
      trend: "+0%", 
      status: "good" as const 
    },
    { 
      metric: "정확도", 
      value: chatStats?.accuracy ? `${Math.round(chatStats.accuracy * 100)}%` : "0%", 
      trend: "+0%", 
      status: "excellent" as const 
    },
    { 
      metric: "사용자 만족도", 
      value: chatStats?.userSatisfaction ? `${(chatStats.userSatisfaction * 5).toFixed(1)}/5` : "0/5", 
      trend: "+0", 
      status: "excellent" as const 
    },
    { 
      metric: "시스템 가동률", 
      value: dashboardStats?.systemStatus?.overall === 'healthy' ? "99.9%" : "95.0%", 
      trend: "+0.1%", 
      status: "excellent" as const 
    }
  ];

  const productivityCards = [
    {
      icon: "🚀",
      title: "업무 효율성 극대화",
      subtitle: "8시간 → 8분",
      description: "복잡한 문서 검색과 정책 확인을 AI가 처리하여 업무 시간을 대폭 단축합니다.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "🔍",
      title: "즉시 답변",
      subtitle: "AI 기반 검색",
      description: "수백만 개의 문서를 AI가 스캔하여 질문에 대한 정확한 요약과 답변을 제공합니다.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📄",
      title: "전문가 수준",
      subtitle: "AI 문서 생성",
      description: "프로페셔널한 문서, 슬라이드, 리포트를 AI가 자동으로 생성해드립니다.",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  // 로딩 상태 처리
  if (isAnyLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">데이터를 불러오는 중...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // 에러 상태 처리
  if (hasError) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <div className="text-lg text-gray-600 mb-4">데이터를 불러오는 중 오류가 발생했습니다.</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section - Lovable.dev Style */}
      <motion.div 
        className="relative w-full min-h-[50vh] flex items-center justify-center overflow-hidden pt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              AI 기반 메타 광고 정책 챗봇
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight font-nanum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Meta 광고 정책
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mt-2">
              대화로 해결하세요
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed font-nanum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            복잡한 가이드라인을 뒤질 필요 없이 질문만으로 명확한 답변을 찾아주는 AI 챗봇
          </motion.p>
        </div>
      </motion.div>

      {/* Chat Input Section - Lovable.dev Style */}
      <motion.div 
        className="relative w-full py-4 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <form onSubmit={handleChatSubmit} className="w-full">
              <div className="relative w-full">
                {/* Main Chat Input Container - Lovable.dev Style */}
                <div className="card-premium rounded-3xl shadow-2xl overflow-hidden group">
                  {/* Input Field with Submit Button */}
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5 icon-enhanced group-hover:text-blue-400 transition-colors duration-300" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                ref={inputRef}
                                type="text"
                                placeholder="메타 광고 정책에 대해 질문해보세요... (예: 인스타그램 광고 정책 변경사항이 있나요?)"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="pl-12 pr-4 py-4 text-base border-0 bg-transparent text-enhanced placeholder-gray-300 focus:ring-0 focus:outline-none rounded-none w-full group-hover:placeholder-blue-300 transition-colors duration-300"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>자연어로 질문하면 AI가 관련 문서를 찾아 답변해드립니다</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 hover:-translate-y-1 icon-enhanced"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>처리중...</span>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Send className="w-4 h-4" />
                                  <span>질문하기</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>질문을 제출하면 AI가 답변을 생성합니다</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Help Text */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400 font-nanum">
                    💡 예시: "페이스북 광고 계정 생성 방법", "인스타그램 스토리 광고 크기", "광고 정책 위반 시 대처법"
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* Content Container - Lovable.dev Style */}
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        
        {/* Enhanced Latest Update Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="relative">
            {/* Background with gradient and glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl animate-enhanced-pulse"></div>
            
            {/* Main container */}
            <div className="relative card-enhanced rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] group">
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                {/* Header with icon and badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg animate-enhanced-pulse">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-enhanced font-nanum">최신 업데이트</h3>
                      <Badge className="bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-200 border-blue-400/50 font-nanum shadow-lg">
                        중요
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Date indicator */}
                  <div className="text-right">
                    <div className="text-sm text-enhanced font-nanum">
                      {updateLoading ? "로딩 중..." : latestUpdate?.displayDate || "최근"}
                    </div>
                    <div className="text-xs text-muted-enhanced font-nanum">업데이트</div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                  {updateLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : updateError ? (
                    <p className="text-blue-100 leading-relaxed font-nanum text-base">
                      메타 광고 정책이 최신 상태로 유지되고 있습니다. 궁금한 사항이 있으시면 AI 챗봇에게 물어보세요.
                    </p>
                  ) : (
                    <p className="text-blue-100 leading-relaxed font-nanum text-base">
                      {latestUpdate?.message || "메타 광고 정책이 최신 상태로 유지되고 있습니다. 궁금한 사항이 있으시면 AI 챗봇에게 물어보세요."}
                    </p>
                  )}
                  
                  {/* Feature indicator */}
                  <div className="flex items-center space-x-2 text-blue-300 pt-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-nanum">
                      {latestUpdate?.hasNewFeatures ? "새로운 기능 포함" : "최신 정보 제공"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Stats Table */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4 font-nanum">
              실시간 성능 지표
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto font-nanum">
              시스템 성능과 사용자 만족도를 실시간으로 확인하세요
            </p>
          </div>
          
                <Card className="card-premium group">
                  <CardContent className="p-8 card-content-animated">
              {dashboardLoading || chatLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : dashboardError || chatError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 font-nanum">
                    데이터를 불러오는 중 오류가 발생했습니다.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="mt-4 border-white/30 text-white hover:bg-white/10"
                  >
                    새로고침
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-enhanced font-semibold">지표</TableHead>
                      <TableHead className="text-enhanced font-semibold">현재 값</TableHead>
                      <TableHead className="text-enhanced font-semibold">변화율</TableHead>
                      <TableHead className="text-enhanced font-semibold">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((item, index) => (
                      <TableRow key={index} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-muted-enhanced font-medium">{item.metric}</TableCell>
                        <TableCell className="text-enhanced font-semibold">{item.value}</TableCell>
                        <TableCell className="text-green-300">{item.trend}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === 'excellent' ? 'default' : 'secondary'}
                            className={
                              item.status === 'excellent' 
                                ? 'bg-green-500/20 text-green-400 border-green-400/30' 
                                : 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                            }
                          >
                            {item.status === 'excellent' ? '우수' : '양호'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>


        {/* Features Section - Simplified */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-nanum">
              강력한 기능으로 <span className="text-gradient-premium">업무를 혁신하세요</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto font-nanum">
              AdMate의 핵심 기능들이 여러분의 업무 효율성을 높여드립니다
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-enhanced h-full group hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500">
                  <CardContent className="p-8 h-full flex flex-col card-content-animated">
                    <div className="w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 icon-enhanced">
                      <div className="text-4xl">{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-gradient mb-4 font-nanum group-hover:text-gradient-premium transition-all duration-300">{feature.title}</h3>
                    <p className="text-muted-enhanced leading-relaxed text-sm mb-6 flex-grow font-nanum group-hover:text-white/90 transition-colors duration-300">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.badges.map((badge, badgeIndex) => (
                        <Badge 
                          key={badgeIndex} 
                          variant="secondary" 
                          className="badge-premium font-nanum shadow-sm hover:scale-105 transition-transform duration-200 stagger-1"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* 통계 카드 섹션 */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4 font-nanum">
              실시간 통계
            </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto font-nanum">
                시스템 사용 현황과 성능 지표를 확인하세요
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardLoading || chatLoading ? (
                [...Array(4)].map((_, index) => (
                  <Card key={index} className="border-0 shadow-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <CardContent className="p-6 text-center">
                      <Skeleton className="w-12 h-12 mx-auto mb-4 rounded-full" />
                      <Skeleton className="h-6 w-16 mx-auto mb-2" />
                      <Skeleton className="h-4 w-24 mx-auto mb-2" />
                      <Skeleton className="h-3 w-32 mx-auto" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="card-enhanced group hover:-translate-y-3 hover:scale-[1.05] transition-all duration-500">
                      <CardContent className="p-8 text-center card-content-animated">
                        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 icon-enhanced">
                          <div className="text-4xl">{stat.icon}</div>
                        </div>
                        <h3 className="text-3xl font-bold text-gradient-premium mb-3 font-nanum group-hover:scale-110 transition-transform duration-300">{stat.value}</h3>
                        <p className="text-muted-enhanced font-semibold mb-3 font-nanum group-hover:text-white/90 transition-colors duration-300">{stat.label}</p>
                        <p className="text-sm text-gray-400 font-nanum group-hover:text-gray-300 transition-colors duration-300">{stat.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>



        {/* CTA Section - Simplified */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="card-premium p-12 overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="card-content-animated">
              <h2 className="text-3xl md:text-4xl font-bold text-gradient-premium mb-6 font-nanum group-hover:scale-105 transition-transform duration-300">
                지금 바로 시작해보세요
              </h2>
              <p className="text-lg text-muted-enhanced mb-8 max-w-3xl mx-auto font-nanum group-hover:text-white/90 transition-colors duration-300">
                Meta 광고 정책에 대한 궁금증을 AI 챗봇에게 물어보고, 업무 효율성을 극대화하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={focusInput}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 icon-enhanced"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      질문하기
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>위의 입력창에 포커스를 맞춥니다</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/history">
                      <Button 
                        variant="outline"
                        className="px-8 py-4 border-2 border-white/30 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 icon-enhanced"
                      >
                        <History className="w-5 h-5 mr-2" />
                        히스토리 보기
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>이전 질문과 답변을 확인하세요</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>



    </MainLayout>
  );
}
