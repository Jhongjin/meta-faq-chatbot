"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

interface RelatedQuestionsProps {
  userQuestion: string;
  aiResponse: string;
  onQuestionClick?: (question: string) => void;
}

export default function RelatedQuestions({ 
  userQuestion, 
  aiResponse, 
  onQuestionClick 
}: RelatedQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 관련 질문 생성 (키워드 기반)
  const generateRelatedQuestions = (question: string, response: string): string[] => {
    const lowerQuestion = question.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // 질문 유형별 관련 질문 생성
    const questionTemplates = {
      '정책': [
        'Meta 광고 정책 위반 시 처벌은 어떻게 되나요?',
        '광고 정책 변경 시 알림을 받을 수 있나요?',
        '정책 위반으로 거부된 광고는 어떻게 재제출하나요?'
      ],
      '승인': [
        '광고 승인까지 얼마나 걸리나요?',
        '광고 승인을 빠르게 받는 방법이 있나요?',
        '승인 거부 사유를 확인하는 방법은?'
      ],
      '설정': [
        '광고 타겟팅 설정을 어떻게 최적화하나요?',
        '예산 설정 시 주의사항이 있나요?',
        '광고 일정을 어떻게 관리하나요?'
      ],
      '성과': [
        '광고 성과를 어떻게 측정하나요?',
        'ROI를 개선하는 방법은?',
        '광고 최적화 팁이 있나요?'
      ],
      '문제': [
        '광고가 표시되지 않는 이유는?',
        '결제 오류가 발생했을 때 어떻게 하나요?',
        '계정이 제한되었을 때 해결 방법은?'
      ]
    };

    // 키워드 매칭으로 관련 질문 선택
    const matchedQuestions: string[] = [];
    
    Object.entries(questionTemplates).forEach(([category, categoryQuestions]) => {
      if (lowerQuestion.includes(category) || lowerResponse.includes(category)) {
        matchedQuestions.push(...categoryQuestions.slice(0, 2));
      }
    });

    // 기본 질문들 추가
    const defaultQuestions = [
      'Meta 광고 관리자 사용법을 알려주세요',
      '광고 크리에이티브 제작 가이드가 있나요?',
      'A/B 테스트는 어떻게 진행하나요?',
      '광고 정책 업데이트는 어디서 확인하나요?'
    ];

    // 중복 제거하고 최대 4개 선택
    const allQuestions = [...matchedQuestions, ...defaultQuestions];
    const uniqueQuestions = Array.from(new Set(allQuestions));
    
    return uniqueQuestions.slice(0, 4);
  };

  useEffect(() => {
    if (userQuestion && aiResponse) {
      setIsLoading(true);
      
      // 약간의 지연을 주어 자연스러운 로딩 효과
      setTimeout(() => {
        const generatedQuestions = generateRelatedQuestions(userQuestion, aiResponse);
        setQuestions(generatedQuestions);
        setIsLoading(false);
      }, 800);
    }
  }, [userQuestion, aiResponse]);

  const handleQuestionClick = (question: string) => {
    if (onQuestionClick) {
      onQuestionClick(question);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-50/95 to-pink-50/95 backdrop-blur-sm border-purple-200/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-gray-800 text-xl font-bold">
            <MessageCircle className="w-6 h-6 text-purple-500" />
            <span>관련 질문 예측</span>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
              AI 추천
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-600">관련 질문을 분석하는 중...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="w-full bg-gradient-to-br from-purple-50/95 to-pink-50/95 backdrop-blur-sm border-purple-200/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-gray-800 text-xl font-bold">
            <MessageCircle className="w-6 h-6 text-purple-500" />
            <span>관련 질문 예측</span>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
              AI 추천
            </Badge>
          </CardTitle>
          <Separator className="bg-purple-200/50" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-purple-100/50 transition-all duration-200 group"
                  onClick={() => handleQuestionClick(question)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <MessageCircle className="w-3 h-3 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-800 leading-relaxed group-hover:text-purple-800 transition-colors">
                        {question}
                      </p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-purple-200/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>AI가 추천한 질문들</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>인기 키워드 기반</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
