"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  History, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Bot,
  Send,
  Search,
  FileText,
  Brain,
  Rocket,
  CheckCircle,
  Star,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef } from "react";


export default function HomePage() {
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setIsLoading(true);
    setLastQuestion(chatInput);
    
    // TODO: 실제 채팅 API 호출
    console.log("Chat submitted:", chatInput);
    
    // 시뮬레이션을 위한 지연
    setTimeout(() => {
      setIsLoading(false);
      setChatInput("");
      setShowSuccess(true);
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

     const recentQuestions = [
     {
       id: "1",
       question: "2024년 메타 광고 정책 변경사항이 있나요?",
       answer: "네, 2024년 1월부터 인스타그램 광고 정책이 일부 변경되었습니다...",
       timestamp: "2시간 전",
       helpful: true,
     },
     {
       id: "2",
       question: "페이스북 광고 계정 생성 시 필요한 서류는?",
       answer: "페이스북 광고 계정 생성 시에는 사업자등록증과 신분증이 필요합니다...",
       timestamp: "1일 전",
       helpful: true,
     },
     {
       id: "3",
       question: "스토리 광고의 최적 크기는 어떻게 되나요?",
       answer: "인스타그램 스토리 광고는 1080x1920 픽셀(9:16 비율)을 권장합니다...",
       timestamp: "2일 전",
       helpful: false,
     },
     {
       id: "4",
       question: "광고 정책 위반 시 대처 방법은?",
       answer: "광고 정책 위반 시 즉시 광고를 중단하고 정책에 맞게 수정한 후 재심사를 요청해야 합니다...",
       timestamp: "3일 전",
       helpful: true,
     },
   ];

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI 챗봇 대화",
      description: "자연어로 질문하면 AI가 관련 문서를 찾아 정확한 답변을 제공합니다.",
      badges: ["실시간 답변", "출처 표시", "한국어 지원"]
    },
    {
      icon: <History className="w-8 h-8" />,
      title: "히스토리 & 즐겨찾기",
      description: "이전 질문과 답변을 언제든지 확인할 수 있고, 자주 사용하는 답변을 즐겨찾기로 저장할 수 있습니다.",
      badges: ["검색 가능", "즐겨찾기", "90일 보관"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "보안 & 권한 관리",
      description: "사내 보안 정책에 맞춘 접근 제어와 데이터 보호를 제공합니다.",
      badges: ["SSO 연동", "권한 관리", "데이터 암호화"]
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "실시간 동기화",
      description: "최신 정책과 가이드라인이 실시간으로 반영되어 항상 최신 정보를 제공합니다.",
      badges: ["자동 업데이트", "실시간 반영", "버전 관리"]
    }
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "200+",
      label: "활성 사용자",
      description: "전사 직원들이 매일 사용"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "3초",
      label: "평균 응답 시간",
      description: "빠른 답변으로 업무 효율 향상"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: "90%",
      label: "사용자 만족도",
      description: "정확하고 유용한 답변 제공"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      value: "500+",
      label: "문서 데이터베이스",
      description: "최신 정책과 가이드라인"
    }
  ];

  const productivityCards = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "업무 효율성 극대화",
      subtitle: "8시간 → 8분",
      description: "복잡한 문서 검색과 정책 확인을 AI가 처리하여 업무 시간을 대폭 단축합니다.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "즉시 답변",
      subtitle: "AI 기반 검색",
      description: "수백만 개의 문서를 AI가 스캔하여 질문에 대한 정확한 요약과 답변을 제공합니다.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "전문가 수준",
      subtitle: "AI 문서 생성",
      description: "프로페셔널한 문서, 슬라이드, 리포트를 AI가 자동으로 생성해드립니다.",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <MainLayout currentPage="home">
      {/* Hero Section - Lovable.dev Style */}
      <motion.div 
        className="relative w-full py-24 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Pattern - Lovable.dev Style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Corner Glows - Lovable.dev Style */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-950 border border-blue-800 rounded-full text-blue-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              AI 기반 메타 광고 정책 챗봇
            </div>
          </motion.div>
          
                     <motion.h1 
             className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight font-nanum"
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
             className="text-lg text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-nanum"
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
         className="relative w-full py-8 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        {/* Background Pattern - 히어로와 일체감 있게 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Grid - 히어로 영역과 동일한 패턴 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
          
          {/* Corner Glows - 히어로 영역과 자연스럽게 연결 */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl"></div>
        </div>
        
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
                 <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                   {/* Input Field with Submit Button */}
                   <div className="p-6">
                     <div className="flex items-center space-x-3">
                       <div className="flex-1 relative">
                         <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                         <Input
                           ref={inputRef}
                           type="text"
                           placeholder="메타 광고 정책에 대해 질문해보세요... (예: 인스타그램 광고 정책 변경사항이 있나요?)"
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           className="pl-12 pr-4 py-4 text-base border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 focus:outline-none rounded-none w-full"
                         />
                       </div>
                       <Button
                         type="submit"
                         disabled={isLoading || !chatInput.trim()}
                         className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                       >
                         {isLoading ? (
                           <div className="flex items-center space-x-2">
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             <span>처리중...</span>
                           </div>
                         ) : (
                           <div className="flex items-center space-x-2">
                             <Send className="w-4 h-4" />
                             <span>질문하기</span>
                           </div>
                         )}
                       </Button>
                     </div>
                   </div>
                 </div>
                
                {/* Help Text */}
                <div className="mt-6 text-center">
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
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          
          {/* Corner Glows */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-red-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Productivity Cards - Lovable.dev Style */}
        <motion.div 
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-nanum">
               업무 효율성을 극대화하는 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI 도구</span>
             </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-nanum">
              복잡한 메타 광고 정책을 AI가 이해하기 쉽게 설명해드립니다
            </p>
          </motion.div>
          
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {productivityCards.map((card, index) => (
               <motion.div 
                 key={index}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: index * 0.1 }}
                 viewport={{ once: true }}
               >
                 <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/5 backdrop-blur-sm h-80 group hover:-translate-y-2 border border-white/10">
                   <CardContent className="p-8 h-full flex flex-col">
                     <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                       <div className="text-white">{card.icon}</div>
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-3 font-nanum">{card.title}</h3>
                     <p className="text-blue-400 font-semibold mb-4 text-lg font-nanum">{card.subtitle}</p>
                     <p className="text-gray-300 leading-relaxed text-base flex-grow font-nanum">{card.description}</p>
                   </CardContent>
                 </Card>
               </motion.div>
             ))}
           </div>
        </motion.div>

                 {/* Stats Grid - Lovable.dev Style */}
         <motion.div 
           className="mb-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-nanum">
               검증된 성과와 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">사용자 만족도</span>
             </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-nanum">
              AdMate가 제공하는 가치를 수치로 확인해보세요
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/5 backdrop-blur-sm text-center group hover:-translate-y-1 border border-white/10">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <div className="text-white">{stat.icon}</div>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2 font-nanum">{stat.value}</h3>
                    <p className="text-lg font-semibold text-blue-400 mb-2 font-nanum">{stat.label}</p>
                    <p className="text-sm text-gray-300 font-nanum">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

                 {/* Features Grid - Lovable.dev Style */}
         <motion.div 
           className="mb-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-nanum">
               강력한 기능으로 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">업무를 혁신하세요</span>
             </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-nanum">
              AdMate의 핵심 기능들이 여러분의 업무 효율성을 높여드립니다
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/5 backdrop-blur-sm h-full group hover:-translate-y-1 border border-white/10">
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 font-nanum">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed text-base mb-6 flex-grow font-nanum">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.badges.map((badge, badgeIndex) => (
                        <Badge 
                          key={badgeIndex} 
                          variant="secondary" 
                          className="bg-blue-950 text-blue-300 border-blue-800 font-nanum"
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
        </motion.div>

                 {/* Recent Questions - Lovable.dev Style */}
         <motion.div 
           className="mb-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-nanum">
               최근 질문과 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">답변을 확인하세요</span>
             </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-nanum">
              다른 사용자들이 궁금해하는 내용과 AI의 답변을 살펴보세요
            </p>
          </motion.div>
          
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {recentQuestions.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/5 backdrop-blur-sm h-full group hover:-translate-y-1 border border-white/10">
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-400 font-nanum">{item.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {item.helpful ? (
                          <CheckCircle className="w-4 h-5 text-green-400" />
                        ) : (
                          <Star className="w-4 h-5 text-yellow-400" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3 font-nanum line-clamp-2">{item.question}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed flex-grow font-nanum line-clamp-4">{item.answer}</p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Link href="/history" className="text-blue-400 hover:text-blue-300 text-sm font-medium font-nanum flex items-center space-x-2 group-hover:underline">
                        <span>자세히 보기</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section - Lovable.dev Style */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-16 border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              {/* Corner Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-nanum">
              지금 바로 시작해보세요
            </h2>
                         <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto font-nanum">
               Meta 광고 정책에 대한 궁금증을 AI 챗봇에게 물어보고, 업무 효율성을 극대화하세요
             </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={focusInput}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                질문하기
              </Button>
              <Link href="/history">
                <Button 
                  variant="outline"
                  className="px-8 py-4 border-2 border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold text-lg rounded-2xl transition-all duration-200"
                >
                  <History className="w-5 h-5 mr-2" />
                  히스토리 보기
                </Button>
              </Link>
              

            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <motion.div 
          className="fixed top-24 right-6 z-50"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border border-green-400">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
              <div>
                <p className="font-semibold font-nanum">질문이 전송되었습니다!</p>
                <p className="text-sm opacity-90 font-nanum">"{lastQuestion}"</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}


    </MainLayout>
  );
}
