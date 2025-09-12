"use client";

import React, { useState } from "react";
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
  Globe
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
  sourceType?: 'file' | 'url';
  documentType?: string;
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
    sourceType?: 'file' | 'url';
    documentType?: string;
  }>;
}

// 샘플 데이터
const sampleResources: ResourceItem[] = [
  {
    id: "1",
    title: "Meta 광고 정책 가이드",
    type: "document",
    description: "Meta 광고 정책에 대한 상세한 가이드입니다.",
    url: "/documents/meta-ad-policy.pdf",
    updatedAt: "2024-01-15",
    content: "Meta 광고 정책에 대한 상세한 내용을 포함한 가이드 문서입니다.",
    tags: ["정책", "가이드", "Meta"]
  },
  {
    id: "2",
    type: "image",
    title: "광고 승인 프로세스 플로우차트",
    description: "광고 승인 과정을 시각적으로 보여주는 플로우차트입니다.",
    imageUrl: "https://picsum.photos/400/300?random=1",
    updatedAt: "2024-01-10",
    tags: ["승인", "프로세스", "플로우차트"]
  },
  {
    id: "3",
    type: "table",
    title: "광고 타입별 제한사항",
    description: "각 광고 타입별 제한사항을 정리한 표입니다.",
    updatedAt: "2024-01-12",
    tableData: [
      { "광고 타입": "이미지 광고", "최대 크기": "1200x628px", "파일 형식": "JPG, PNG" },
      { "광고 타입": "비디오 광고", "최대 크기": "1920x1080px", "파일 형식": "MP4, MOV" },
      { "광고 타입": "카드 광고", "최대 크기": "1200x628px", "파일 형식": "JPG, PNG" }
    ],
    tags: ["제한사항", "표", "광고타입"]
  },
  {
    id: "4",
    type: "guide",
    title: "광고 승인 체크리스트",
    description: "광고 승인을 위한 필수 체크 항목들을 단계별로 정리한 가이드입니다.",
    content: "광고 승인을 위한 필수 체크 항목들을 단계별로 정리한 가이드입니다.",
    tags: ["승인", "체크리스트", "가이드"],
    updatedAt: "2024-01-15"
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

  // 파일 다운로드 핸들러
  const handleFileDownload = async (resource: ResourceItem) => {
    try {
      if (!resource.url) {
        console.error('다운로드 URL이 없습니다:', resource);
        alert('다운로드할 파일을 찾을 수 없습니다.');
        return;
      }

      console.log(`📥 파일 다운로드 시작: ${resource.title}`);
      
      // API 호출로 실제 파일 다운로드
      const response = await fetch(resource.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 파일명에서 _chunk_0 패턴을 _page_1로 변경
      let fileName = resource.title.replace(/_chunk_\d+/g, (match) => {
        const chunkNumber = match.match(/\d+/)?.[0] || '1';
        return `_page_${chunkNumber}`;
      });
      
      // 확장자 추가
      if (!fileName.includes('.')) {
        fileName += '.txt';
      }
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 파일 다운로드 완료: ${fileName}`);
    } catch (error) {
      console.error('❌ 파일 다운로드 실패:', error);
      alert('파일 다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // URL 링크 핸들러
  const handleUrlOpen = (resource: ResourceItem) => {
    if (resource.url) {
      console.log(`🌐 웹페이지 열기: ${resource.url}`);
      window.open(resource.url, '_blank');
    } else {
      console.error('웹페이지 URL이 없습니다:', resource);
      alert('열 수 있는 웹페이지 URL을 찾을 수 없습니다.');
    }
  };

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
        let title = source.title || `관련 문서 ${index + 1}`;
        
        // _chunk_0 패턴을 _page_N으로 변경
        title = title.replace(/_chunk_\d+/g, (match) => {
          const chunkNumber = match.match(/\d+/)?.[0] || '1';
          return `_page_${chunkNumber}`;
        });

        const resourceKey = `${source.id || title}`;
        
        if (!uniqueSources.has(resourceKey)) {
          uniqueSources.set(resourceKey, {
            id: source.id || `source-${index}`,
            title: title,
            type: 'document' as const,
            description: excerpt.length > 100 ? excerpt.substring(0, 100) + '...' : excerpt,
            url: source.url || `/api/download/${source.id}`,
            updatedAt: source.updatedAt || new Date().toISOString(),
            content: excerpt,
            tags: ['문서', '관련자료'],
            sourceType: source.sourceType || 'file',
            documentType: source.documentType || 'document'
          });
        }
      });

    console.log('RelatedResources - 생성된 리소스 수:', uniqueSources.size);
    return Array.from(uniqueSources.values());
  };

  // 표시할 리소스 결정
  const displayResources = resources && resources.length > 0 ? resources : generateResourcesFromSources();

  // 아이콘 반환 함수
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

  // 타입별 색상 반환 함수
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

  // 확장/축소 토글 함수
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">관련 자료가 없습니다</h4>
              <p className="text-xs text-gray-500">질문에 대한 관련 자료를 찾을 수 없습니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                resource.sourceType === 'file' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {resource.sourceType === 'file' ? '📄 파일' : '🌐 웹페이지'}
                            </Badge>
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
                          {resource.sourceType === 'file' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={() => handleFileDownload(resource)}
                              title="파일 다운로드"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              onClick={() => handleUrlOpen(resource)}
                              title="웹페이지 열기"
                            >
                              <Globe className="w-3 h-3" />
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
                              {resource.sourceType === 'file' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleFileDownload(resource)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  파일 다운로드
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleUrlOpen(resource)}
                                >
                                  <Globe className="w-3 h-3 mr-1" />
                                  웹페이지 열기
                                </Button>
                              )}
                            </div>
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

    </div>
  );
}