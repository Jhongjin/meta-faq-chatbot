"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink,
  Clock,
  Star,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "framer-motion";

interface LearningResource {
  id: string;
  title: string;
  type: 'guide' | 'video' | 'document' | 'tutorial';
  description: string;
  url: string;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  isNew?: boolean;
}

interface LearningResourcesProps {
  userQuestion: string;
  aiResponse: string;
}

export default function LearningResources({ 
  userQuestion, 
  aiResponse 
}: LearningResourcesProps) {
  // 질문 기반 학습 자료 생성
  const generateLearningResources = (question: string, response: string): LearningResource[] => {
    const lowerQuestion = question.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    const baseResources: LearningResource[] = [
      {
        id: 'meta-business-help',
        title: 'Meta 비즈니스 도움말 센터',
        type: 'guide',
        description: 'Meta 광고 관리의 모든 것을 한 곳에서',
        url: 'https://www.facebook.com/business/help',
        duration: '5분',
        difficulty: 'beginner',
        rating: 4.8
      },
      {
        id: 'ad-policy-center',
        title: '광고 정책 센터',
        type: 'document',
        description: '최신 광고 정책 및 가이드라인',
        url: 'https://www.facebook.com/policies/ads',
        duration: '10분',
        difficulty: 'intermediate',
        rating: 4.6
      },
      {
        id: 'ad-manager-tutorial',
        title: '광고 관리자 사용법',
        type: 'tutorial',
        description: '광고 관리자 기본 기능 익히기',
        url: 'https://business.facebook.com',
        duration: '15분',
        difficulty: 'beginner',
        rating: 4.7
      },
      {
        id: 'creative-best-practices',
        title: '크리에이티브 모범 사례',
        type: 'guide',
        description: '효과적인 광고 크리에이티브 제작 가이드',
        url: 'https://www.facebook.com/business/help/creative-best-practices',
        duration: '20분',
        difficulty: 'intermediate',
        rating: 4.5
      }
    ];

    // 질문 키워드에 따른 맞춤형 자료 추가
    const customResources: LearningResource[] = [];
    
    if (lowerQuestion.includes('정책') || lowerResponse.includes('정책')) {
      customResources.push({
        id: 'ad-policy-details',
        title: '광고 정책 상세 가이드',
        type: 'guide',
        description: 'Meta 광고 정책의 세부 내용과 적용 방법',
        url: 'https://www.facebook.com/policies/ads',
        duration: '12분',
        difficulty: 'intermediate',
        rating: 4.6
      });
    }
    
    if (lowerQuestion.includes('승인') || lowerResponse.includes('승인')) {
      customResources.push({
        id: 'ad-approval-process',
        title: '광고 승인 프로세스',
        type: 'video',
        description: '광고 승인 과정과 시간 단축 방법',
        url: 'https://www.facebook.com/business/help/ad-approval',
        duration: '12분',
        difficulty: 'beginner',
        rating: 4.6
      });
    }
    
    if (lowerQuestion.includes('성과') || lowerQuestion.includes('최적화')) {
      customResources.push({
        id: 'ad-optimization',
        title: '광고 최적화 전략',
        type: 'tutorial',
        description: 'ROI 향상을 위한 광고 최적화 기법',
        url: 'https://www.facebook.com/business/help/optimization',
        duration: '25분',
        difficulty: 'advanced',
        rating: 4.7
      });
    }

    return [...customResources, ...baseResources].slice(0, 4);
  };

  const resources = generateLearningResources(userQuestion, aiResponse);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'tutorial':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return "bg-blue-500";
      case 'video':
        return "bg-red-500";
      case 'document':
        return "bg-green-500";
      case 'tutorial':
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return "bg-green-100 text-green-700 border-green-200";
      case 'intermediate':
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case 'advanced':
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="w-full bg-gradient-to-br from-green-50/95 to-emerald-50/95 backdrop-blur-sm border-green-200/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-gray-800 text-xl font-bold">
            <BookOpen className="w-6 h-6 text-green-500" />
            <span>추가 학습 자료</span>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
              추천
            </Badge>
          </CardTitle>
          <Separator className="bg-green-200/50" />
        </CardHeader>
        <CardContent className="space-y-3">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/60 border-green-200/40 hover:bg-white/80 transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${getTypeColor(resource.type)} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-800 line-clamp-1">
                              {resource.title}
                            </h4>
                            {resource.isNew && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <p className="text-base text-gray-600 mb-2 line-clamp-2">
                            {resource.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => window.open(resource.url, '_blank')}
                          title="자료 열기"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDifficultyColor(resource.difficulty || 'beginner')}`}
                          >
                            {resource.difficulty === 'beginner' ? '초급' : 
                             resource.difficulty === 'intermediate' ? '중급' : '고급'}
                          </Badge>
                          {resource.duration && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {resource.duration}
                            </div>
                          )}
                          {resource.rating && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {resource.rating}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 h-6"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          열기
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          <div className="pt-2 border-t border-green-200/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>질문 기반 맞춤 추천</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>평점 기반 선별</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
