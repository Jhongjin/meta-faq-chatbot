'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function TestRailwayPage() {
  const [question, setQuestion] = useState('광고 정책에 대해 알려주세요');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [railwayStatus, setRailwayStatus] = useState<any>(null);

  const testRailwayConnection = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/chat-railway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: response.ok ? 'Railway Ollama 연결 성공!' : 'Railway Ollama 연결 실패',
        details: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Railway Ollama 연결 오류',
        details: error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRailwayStatus = async () => {
    try {
      const response = await fetch('/api/railway-status');
      const data = await response.json();
      setRailwayStatus(data);
    } catch (error) {
      console.error('Railway 상태 확인 실패:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🚂 Railway Ollama 테스트
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Railway에서 실행 중인 Ollama 서비스 연결 테스트
          </p>
        </div>

        {/* Railway 상태 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Railway 서비스 상태
            </CardTitle>
            <CardDescription>
              Railway Ollama 서비스의 현재 상태를 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkRailwayStatus} className="mb-4">
              상태 확인
            </Button>
            {railwayStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={railwayStatus.healthy ? 'default' : 'destructive'}>
                    {railwayStatus.healthy ? '정상' : '오류'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {railwayStatus.healthy ? 'Railway 서비스가 정상 작동 중입니다' : 'Railway 서비스에 문제가 있습니다'}
                  </span>
                </div>
                {railwayStatus.url && (
                  <p className="text-sm text-gray-500">
                    URL: {railwayStatus.url}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 질문 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Ollama 답변 생성 테스트
            </CardTitle>
            <CardDescription>
              Railway Ollama를 통해 실제 답변을 생성해봅니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                질문 입력
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={testRailwayConnection} 
              disabled={isLoading || !question.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Railway Ollama 테스트 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Railway Ollama 테스트
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 표시 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                테스트 결과
              </CardTitle>
              <CardDescription>
                {result.timestamp}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="font-medium mb-2">{result.message}</p>
                {result.details && (
                  <div className="space-y-2">
                    {result.details.response && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">응답:</p>
                        <p className="text-sm">{result.details.response.message || result.details.response.content}</p>
                      </div>
                    )}
                    {result.details.model && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">모델:</p>
                        <Badge variant="outline">{result.details.model}</Badge>
                      </div>
                    )}
                    {result.details.processingTime && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">처리 시간:</p>
                        <p className="text-sm">{result.details.processingTime}ms</p>
                      </div>
                    )}
                    {result.details.confidence && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">신뢰도:</p>
                        <p className="text-sm">{(result.details.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용법 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>사용법 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Railway 상태 확인</strong>: Railway 서비스가 정상 작동하는지 확인합니다</p>
            <p>2. <strong>질문 입력</strong>: 테스트할 질문을 입력합니다</p>
            <p>3. <strong>테스트 실행</strong>: Railway Ollama를 통해 답변을 생성합니다</p>
            <p>4. <strong>결과 확인</strong>: 생성된 답변과 성능 지표를 확인합니다</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
