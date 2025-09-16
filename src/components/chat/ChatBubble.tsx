"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, Calendar, FileText, User, Download, Globe, Bot, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  confidence?: number;
  processingTime?: number;
  model?: string;
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
  confidence,
  processingTime,
  model,
}: ChatBubbleProps) {
  const [showSources, setShowSources] = useState(false);

  const isUser = type === "user";

  // 파일 다운로드 핸들러
  const handleFileDownload = async (source: Source) => {
    try {
      if (!source.url) {
        console.error('다운로드 URL이 없습니다:', source);
        alert('다운로드할 파일의 URL을 찾을 수 없습니다.');
        return;
      }

      console.log(`📥 파일 다운로드 시도: ${source.url}`);

      // 파일명 생성
      const fileName = source.title.replace(/_chunk_\d+/g, (match) => {
        const chunkNumber = match.match(/\d+/)?.[0] || '1';
        return `_page_${chunkNumber}`;
      });

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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
                      출처 {sources.length}개 보기
                      <span className="ml-1 text-blue-400">
                        {showSources ? '▲' : '▼'}
                      </span>
                    </Button>
                    
                    {showSources && (
                      <div className="mt-3 space-y-3">
                        {sources.map((source, index) => (
                          <Card key={source.id} className="modern-card-dark border-gray-600/50 bg-gray-800/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-sm font-bold">{index + 1}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="text-base font-semibold text-white truncate pr-2 leading-tight">
                                      {source.title.replace(/_chunk_\d+/g, `_page_${index + 1}`)}
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                      {source.url && (
                                        <>
                                          {source.sourceType === 'file' ? (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-xs text-green-400 hover:text-green-300 p-2 h-8 hover:bg-green-900/30 rounded-lg transition-all duration-200"
                                              onClick={() => handleFileDownload(source)}
                                              title="파일 다운로드"
                                            >
                                              <Download className="w-4 h-4" />
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-xs text-blue-400 hover:text-blue-300 p-2 h-8 hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                                              onClick={() => handleUrlOpen(source)}
                                              title="웹페이지 열기"
                                            >
                                              <Globe className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                                    {source.excerpt}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm text-gray-400">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      {new Date(source.updatedAt).toLocaleDateString('ko-KR')}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <Badge variant="secondary" className="text-xs bg-blue-600/30 text-blue-300 border-blue-500/50 px-3 py-1">
                                        출처 {index + 1}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs px-3 py-1 ${
                                          source.sourceType === 'file' 
                                            ? 'bg-green-600/30 text-green-300 border-green-500/50' 
                                            : 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                                        }`}
                                      >
                                        {source.sourceType === 'file' ? '📄 파일' : '🌐 웹페이지'}
                                      </Badge>
                                      {source.sourceType === 'file' ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-green-400 hover:text-green-300 hover:bg-green-900/30 px-3 py-2 h-8 transition-all duration-200 rounded-lg"
                                          onClick={() => handleFileDownload(source)}
                                          title="파일 다운로드"
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          다운로드
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 px-3 py-2 h-8 transition-all duration-200 rounded-lg"
                                          onClick={() => handleUrlOpen(source)}
                                          title="웹페이지 열기"
                                        >
                                          <Globe className="w-4 h-4 mr-2" />
                                          웹페이지
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

                {/* Vultr+Ollama 정보 표시 */}
                {(confidence !== undefined || processingTime !== undefined || model) && (
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    {confidence !== undefined && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        신뢰도: {Math.round(confidence)}%
                      </span>
                    )}
                    {processingTime !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {processingTime}ms
                      </span>
                    )}
                    {model && (
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {model}
                      </span>
                    )}
                  </div>
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