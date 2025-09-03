"use client";

import { useState, useRef, useEffect } from "react";
import ChatLayout from "@/components/layouts/ChatLayout";
import ChatBubble from "@/components/chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Star, ThumbsUp, ThumbsDown } from "lucide-react";

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

export default function ChatPage() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: "방금 전",
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateAIResponse(inputValue.trim()),
        timestamp: "방금 전",
        sources: generateDummySources(),
        feedback: { helpful: null, count: 0 },
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const generateAIResponse = (question: string): string => {
    const responses = [
      "네, 말씀하신 내용에 대해 답변드리겠습니다. 메타 광고 정책에 따르면...",
      "좋은 질문입니다! 인스타그램 광고 설정 시 주의해야 할 점은...",
      "페이스북 광고 계정 생성과 관련하여 다음과 같은 절차가 필요합니다...",
      "광고 정책 변경사항에 대해 최신 정보를 제공해드리겠습니다...",
      "스토리 광고의 최적 크기와 형식에 대해 설명드리겠습니다...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateDummySources = () => [
    {
      id: "1",
      title: "2024년 메타 광고 정책 가이드라인",
      url: "https://example.com/policy-2024",
      updatedAt: "2024-01-15",
      excerpt: "2024년에 적용되는 새로운 메타 광고 정책과 가이드라인을 포함한 공식 문서입니다.",
    },
    {
      id: "2",
      title: "인스타그램 광고 설정 매뉴얼",
      url: "https://example.com/instagram-ads",
      updatedAt: "2024-01-10",
      excerpt: "인스타그램 광고 계정 설정부터 캠페인 운영까지 상세한 가이드를 제공합니다.",
    },
  ];

  return (
    <ChatLayout>
      <div className="flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">메타 광고 FAQ AI 챗봇</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">광고 정책과 가이드라인에 대해 질문해주세요</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
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
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl px-4 py-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메타 광고에 대해 궁금한 점을 질문해주세요..."
                  className="pr-12 resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Enter 키로 전송, Shift + Enter로 줄바꿈</p>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
