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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-3xl ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm"
          }`}
        >
          <div className="flex items-start space-x-3">
            {!isUser && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">AI</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isUser ? "text-white" : "text-gray-900 dark:text-white"}`}>
                {content}
              </p>
              
              {/* Sources for assistant messages */}
              {!isUser && sources.length > 0 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(!showSources)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-0 h-auto"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    출처 {sources.length}개 보기
                  </Button>
                  
                  {showSources && (
                    <div className="mt-2 space-y-2">
                      {sources.map((source) => (
                        <Card key={source.id} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {source.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {source.excerpt}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {source.updatedAt}
                                  </div>
                                  {source.url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                                      onClick={() => window.open(source.url, "_blank")}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      원본 보기
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
            </div>
            
            {isUser && (
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">사</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Feedback and actions for assistant messages */}
        {!isUser && (
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback?.(true)}
                className={`h-8 px-2 text-xs ${
                  feedback?.helpful === true
                    ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                }`}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                도움됨
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback?.(false)}
                className={`h-8 px-2 text-xs ${
                  feedback?.helpful === false
                    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                }`}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                도움 안됨
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onFavorite}
                className={`h-8 px-2 text-xs ${
                  isFavorite
                    ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                }`}
              >
                <Star className={`w-3 h-3 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                즐겨찾기
              </Button>
              <span className="text-xs text-gray-400 dark:text-gray-500">{timestamp}</span>
            </div>
          </div>
        )}
        
        {/* Timestamp for user messages */}
        {isUser && (
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">{timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
