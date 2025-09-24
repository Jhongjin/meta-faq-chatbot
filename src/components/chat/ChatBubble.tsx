"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, Calendar, FileText, User, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 커스텀 마크다운 컴포넌트
const customMarkdownComponents = {
  // 제목 스타일링
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold text-blue-300 mb-4 mt-6 border-b border-blue-500/30 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-blue-200 mb-3 mt-5 border-l-4 border-blue-400 pl-3">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-blue-100 mb-2 mt-4">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-blue-50 mb-2 mt-3">
      {children}
    </h4>
  ),
  // 강조 텍스트
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-yellow-300">
      {children}
    </strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-green-300">
      {children}
    </em>
  ),
  // 코드 블록
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-gray-700 text-yellow-200 px-1.5 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 overflow-x-auto">
      {children}
    </pre>
  ),
  // 리스트
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 my-4 pl-4">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-2 my-4 pl-4 list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-gray-200 leading-relaxed">
      {children}
    </li>
  ),
  // 링크
  a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: any }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  // 인용문
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-900/20 rounded-r-lg">
      <p className="text-blue-100 italic">
        {children}
      </p>
    </blockquote>
  ),
  // 구분선
  hr: () => (
    <hr className="my-6 border-gray-600" />
  ),
  // 테이블
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-600 rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-700">
      {children}
    </thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-gray-600">
      {children}
    </tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-gray-700/50">
      {children}
    </tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-2 text-sm text-gray-300">
      {children}
    </td>
  ),
  // 단락
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 text-gray-200 leading-relaxed">
      {children}
    </p>
  ),
};

interface Source {
  id: string;
  title: string;
  url?: string;
  updatedAt: string;
  excerpt: string;
  sourceType?: 'file' | 'url';
  documentType?: string;
}

interface ChatBubbleProps {
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Source[];
  feedback?: {
    helpful: boolean | null;
    count: number;
  };
  onFeedback?: (helpful: boolean) => void;
  noDataFound?: boolean;
  showContactOption?: boolean;
}

