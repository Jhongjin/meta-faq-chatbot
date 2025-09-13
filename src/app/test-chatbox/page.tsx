'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Clock, BarChart3, Users, FileText, Globe, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TestChatboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // 자동 높이 조정 함수
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  };

  // 텍스트 변경 핸들러
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('검색:', searchQuery);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('채팅 메시지:', chatMessage);
    setChatMessage('');
  };

  const performanceData = [
    { metric: '평균 응답 시간', value: '0.8초', trend: '+12%', status: 'excellent' },
    { metric: '시스템 가용성', value: '99.9%', trend: '+0.1%', status: 'excellent' },
    { metric: '사용자 만족도', value: '4.8/5', trend: '+0.2', status: 'excellent' },
    { metric: '처리 성능', value: '95%', trend: '+5%', status: 'good' }
  ];

  const features = [
    {
      icon: MessageCircle,
      title: 'AI 맞춤 대화',
      description: '개인화된 AI 챗봇이 질문에 대한 답변을 제공합니다.',
      badge: '핵심 기능'
    },
    {
      icon: FileText,
      title: '히스토리 관리',
      description: '이전 대화 내용을 언제든지 확인할 수 있습니다.',
      badge: '편의 기능'
    },
    {
      icon: Globe,
      title: '문서 & 웹 관리',
      description: '자유롭게 원하는 웹 페이지의 데이터를 수집합니다.',
      badge: '고급 기능'
    },
    {
      icon: Clock,
      title: '실시간 동기화',
      description: '모든 정보가 실시간으로 동기화되어 항상 최신 정보를 제공합니다.',
      badge: '실시간'
    }
  ];

  const stats = [
    { value: '99+', label: '활성 사용자', description: '현재 온라인' },
    { value: '0초', label: '평균 응답 시간', description: '빠른 처리' },
    { value: '99%', label: '사용자 만족도', description: '높은 만족' },
    { value: '127+', label: '문서 데이터베이스', description: '풍부한 자료' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AdMate</h1>
                <p className="text-sm text-gray-400">Meta 광고 FAQ AI 챗봇</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="header-btn header-btn-primary">
                <Clock className="w-4 h-4" />
                히스토리
              </button>
              <button className="header-btn header-btn-secondary">
                <MessageCircle className="w-4 h-4" />
                채팅하기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section with New Chatbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Meta 광고 정책 AI 챗봇
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            복잡한 Meta 광고 정책을 AI가 쉽게 설명해드립니다. 
            궁금한 것이 있으시면 언제든지 물어보세요.
          </p>

          {/* New Chatbox Style */}
          <div className="chatbox-container mb-16">
            <form 
              onSubmit={handleChatSubmit}
              className="chatbox-form"
            >
              <div className="relative flex flex-1 items-center">
                <textarea
                  value={chatMessage}
                  onChange={handleTextareaChange}
                  className="chatbox-textarea"
                  placeholder="Meta 광고 정책에 대해 궁금한 것이 있으시면 언제든지 물어보세요..."
                  maxLength={50000}
                  autoFocus
                />
              </div>
              <div className="flex gap-1 flex-wrap items-center">
                <div className="ml-auto flex items-center gap-1">
                  <div className="relative flex items-center gap-1 md:gap-2">
                    <button
                      type="submit"
                      disabled={chatMessage.trim() === ''}
                      className="chatbox-send-button"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="100%" 
                        height="100%" 
                        viewBox="0 -960 960 960" 
                        fill="currentColor"
                      >
                        <path d="M442.39-616.87 309.78-487.26q-11.82 11.83-27.78 11.33t-27.78-12.33q-11.83-11.83-11.83-27.78 0-15.96 11.83-27.79l198.43-199q11.83-11.82 28.35-11.82t28.35 11.82l198.43 199q11.83 11.83 11.83 27.79 0 15.95-11.83 27.78-11.82 11.83-27.78 11.83t-27.78-11.83L521.61-618.87v348.83q0 16.95-11.33 28.28-11.32 11.33-28.28 11.33t-28.28-11.33q-11.33-11.33-11.33-28.28z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            실시간 성능 지표
          </h2>
          <p className="text-lg text-gray-300 mb-8 text-center">
            시스템 성능과 사용자 만족도를 실시간으로 확인하세요
          </p>
          
          <div className="modern-card-dark p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 modern-text-dark-primary">지표</th>
                    <th className="text-left py-3 px-4 modern-text-dark-primary">현재 값</th>
                    <th className="text-left py-3 px-4 modern-text-dark-primary">변화율</th>
                    <th className="text-left py-3 px-4 modern-text-dark-primary">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="py-3 px-4 modern-text-dark-secondary font-medium">{item.metric}</td>
                      <td className="py-3 px-4 modern-text-dark-primary font-semibold">{item.value}</td>
                      <td className="py-3 px-4 text-green-400">{item.trend}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'excellent' 
                            ? 'bg-green-900/50 text-green-300 border border-green-700' 
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        }`}>
                          {item.status === 'excellent' ? '우수' : '양호'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            강력한 기능으로 업무를 <span className="text-blue-400">혁신하세요</span>
          </h2>
          <p className="text-lg text-gray-300 mb-12 text-center max-w-3xl mx-auto">
            AI 기반의 스마트한 기능들로 Meta 광고 정책 관리의 새로운 차원을 경험하세요
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="modern-card-dark group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="p-8 h-full flex flex-col">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                    {feature.badge}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            실시간 통계
          </h2>
          <p className="text-lg text-gray-300 mb-12 text-center">
            시스템 사용 현황과 성능 지표를 확인하세요
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="modern-card-dark group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    {stat.value}
                  </h3>
                  <p className="text-lg font-semibold text-white mb-2">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-300">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section - Dark Modern Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="modern-card-dark p-12">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  지금 바로 시작해보세요
                </h2>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                  Meta 광고 정책에 대한 궁금증을 AI 챗봇에게 물어보고, 업무 효율성을 극대화하세요
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="modern-button-primary flex items-center justify-center px-8 py-4">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  질문하기
                </button>
                <button className="modern-button-secondary flex items-center justify-center px-8 py-4">
                  <Clock className="w-5 h-5 mr-2" />
                  히스토리 보기
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
