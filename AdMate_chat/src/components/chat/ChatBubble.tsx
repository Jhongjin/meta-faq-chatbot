"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Star, ExternalLink, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Source {
  id: string;
  title: string;
  url?: string;
  updatedAt: string;
  excerpt: string;
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
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function ChatBubble({
  type,
  content,
  timestamp,
  sources = [],
  feedback,
  onFeedback,
  onFavorite,
  isFavorite = false,
}: ChatBubbleProps) {
  const [showSources, setShowSources] = useState(false);

  const isUser = type === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 sm:mb-4`}>
      <div className={`max-w-[85%] sm:max-w-3xl ${isUser ? "order-2" : "order-1"}`}>
        {isUser ? (
          <div
            className="rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white shadow-lg"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-sm leading-relaxed text-white">
                  {content}
                </p>
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
                <p className="text-sm sm:text-sm leading-relaxed text-white">
                  {content}
                </p>
                
                {/* Sources for assistant messages */}
                {sources.length > 0 && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSources(!showSources)}
                      className="text-xs text-gray-300 hover:text-white p-0 h-auto hover:bg-gray-700"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      출처 {sources.length}개 보기
                    </Button>
                    
                    {showSources && (
                      <div className="mt-2 space-y-2">
                        {sources.map((source) => (
                          <Card key={source.id} className="border-gray-600/50 bg-gray-700/80 backdrop-blur-sm">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-white truncate">
                                    {source.title}
                                  </h4>
                                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                    {source.excerpt}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <div className="flex items-center text-xs text-gray-400">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(source.updatedAt).toLocaleDateString('ko-KR')}
                                    </div>
                                    {source.url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-gray-300 hover:text-white p-0 h-auto hover:bg-gray-600"
                                        onClick={() => window.open(source.url, '_blank')}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        원문 보기
                                      </Button>
                                    )}
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
                
                {/* Feedback buttons for assistant messages */}
                {feedback && onFeedback && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(true)}
                      className={`text-xs p-1 h-auto ${
                        feedback.helpful === true
                          ? "text-green-400 bg-green-500/20"
                          : "text-gray-300 hover:text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">도움됨</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback(false)}
                      className={`text-xs p-1 h-auto ${
                        feedback.helpful === false
                          ? "text-red-400 bg-red-500/20"
                          : "text-gray-300 hover:text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">도움안됨</span>
                    </Button>
                    {onFavorite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onFavorite}
                        className={`text-xs p-1 h-auto ${
                          isFavorite
                            ? "text-yellow-400 bg-yellow-500/20"
                            : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/20"
                        }`}
                      >
                        <Star className={`w-3 h-3 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                        <span className="hidden sm:inline">즐겨찾기</span>
                      </Button>
                    )}
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