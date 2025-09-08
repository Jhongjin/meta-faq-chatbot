"use client";

import { useState, useEffect, useCallback } from "react";
import { History, MessageSquare, RefreshCw, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  // handleLoadConversation에서 필요한 추가 필드들
  user_message?: string;
  ai_response?: string;
  sources?: any[];
  conversation_id?: string;
}

interface HistoryPanelProps {
  onLoadConversation?: (conversation: Conversation) => void;
  onNewChat?: () => void;
  userId?: string;
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  refreshTrigger?: number; // 새로고침 트리거
}

export default function HistoryPanel({ 
  onLoadConversation, 
  onNewChat,
  userId = "anonymous",
  className = "",
  isCollapsed = false,
  onToggle,
  refreshTrigger
}: HistoryPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대화 히스토리 로드
  const loadConversations = useCallback(async () => {
    // anonymous 사용자는 히스토리를 로드하지 않음
    if (userId === "anonymous" || !userId) {
      setConversations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/conversations?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('대화 히스토리를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      
      // API 응답을 HistoryPanel 형식에 맞게 변환
      const formattedConversations = (data.conversations || []).map((conv: any) => ({
        id: conv.conversation_id || conv.id,
        title: conv.user_message || conv.title || '대화',
        createdAt: conv.created_at,
        updatedAt: conv.created_at,
        messageCount: 1,
        // handleLoadConversation에서 필요한 원본 데이터 보존
        user_message: conv.user_message,
        ai_response: conv.ai_response,
        sources: conv.sources || [],
        conversation_id: conv.conversation_id || conv.id
      }));
      
      setConversations(formattedConversations);
    } catch (err) {
      console.error('대화 히스토리 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 대화 삭제
  const handleDeleteConversation = async (conversationId: string) => {
    // anonymous 사용자는 삭제할 수 없음
    if (userId === "anonymous" || !userId) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations?conversationId=${conversationId}&userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 삭제 성공 시 목록에서 제거
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      }
    } catch (err) {
      console.error('대화 삭제 실패:', err);
    }
  };

  // 컴포넌트 마운트 시 대화 히스토리 로드
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // refreshTrigger가 변경될 때마다 대화 히스토리 새로고침
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadConversations();
    }
  }, [refreshTrigger, loadConversations]);

  if (isCollapsed) {
    return (
      <div className={`h-full bg-white border-r border-gray-200 flex flex-col ${className}`}>
        {/* 접힌 상태 - 토글 버튼만 표시 */}
        <div className="p-2 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <History className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <History className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">대화 히스토리</h3>
              <span className="text-xs text-gray-500">{conversations.length}개</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversations}
              disabled={isLoading}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500">불러오는 중...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <History className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-xs text-red-600">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConversations}
                className="text-xs h-7 px-2 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                다시 시도
              </Button>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </div>
              {userId === "anonymous" || !userId ? (
                <>
                  <h4 className="text-xs font-medium text-gray-700">로그인이 필요합니다</h4>
                  <p className="text-xs text-gray-500">대화 히스토리를 보려면 로그인해주세요</p>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-medium text-gray-700">대화 히스토리가 없습니다</h4>
                  <p className="text-xs text-gray-500">새로운 대화를 시작해보세요</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNewChat}
                    className="text-xs h-7 px-2 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    새 대화 시작
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  onClick={() => onLoadConversation?.(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center">
                          <span className="text-[12px] font-medium text-gray-900 truncate">
                            {conversation.title.length > 18 
                              ? `${conversation.title.substring(0, 18)}...` 
                              : conversation.title}
                          </span>
                          <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(conversation.updatedAt), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
