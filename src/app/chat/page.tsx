"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/layouts/MainLayout";
import ChatBubble from "@/components/chat/ChatBubble";
import ConversationHistory from "@/components/chat/ConversationHistory";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Star, ThumbsUp, ThumbsDown, RotateCcw, AlertCircle, CheckCircle, History, FileText, Target, Lightbulb, BookOpen, MessageSquare, Trash2, RefreshCw, PanelLeft, PanelRight, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{
    id: string;
    title: string;
    url?: string;
    updatedAt: string;
    excerpt: string;
  }>;
  feedback?: {
    helpful: boolean | null;
    count: number;
  };
  isFavorite?: boolean;
}

function ChatPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "안녕하세요! 메타 광고 FAQ AI 챗봇입니다. 광고 정책, 가이드라인, 설정 방법 등에 대해 궁금한 점이 있으시면 자유롭게 질문해주세요. 한국어로 질문하시면 됩니다.",
      timestamp: "방금 전",
      sources: [],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 20), 80);
      setLeftPanelWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
    if (!isRightPanelCollapsed) {
      // 패널을 접을 때 좌측 패널을 100%로 설정
      setLeftPanelWidth(100);
    } else {
      // 패널을 펼칠 때 기본 50:50 비율로 설정
      setLeftPanelWidth(50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 모바일에서 우측 패널 기본 접기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg 브레이크포인트
        setIsRightPanelCollapsed(true);
      }
    };

    handleResize(); // 초기 실행
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // URL 파라미터에서 질문을 가져와서 자동으로 전송
  useEffect(() => {
    const question = searchParams.get('q');
    if (question && question.trim()) {
      setInputValue(question);
      // 컴포넌트가 마운트된 후 자동으로 질문 전송 (지연 시간 단축)
      setTimeout(() => {
        handleSendMessageWithQuestion(question);
        // URL에서 질문 파라미터 제거 (브라우저 히스토리 정리)
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url.toString());
      }, 200);
    }
  }, [searchParams]);

  // 컴포넌트 언마운트 시 대화 히스토리 저장 (ref를 사용하여 최신 값 참조)
  const messagesRef = useRef(messages);
  const savedMessageIdsRef = useRef(savedMessageIds);
  const userRef = useRef(user);
  const isSavingRef = useRef(isSaving);

  // ref 값들을 최신으로 업데이트
  useEffect(() => {
    messagesRef.current = messages;
    savedMessageIdsRef.current = savedMessageIds;
    userRef.current = user;
    isSavingRef.current = isSaving;
  });

  useEffect(() => {
    let isUnmounting = false;
    
    const saveConversationOnUnmount = async () => {
      if (isUnmounting || isSavingRef.current) {
        console.log('이미 언마운트 중이거나 저장 중입니다. 중복 저장을 방지합니다.');
        return;
      }
      
      isUnmounting = true;
      
      const currentUser = userRef.current;
      const currentMessages = messagesRef.current;
      const currentSavedIds = savedMessageIdsRef.current;
      
      if (currentUser && currentMessages.length > 1) {
        try {
          const userMessages = currentMessages.filter(msg => msg.type === 'user');
          const aiMessages = currentMessages.filter(msg => msg.type === 'assistant');
          
          // 대화 쌍을 정확하게 매칭하여 저장되지 않은 것만 필터링
          const conversationPairs = [];
          for (let i = 0; i < Math.min(userMessages.length, aiMessages.length); i++) {
            const userMsg = userMessages[i];
            const aiMsg = aiMessages[i];
            
            // 둘 다 저장되지 않은 경우만 저장 대상에 포함
            if (!currentSavedIds.has(userMsg.id) && !currentSavedIds.has(aiMsg.id)) {
              conversationPairs.push({ userMsg, aiMsg });
            }
          }
          
          if (conversationPairs.length === 0) {
            console.log('세션 종료 시 저장할 대화가 없습니다.');
            return;
          }
          
          let savedCount = 0;
          for (const { userMsg, aiMsg } of conversationPairs) {
            // 더 강력한 고유 ID 생성 (UUID 스타일)
            const uniqueId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${userMsg.id}_${aiMsg.id}`;
            
            const response = await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: currentUser.id,
                conversationId: uniqueId,
                userMessage: userMsg.content,
                aiResponse: aiMsg.content,
                sources: aiMsg.sources || [],
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                savedCount++;
                console.log(`세션 종료 시 대화 저장 성공: ${uniqueId}`);
              } else {
                console.log(`세션 종료 시 대화 저장 실패: ${data.message}`);
              }
            }
          }
          
          if (savedCount > 0) {
            console.log(`세션 종료 시 ${savedCount}개의 대화가 히스토리에 저장되었습니다.`);
          }
        } catch (error) {
          console.error('세션 종료 시 대화 히스토리 저장 오류:', error);
        }
      }
    };

    // 페이지 언로드 시 대화 저장
    const handleBeforeUnload = () => {
      saveConversationOnUnmount();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveConversationOnUnmount();
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  const handleSendMessageWithQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 실제 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question.trim(),
          conversationHistory: messages.slice(-10), // 최근 10개 메시지만 컨텍스트로 사용
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || '응답을 받는 중 오류가 발생했습니다.');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response.content,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sources: data.response.sources || [],
        feedback: { helpful: null, count: 0 },
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // 대화 히스토리 저장은 "새 대화" 버튼 클릭 시에만 수행
      // 자동 저장을 제거하여 중복 저장 방지
      
      // 성공 토스트
      toast({
        title: "답변 완료",
        description: "AI가 답변을 생성했습니다.",
        duration: 2000,
      });

    } catch (error) {
      console.error('채팅 API 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      
      // 에러 메시지 표시
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다.\n\n${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}\n\n잠시 후 다시 시도해주세요.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sources: [],
        feedback: { helpful: null, count: 0 },
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // 에러 토스트
      toast({
        title: "오류 발생",
        description: "AI 응답을 받는 중 문제가 발생했습니다.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // 실제 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: messages.slice(-10), // 최근 10개 메시지만 컨텍스트로 사용
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || '응답을 받는 중 오류가 발생했습니다.');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response.content,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sources: data.response.sources || [],
        feedback: { helpful: null, count: 0 },
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // 대화 히스토리 저장은 "새 대화" 버튼 클릭 시에만 수행
      // 자동 저장을 제거하여 중복 저장 방지
      
      // 성공 토스트
      toast({
        title: "답변 완료",
        description: "AI가 답변을 생성했습니다.",
        duration: 2000,
      });

    } catch (error) {
      console.error('채팅 API 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      
      // 에러 메시지 표시
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다.\n\n${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}\n\n잠시 후 다시 시도해주세요.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sources: [],
        feedback: { helpful: null, count: 0 },
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // 에러 토스트
      toast({
        title: "오류 발생",
        description: "AI 응답을 받는 중 문제가 발생했습니다.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (isSaving) {
      console.log('이미 저장 중입니다. 중복 실행을 방지합니다.');
      return;
    }

    // 현재 대화가 있고 사용자가 로그인되어 있다면 히스토리에 저장
    if (user && messages.length > 1) {
      setIsSaving(true);
      try {
        // 사용자 메시지와 AI 응답을 분리하여 저장
        const userMessages = messages.filter(msg => msg.type === 'user');
        const aiMessages = messages.filter(msg => msg.type === 'assistant');
        
        // 대화 쌍을 정확하게 매칭하여 저장되지 않은 것만 필터링
        const conversationPairs = [];
        for (let i = 0; i < Math.min(userMessages.length, aiMessages.length); i++) {
          const userMsg = userMessages[i];
          const aiMsg = aiMessages[i];
          
          // 둘 다 저장되지 않은 경우만 저장 대상에 포함
          if (!savedMessageIds.has(userMsg.id) && !savedMessageIds.has(aiMsg.id)) {
            conversationPairs.push({ userMsg, aiMsg });
          }
        }
        
        if (conversationPairs.length === 0) {
          toast({
            title: "저장할 대화 없음",
            description: "이미 저장된 대화이거나 저장할 새로운 대화가 없습니다.",
            duration: 2000,
          });
          return;
        }
        
        // 각 대화 쌍을 히스토리에 저장
        let savedCount = 0;
        const newSavedIds = new Set<string>();
        
        for (const { userMsg, aiMsg } of conversationPairs) {
          // 더 강력한 고유 ID 생성 (UUID 스타일)
          const uniqueId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${userMsg.id}_${aiMsg.id}`;
          
          const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              conversationId: uniqueId,
              userMessage: userMsg.content,
              aiResponse: aiMsg.content,
              sources: aiMsg.sources || [],
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              savedCount++;
              newSavedIds.add(userMsg.id);
              newSavedIds.add(aiMsg.id);
              console.log(`대화 저장 성공: ${uniqueId}`);
            } else {
              console.log(`대화 저장 실패: ${data.message}`);
            }
          }
        }
        
        // 저장된 메시지 ID들을 상태에 추가
        if (newSavedIds.size > 0) {
          setSavedMessageIds(prev => new Set([...prev, ...newSavedIds]));
        }
        
        if (savedCount > 0) {
          toast({
            title: "대화 저장됨",
            description: `${savedCount}개의 대화가 히스토리에 저장되었습니다.`,
            duration: 2000,
          });
        } else {
          toast({
            title: "저장 실패",
            description: "대화 히스토리 저장에 실패했습니다.",
            variant: "destructive",
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('대화 히스토리 저장 오류:', error);
        toast({
          title: "저장 실패",
          description: "대화 히스토리 저장에 실패했습니다.",
          variant: "destructive",
          duration: 2000,
        });
      } finally {
        setIsSaving(false);
      }
    }
    
    // 새 대화 시작
    setMessages([
      {
        id: "1",
        type: "assistant",
        content: "안녕하세요! 메타 광고 FAQ AI 챗봇입니다. 광고 정책, 가이드라인, 설정 방법 등에 대해 궁금한 점이 있으시면 자유롭게 질문해주세요. 한국어로 질문하시면 됩니다.",
        timestamp: "방금 전",
        sources: [],
      },
    ]);
    setError(null);
    setConversationId(null);
    setSavedMessageIds(new Set()); // 저장된 메시지 ID 초기화
    toast({
      title: "새 대화 시작",
      description: "새로운 대화를 시작했습니다.",
      duration: 2000,
    });
  };

  const handleLoadConversation = (conversation: any) => {
    setMessages([
      {
        id: "1",
        type: "assistant",
        content: "안녕하세요! 메타 광고 FAQ AI 챗봇입니다. 광고 정책, 가이드라인, 설정 방법 등에 대해 궁금한 점이 있으시면 자유롭게 질문해주세요. 한국어로 질문하시면 됩니다.",
        timestamp: "방금 전",
        sources: [],
      },
      {
        id: "2",
        type: "user",
        content: conversation.user_message,
        timestamp: new Date(conversation.created_at).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      },
      {
        id: "3",
        type: "assistant",
        content: conversation.ai_response,
        timestamp: new Date(conversation.created_at).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sources: conversation.sources || [],
        feedback: { helpful: null, count: 0 },
      },
    ]);
    setConversationId(conversation.conversation_id);
    setHistoryOpen(false);
    toast({
      title: "대화 로드 완료",
      description: "이전 대화를 불러왔습니다.",
      duration: 2000,
    });
  };

  const handleTextareaResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    handleTextareaResize();
  }, [inputValue]);

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: { helpful, count: (msg.feedback?.count || 0) + 1 } }
        : msg
    ));
  };

  const handleFavorite = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isFavorite: !msg.isFavorite }
        : msg
    ));
  };


  // 채팅 헤더 컴포넌트
  const chatHeader = (
    <div className="bg-black/80 backdrop-blur-md border-b border-gray-800/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              메타 광고 FAQ AI 챗봇
            </h2>
            <p className="text-xs text-gray-300">
              광고 정책과 가이드라인에 대해 질문해주세요
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 패널 토글 버튼 - 데스크톱에서만 표시 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRightPanel}
            className="hidden lg:flex items-center space-x-2 h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            {isRightPanelCollapsed ? (
              <PanelRight className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
            <span className="text-xs">
              {isRightPanelCollapsed ? "패널 펼치기" : "패널 접기"}
            </span>
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-gray-600 hidden lg:block" />
          
          {/* 히스토리 버튼 */}
          {user ? (
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <History className="w-4 h-4" />
                  <span className="text-xs">히스토리</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96 bg-gray-800/95 backdrop-blur-md border-gray-700">
                <SheetTitle className="sr-only">대화 히스토리</SheetTitle>
                <ConversationHistory
                  userId={user.id}
                  onLoadConversation={handleLoadConversation}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast({
                  title: "로그인 필요",
                  description: "히스토리 기능을 이용하려면 로그인 하세요",
                  variant: "default",
                });
              }}
              className="flex items-center space-x-2 h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <History className="w-4 h-4" />
              <span className="text-xs">히스토리</span>
            </Button>
          )}
          
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
          
          {/* 새 대화 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="flex items-center space-x-2 h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">새 대화</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout chatHeader={chatHeader}>
      <div className="flex h-[calc(100vh-8rem)] mt-32">
        {/* Left Side - Chat Area */}
        <motion.div 
          className="flex flex-col border-r border-gray-800/50 h-full lg:border-r"
          animate={{ 
            width: isRightPanelCollapsed ? '100%' : `${leftPanelWidth}%`,
            transition: isResizing 
              ? { duration: 0 } // 리사이즈 중에는 애니메이션 없음
              : { duration: 0.3, ease: "easeInOut" } // 일반적인 토글 시에만 애니메이션
          }}
        >
          {/* 간소화된 채팅 헤더 */}
          <div className="h-4"></div>

          {/* Messages Container - Lovable style dark */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar" style={{ backgroundColor: '#212121' }}>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                type={message.type}
                content={message.content}
                timestamp={message.timestamp}
                sources={message.sources}
                feedback={message.feedback}
                onFeedback={(helpful) => handleFeedback(message.id, helpful)}
                onFavorite={() => handleFavorite(message.id)}
                isFavorite={message.isFavorite}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-lg rounded-xl px-4 py-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white text-sm font-medium">AI</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Lovable style dark */}
          <div className="backdrop-blur-sm border-t border-gray-800/50 p-3 sm:p-4" style={{ backgroundColor: '#212121' }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="메타 광고에 대해 궁금한 점을 질문해주세요..."
                    className="pr-10 sm:pr-12 resize-none min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] text-sm sm:text-base border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
                    style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}
                    disabled={isLoading}
                    rows={1}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-1 sm:right-2 bottom-1 sm:bottom-2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-full"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs text-gray-400">
                <p className="hidden sm:block">Enter 키로 전송, Shift + Enter로 줄바꿈</p>
                <p className="sm:hidden">Enter로 전송</p>
                {error && (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">연결 오류</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resize Handle - 데스크톱에서만 표시 */}
        {!isRightPanelCollapsed && (
          <div 
            className={`w-1 bg-gray-800 hover:bg-orange-500 cursor-col-resize transition-colors hidden lg:block ${
              isResizing ? 'bg-orange-500' : ''
            }`}
            onMouseDown={handleResize}
            style={{ cursor: 'col-resize' }}
          />
        )}

        {/* Right Side - Content Area */}
        <AnimatePresence>
          {!isRightPanelCollapsed && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: `${100 - leftPanelWidth}%`, 
                opacity: 1,
                transition: isResizing 
                  ? { duration: 0 } // 리사이즈 중에는 애니메이션 없음
                  : { duration: 0.3, ease: "easeInOut" } // 일반적인 토글 시에만 애니메이션
              }}
              exit={{ 
                width: 0, 
                opacity: 0,
                transition: { duration: 0.3, ease: "easeInOut" }
              }}
              className="hidden lg:flex flex-col bg-[#FDFBF6] rounded-lg h-full overflow-hidden"
              style={{ borderRadius: '12px' }}
            >
            {/* Content Header */}
            <div className="bg-[#FDFBF6] border-b border-orange-200/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">관련 자료</h3>
                  <p className="text-sm text-gray-800">질문과 관련된 문서와 가이드라인</p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Placeholder content cards */}
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50 shadow-sm !rounded-xl" style={{ borderRadius: '12px' }}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-black mb-1">Meta 광고 정책 가이드</h4>
                      <p className="text-sm text-gray-700 mb-2">광고 승인을 위한 필수 정책과 가이드라인</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <span>최근 업데이트: 2024.01.15</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50 shadow-sm !rounded-xl" style={{ borderRadius: '12px' }}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-black mb-1">광고 승인 체크리스트</h4>
                      <p className="text-sm text-gray-700 mb-2">광고 승인을 위한 단계별 체크리스트</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <span>최근 업데이트: 2024.01.10</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50 shadow-sm !rounded-xl" style={{ borderRadius: '12px' }}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-black mb-1">타겟팅 가이드</h4>
                      <p className="text-sm text-gray-700 mb-2">효과적인 타겟팅 설정 방법</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <span>최근 업데이트: 2024.01.08</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty state when no content */}
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-lg font-medium text-black mb-2">질문을 시작해보세요</h4>
                <p className="text-sm text-gray-700 max-w-xs">
                  좌측에서 질문하시면 관련 자료가 여기에 표시됩니다
                </p>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="text-gray-300">채팅 페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