export default function ChatBubble({
  type,
  content,
  timestamp,
  sources = [],
  feedback,
  onFeedback,
  noDataFound = false,
  showContactOption = false,
}: ChatBubbleProps) {
  const [showSources, setShowSources] = useState(false);

  const isUser = type === "user";

  // 강력한 텍스트 디코딩 함수
  const decodeText = (text: string | undefined): string => {
    if (!text) return '';
    
    try {
      // 1. null 문자 제거
      let cleanText = text.replace(/\0/g, '');
      
      // 2. 제어 문자 제거 (탭, 줄바꿈, 캐리지 리턴 제외)
      cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      // 3. UTF-8 인코딩 보장
      cleanText = Buffer.from(cleanText, 'utf-8').toString('utf-8');
      
      // 4. 연속된 공백을 하나로 정리
      cleanText = cleanText.replace(/\s+/g, ' ');
      
      // 5. 앞뒤 공백 제거
      cleanText = cleanText.trim();
      
      // 6. 추가 한글 텍스트 정리 (깨진 문자 패턴 수정)
      cleanText = cleanText
        .replace(/[^\x20-\x7E\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '') // 한글과 기본 ASCII만 유지
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`🔧 ChatBubble 텍스트 정리: "${cleanText.substring(0, 30)}..."`);
      return cleanText;
    } catch (error) {
      console.warn('⚠️ 텍스트 디코딩 실패, 기본 정리만 적용:', error);
      // 기본 정리만 적용
      return text.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    }
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = async (source: Source) => {
    try {
      if (!source.url) {
        console.error('다운로드 URL이 없습니다:', source);
        alert('다운로드할 파일의 URL을 찾을 수 없습니다.');
        return;
      }

      console.log(`📥 파일 다운로드 시도: ${source.url}`);

      // 파일명 생성 (원본 확장자 유지)
      let fileName = source.title.replace(/_chunk_\d+/g, (match) => {
        const chunkNumber = match.match(/\d+/)?.[0] || '1';
        return `_page_${chunkNumber}`;
      });
      
      // 확장자가 없으면 원본 파일명에서 확장자 추출
      if (!fileName.includes('.')) {
        const originalFileName = source.title;
        const lastDotIndex = originalFileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
          const extension = originalFileName.substring(lastDotIndex);
          fileName += extension;
        } else {
          fileName += '.txt'; // 기본값
        }
      }

      // 파일 다운로드
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`파일 다운로드 실패: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 파일 다운로드 완료: ${fileName}`);
    } catch (error) {
      console.error('❌ 파일 다운로드 실패:', error);
      alert(`파일 다운로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // URL 링크 핸들러
  const handleUrlOpen = (source: Source) => {
    if (source.url) {
      console.log(`🌐 웹페이지 열기: ${source.url}`);
      window.open(source.url, '_blank');
    } else {
      console.error('웹페이지 URL이 없습니다:', source);
      alert('열 수 있는 웹페이지 URL을 찾을 수 없습니다.');
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 sm:mb-4`}>
      <div className={`max-w-[85%] sm:max-w-3xl ${isUser ? "order-2" : "order-1"}`}>
        {isUser ? (
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white shadow-lg"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  <div className="text-sm sm:text-sm leading-relaxed text-white prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={customMarkdownComponents}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-medium">AI</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-sm leading-relaxed text-white prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={customMarkdownComponents}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
                
                {/* Sources for assistant messages */}
                {sources.length > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSources(!showSources)}
                      className="text-xs text-blue-300 hover:text-blue-100 p-2 h-auto hover:bg-blue-900/20 border border-blue-500/30 rounded-lg transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      출처 {(() => {
                        // 중복 제거를 위한 Map 사용
                        const uniqueSources = new Map();
                        
                        sources
                          .filter(source => source && (source.title || source.excerpt))
                          .forEach((source) => {
                            // 제목 개선 로직 적용
                            let displayTitle = source.title;
                            const chunkIndex = source.id?.match(/_chunk_(\d+)/)?.[1] || '0';
                            const pageNumber = Math.floor(parseInt(chunkIndex) / 5) + 1;
                            
                            if (source.sourceType === 'url') {
                              try {
                                const url = new URL(source.url || '');
                                const domain = url.hostname.replace('www.', '');
                                
                                let actualTitle = source.title;
                                
                                // 도메인이 이미 제목에 포함되어 있는지 확인
                                if (actualTitle && actualTitle.includes(domain)) {
                                  // 도메인이 이미 포함된 경우, 도메인 부분을 제거하고 실제 제목만 사용
                                  actualTitle = actualTitle.replace(new RegExp(`^${domain}\\s*-\\s*`), '');
                                }
                                
                                if (source.title && !source.title.startsWith('url_') && source.title !== source.id) {
                                  if (actualTitle.length > 50) {
                                    actualTitle = actualTitle.substring(0, 47) + '...';
                                  }
                                } else {
                                  if (domain.includes('facebook.com')) {
                                    if (url.pathname.includes('/policies/ads')) {
                                      actualTitle = 'Facebook 광고 정책';
                                    } else if (url.pathname.includes('/business/help')) {
                                      actualTitle = 'Facebook 비즈니스 도움말';
                                    } else {
                                      actualTitle = 'Facebook 가이드';
                                    }
                                  } else if (domain.includes('instagram.com')) {
                                    actualTitle = 'Instagram 비즈니스 가이드';
                                  } else if (domain.includes('developers.facebook.com')) {
                                    actualTitle = 'Facebook 개발자 문서';
                                  } else {
                                    actualTitle = 'Meta 광고 가이드';
                                  }
                                }
                                
                                displayTitle = `${domain} - ${actualTitle} (${pageNumber}페이지)`;
                              } catch {
                                displayTitle = `${source.title} (${pageNumber}페이지)`;
                              }
                            } else {
                              let cleanFileName = source.title.replace(/\.(pdf|docx|txt)$/i, '');
                              if (cleanFileName.length > 40) {
                                cleanFileName = cleanFileName.substring(0, 37) + '...';
                              }
                              displayTitle = `${cleanFileName} (${pageNumber}페이지)`;
                            }
                            
                            // 중복 제거를 위한 키 생성
                            const resourceKey = `${displayTitle}_${source.url || source.id}`;
                            
                            if (!uniqueSources.has(resourceKey)) {
                              uniqueSources.set(resourceKey, source);
                            }
                          });
                        
                        return uniqueSources.size;
                      })()}개 보기
                      <span className="ml-1 text-blue-400">
                        {showSources ? '▲' : '▼'}
                      </span>
                    </Button>
                    
                    {showSources && (
                      <div className="mt-3 space-y-3">
                        {(() => {
                          // 중복 제거를 위한 Map 사용 (제목과 URL을 기준으로 중복 제거)
                          const uniqueSources = new Map();
                          
                          sources
                            .filter(source => source && (source.title || source.excerpt))
                            .forEach((source, index) => {
                              // 제목 개선 로직 적용
                              let displayTitle = source.title;
                              const chunkIndex = source.id?.match(/_chunk_(\d+)/)?.[1] || '0';
                              const pageNumber = Math.floor(parseInt(chunkIndex) / 5) + 1;
                              
                              if (source.sourceType === 'url') {
                                try {
                                  const url = new URL(source.url || '');
                                  const domain = url.hostname.replace('www.', '');
                                  
                                  let actualTitle = source.title;
                                  
                                  // 도메인이 이미 제목에 포함되어 있는지 확인
                                  if (actualTitle && actualTitle.includes(domain)) {
                                    // 도메인이 이미 포함된 경우, 도메인 부분을 제거하고 실제 제목만 사용
                                    actualTitle = actualTitle.replace(new RegExp(`^${domain}\\s*-\\s*`), '');
                                  }
                                  
                                  if (source.title && !source.title.startsWith('url_') && source.title !== source.id) {
                                    if (actualTitle.length > 50) {
                                      actualTitle = actualTitle.substring(0, 47) + '...';
                                    }
                                  } else {
                                    if (domain.includes('facebook.com')) {
                                      if (url.pathname.includes('/policies/ads')) {
                                        actualTitle = 'Facebook 광고 정책';
                                      } else if (url.pathname.includes('/business/help')) {
                                        actualTitle = 'Facebook 비즈니스 도움말';
                                      } else {
                                        actualTitle = 'Facebook 가이드';
                                      }
                                    } else if (domain.includes('instagram.com')) {
                                      actualTitle = 'Instagram 비즈니스 가이드';
                                    } else if (domain.includes('developers.facebook.com')) {
                                      actualTitle = 'Facebook 개발자 문서';
                                    } else {
                                      actualTitle = 'Meta 광고 가이드';
                                    }
                                  }
                                  
                                  displayTitle = `${domain} - ${actualTitle} (${pageNumber}페이지)`;
                                } catch {
                                  displayTitle = `${source.title} (${pageNumber}페이지)`;
                                }
                              } else {
                                let cleanFileName = source.title.replace(/\.(pdf|docx|txt)$/i, '');
                                if (cleanFileName.length > 40) {
                                  cleanFileName = cleanFileName.substring(0, 37) + '...';
                                }
                                displayTitle = `${cleanFileName} (${pageNumber}페이지)`;
                              }
                              
                              // 중복 제거를 위한 키 생성 (제목과 URL 조합)
                              const resourceKey = `${displayTitle}_${source.url || source.id}`;
                              
                              if (!uniqueSources.has(resourceKey)) {
                                uniqueSources.set(resourceKey, {
                                  ...source,
                                  displayTitle: displayTitle
                                });
                              }
                            });
                          
                          return Array.from(uniqueSources.values());
                        })().map((source, index) => (
                          <Card key={source.id} className="modern-card-dark border-gray-600/50 bg-gray-800/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">{index + 1}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-sm font-medium text-white truncate pr-2 leading-tight">
                                      {source.displayTitle || source.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          source.sourceType === 'file' 
                                            ? 'bg-green-600/30 text-green-300 border-green-500/50' 
                                            : 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                                        }`}
                                      >
                                        {source.sourceType === 'file' ? '📄 파일' : '🔗 링크'}
                                      </Badge>
                                            {source.similarity && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Badge 
                                                    variant="outline" 
                                                    className="text-xs bg-purple-600/30 text-purple-300 border-purple-500/50 cursor-help transition-all duration-200 hover:bg-purple-600/50 hover:border-purple-400 hover:scale-105 hover:shadow-lg"
                                                  >
                                                    유사도 {Math.round(source.similarity * 100)}%
                                                  </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent 
                                                  side="top" 
                                                  align="start"
                                                  sideOffset={200}
                                                  className="max-w-sm bg-gray-900 border border-purple-500/30 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 z-50"
                                                >
                                              <div className="p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                  <p className="font-semibold text-purple-300 text-sm">유사도 점수</p>
                                                </div>
                                                <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                                                  이 문서가 질문과 얼마나 관련성이 높은지를 나타내는 점수입니다.
                                                </p>
                                                <div className="space-y-1 text-xs">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    <span className="text-green-300">90% 이상: 매우 관련성 높음</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                    <span className="text-blue-300">70-89%: 관련성 높음</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                    <span className="text-yellow-300">50-69%: 보통 관련성</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                    <span className="text-red-300">50% 미만: 낮은 관련성</span>
                                                  </div>
                                                </div>
                                                <div className="mt-3 pt-2 border-t border-gray-700">
                                                  <p className="text-xs text-gray-400">
                                                    💡 코사인 유사도로 계산됩니다
                                                  </p>
                                                </div>
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            )}
                                      <span className="text-xs text-gray-400">
                                        마지막 업데이트: {new Date(source.updatedAt).toLocaleDateString('ko-KR')}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {source.sourceType === 'file' ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-green-400 hover:text-green-300 hover:bg-green-900/30 px-2 py-1 h-6 transition-all duration-200 rounded-lg"
                                          onClick={() => handleFileDownload(source)}
                                          title="파일 다운로드"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          다운로드
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 px-2 py-1 h-6 transition-all duration-200 rounded-lg"
                                          onClick={() => handleUrlOpen(source)}
                                          title="웹페이지 열기"
                                        >
                                          <Globe className="w-3 h-3 mr-1" />
                                          웹페이지 열기
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contact option for no data found */}
                {showContactOption && (
                  <Card className="mt-3 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">!</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                            페이스북 담당팀에 문의하시겠습니까?
                          </h4>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                            관련 정보가 없어 답변을 드릴 수 없습니다. 담당팀에 직접 문의하시면 더 정확한 답변을 받으실 수 있습니다.
                          </p>
                          <Button
                            onClick={() => {
                              // 직접 메일 발송
                              if (typeof window !== 'undefined') {
                                const event = new CustomEvent('sendContactEmail', { 
                                  detail: { question: content } 
                                });
                                window.dispatchEvent(event);
                              }
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            📧 담당팀에 문의하기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Feedback buttons for assistant messages */}
                {feedback && onFeedback && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(true)}
                      className={`text-xs p-2 h-auto transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        feedback.helpful === true
                          ? "text-green-400 bg-green-500/20 border border-green-500/30 shadow-lg shadow-green-500/20"
                          : "text-gray-300 hover:text-green-400 hover:bg-green-500/20 hover:border hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/20"
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 mr-1 transition-transform duration-200 ${
                        feedback.helpful === true ? "scale-110" : ""
                      }`} />
                      <span className="hidden sm:inline">도움됨</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(false)}
                      className={`text-xs p-2 h-auto transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        feedback.helpful === false
                          ? "text-red-400 bg-red-500/20 border border-red-500/30 shadow-lg shadow-red-500/20"
                          : "text-gray-300 hover:text-red-400 hover:bg-red-500/20 hover:border hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/20"
                      }`}
                    >
                      <ThumbsDown className={`w-3 h-3 mr-1 transition-transform duration-200 ${
                        feedback.helpful === false ? "scale-110" : ""
                      }`} />
                      <span className="hidden sm:inline">도움안됨</span>
                    </Button>
                    <span className="text-xs text-gray-400">{timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}