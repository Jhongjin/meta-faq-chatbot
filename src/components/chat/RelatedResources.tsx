"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Image, 
  Table, 
  ExternalLink, 
  Calendar, 
  Download,
  Eye,
  BookOpen,
  Lightbulb
} from "lucide-react";

interface ResourceItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'table' | 'guide';
  description: string;
  url?: string;
  updatedAt: string;
  content?: string;
  imageUrl?: string;
  tableData?: Array<{ [key: string]: string }>;
  tags: string[];
}

interface RelatedResourcesProps {
  resources?: ResourceItem[];
  isLoading?: boolean;
  userQuestion?: string;
  aiResponse?: string;
  sources?: Array<{
    id: string;
    title: string;
    url?: string;
    updatedAt: string;
    excerpt: string;
  }>;
}

// 샘플 데이터
const sampleResources: ResourceItem[] = [
  {
    id: "1",
    title: "Meta 광고 정책 가이드 2024",
    type: 'document',
    description: "페이스북과 인스타그램 광고 정책의 최신 가이드라인",
    url: "https://example.com/policy-guide",
    updatedAt: "2024-01-15",
    content: "광고 승인을 위한 필수 정책과 가이드라인을 포함한 종합 문서입니다.",
    tags: ["정책", "가이드", "승인"]
  },
  {
    id: "2",
    title: "광고 크기 및 형식 가이드",
    type: 'image',
    description: "각 플랫폼별 권장 광고 크기와 형식",
    updatedAt: "2024-01-10",
    imageUrl: "https://picsum.photos/400/300?random=1",
    tags: ["크기", "형식", "이미지"]
  },
  {
    id: "3",
    title: "타겟팅 옵션 비교표",
    type: 'table',
    description: "다양한 타겟팅 옵션의 특징과 활용법 비교",
    updatedAt: "2024-01-08",
    tableData: [
      { "타겟팅 유형": "관심사", "정확도": "중", "도달률": "높음", "비용": "낮음" },
      { "타겟팅 유형": "행동", "정확도": "높음", "도달률": "중", "비용": "중" },
      { "타겟팅 유형": "리타겟팅", "정확도": "매우높음", "도달률": "낮음", "비용": "높음" }
    ],
    tags: ["타겟팅", "비교", "분석"]
  },
  {
    id: "4",
    title: "광고 승인 체크리스트",
    type: 'guide',
    description: "광고 승인을 위한 단계별 체크리스트",
    updatedAt: "2024-01-12",
    content: "광고 승인을 위한 필수 체크 항목들을 단계별로 정리한 가이드입니다.",
    tags: ["승인", "체크리스트", "가이드"]
  }
];

export default function RelatedResources({ 
  resources, 
  isLoading = false, 
  userQuestion, 
  aiResponse, 
  sources = [] 
}: RelatedResourcesProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 실제 소스 데이터를 기반으로 리소스 생성 (중복 제거)
  const generateResourcesFromSources = (): ResourceItem[] => {
    console.log('RelatedResources - sources:', sources); // 디버깅용
    console.log('RelatedResources - sources length:', sources?.length); // 디버깅용
    
    if (!sources || sources.length === 0) {
      console.log('RelatedResources - sources가 없어서 샘플 데이터 사용');
      return sampleResources; // 기본 샘플 데이터 사용
    }

    // 중복 제거를 위한 Map 사용
    const uniqueSources = new Map();
    
    sources
      .filter(source => source && (source.title || source.excerpt)) // 유효한 소스만 필터링
      .forEach((source, index) => {
        const excerpt = source.excerpt || '';
        const title = source.title || `관련 문서 ${index + 1}`;
        
        // 제목을 기준으로 중복 제거
        if (!uniqueSources.has(title)) {
          uniqueSources.set(title, {
            id: source.id || `source-${index}`,
            title: title,
            type: 'document' as const,
            description: excerpt.length > 100 ? excerpt.substring(0, 100) + '...' : excerpt,
            url: source.url,
            updatedAt: source.updatedAt || new Date().toISOString().split('T')[0],
            content: excerpt,
            tags: [
              '관련문서',
              '출처'
            ]
          });
        }
      });

    return Array.from(uniqueSources.values());
  };

  const displayResources = resources || generateResourcesFromSources();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document':
        return "bg-blue-500";
      case 'image':
        return "bg-green-500";
      case 'table':
        return "bg-purple-500";
      case 'guide':
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-white/95 to-[#FAF8F3]/95 backdrop-blur-sm border-orange-200/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm font-medium">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>관련 자료</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">관련 자료를 찾는 중...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayResources || displayResources.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-white/95 to-[#FAF8F3]/95 backdrop-blur-sm border-orange-200/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm font-medium">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>관련 자료</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">질문을 시작해보세요</h4>
            <p className="text-sm text-gray-600 max-w-xs">
              좌측에서 질문하시면 관련 자료가 여기에 표시됩니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-white/95 to-[#FAF8F3]/95 backdrop-blur-sm border-orange-200/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm font-medium">
          <BookOpen className="w-4 h-4 text-orange-500" />
          <span>관련 자료</span>
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
            {displayResources.length}개
          </Badge>
        </CardTitle>
        <Separator className="bg-orange-200/50" />
      </CardHeader>
      <CardContent className="space-y-4">
        {displayResources.map((resource) => (
          <div key={resource.id} className="space-y-2">
            <Card className="bg-gradient-to-r from-white/80 to-[#FAF8F3]/80 border-orange-200/40 hover:from-white/90 hover:to-[#FAF8F3]/90 transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${getTypeColor(resource.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(resource.updatedAt).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {resource.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-100"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(resource.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-100"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {expandedItems.has(resource.id) && (
                      <div className="mt-3 pt-3 border-t border-orange-200/50">
                        {resource.type === 'image' && resource.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={resource.imageUrl} 
                              alt={resource.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        {resource.type === 'table' && resource.tableData && (
                          <div className="mb-3 overflow-x-auto">
                            <table className="w-full text-xs text-gray-700">
                              <thead>
                                <tr className="border-b border-orange-200">
                                  {Object.keys(resource.tableData[0]).map((header) => (
                                    <th key={header} className="text-left py-2 px-2 font-medium">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {resource.tableData.map((row, index) => (
                                  <tr key={index} className="border-b border-orange-100">
                                    {Object.values(row).map((cell, cellIndex) => (
                                      <td key={cellIndex} className="py-2 px-2">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {resource.content && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {resource.content}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {resource.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                원문 보기
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            다운로드
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}