'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Bot, Database, Clock, Wrench, MessageSquare } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
  responseTime: number;
}

export default function TestOllamaResponsePage() {
  const [testMessage, setTestMessage] = useState('안녕하세요, Ollama 서버가 정상적으로 작동하고 있나요?');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runTest = async (testType: string) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      let response;
      let endpoint;
      
      switch (testType) {
        case 'direct':
          endpoint = '/api/ollama';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: testMessage })
          });
          break;
          
        case 'chatbot':
          endpoint = '/api/chatbot';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: testMessage })
          });
          break;
          
        case 'health':
          endpoint = '/api/ollama';
          response = await fetch(endpoint, {
            method: 'GET'
          });
          break;
          
        case 'supabase':
          endpoint = '/api/debug-supabase';
          response = await fetch(endpoint, {
            method: 'GET'
          });
          break;
          
        case 'rag-search':
          endpoint = '/api/test-rag-search';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: testMessage })
          });
          break;
          
        case 'simple-search':
          endpoint = '/api/simple-search';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: testMessage })
          });
          break;
          
        case 'embedding-dimension':
          endpoint = '/api/check-embedding-dimension';
          response = await fetch(endpoint, {
            method: 'GET'
          });
          break;
          
        case 'data-integrity':
          endpoint = '/api/check-data-integrity';
          response = await fetch(endpoint, {
            method: 'GET'
          });
          break;
          
        case 'table-constraints':
          endpoint = '/api/check-table-constraints';
          response = await fetch(endpoint, {
            method: 'GET'
          });
          break;
          
        case 'fix-orphaned-chunks':
          endpoint = '/api/fix-orphaned-chunks';
          response = await fetch(endpoint, {
            method: 'POST'
          });
          break;
          
        case 'force-regenerate-embeddings':
          endpoint = '/api/force-regenerate-embeddings';
          response = await fetch(endpoint, {
            method: 'POST'
          });
          break;
          
        case 'fix-embedding-dimension':
          endpoint = '/api/fix-embedding-dimension';
          response = await fetch(endpoint, {
            method: 'POST'
          });
          break;
          
        case 'debug-database-state':
          endpoint = '/api/debug-database-state';
          response = await fetch(endpoint, { method: 'GET' });
          break;
          
        case 'test-rpc-direct':
          endpoint = '/api/test-rpc-direct';
          response = await fetch(endpoint, { method: 'GET' });
          break;
          
        default:
          throw new Error('알 수 없는 테스트 타입');
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      const result: TestResult = {
        success: response.ok,
        message: testType === 'health' 
          ? `Ollama 서버 상태: ${data.server?.healthy ? '정상' : '오류'}`
          : testType === 'direct'
          ? `직접 Ollama 응답: ${data.response?.message?.substring(0, 100)}...`
          : testType === 'supabase'
          ? `Supabase 연동: ${data.success ? '정상' : '오류'} - 문서 ${data.tables?.documents?.count || 0}개, 청크 ${data.tables?.chunks?.count || 0}개`
          : testType === 'rag-search'
          ? `RAG 검색: ${data.searchResults?.count || 0}개 결과 - ${data.ragResponse?.answer?.substring(0, 100)}...`
          : testType === 'embedding-dimension'
          ? `임베딩 차원: ${data.analysis?.uniqueDimensions?.join(', ') || '없음'} - 총 ${data.analysis?.totalChunks || 0}개 청크`
          : testType === 'data-integrity'
          ? `데이터 무결성: 문서 ${data.analysis?.documents?.total || 0}개, 청크 ${data.analysis?.chunks?.total || 0}개, 고아 청크 ${data.analysis?.integrity?.orphanedChunks || 0}개`
          : testType === 'table-constraints'
          ? `테이블 제약조건: 외래키 ${data.analysis?.foreignKeys?.length || 0}개, 제약조건 ${data.analysis?.constraints?.length || 0}개`
          : testType === 'fix-orphaned-chunks'
          ? `고아 청크 수정: ${data.processed || 0}개 처리, ${data.errors || 0}개 오류`
          : testType === 'force-regenerate-embeddings'
          ? `강제 임베딩 재생성: ${data.processed || 0}개 처리, ${data.errors || 0}개 오류`
          : testType === 'fix-embedding-dimension'
          ? `임베딩 차원 해결: 변환됨 ${data.results?.converted || 0}개, 성공 ${data.results?.success || 0}개, 오류 ${data.results?.errors || 0}개, 이미 정상 ${data.results?.already_correct || 0}개`
          : testType === 'debug-database-state'
          ? `데이터베이스 상태: 총 ${data.stats?.total_chunks || 0}개 청크, 임베딩 있음 ${data.stats?.chunks_with_embedding || 0}개, 임베딩 없음 ${data.stats?.chunks_without_embedding || 0}개`
          : testType === 'test-rpc-direct'
          ? `RPC 직접 테스트: RPC ${data.analysis?.rpc_results || 0}개, 직접 쿼리 ${data.analysis?.direct_results || 0}개`
          : `RAG + Ollama 응답: ${data.response?.message?.substring(0, 100)}...`,
        details: data,
        timestamp: new Date().toISOString(),
        responseTime
      };
      
      setTestResults(prev => [result, ...prev]);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        success: false,
        message: `테스트 실패: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error) },
        timestamp: new Date().toISOString(),
        responseTime
      };
      
      setTestResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vultr+Ollama 전용 시스템 테스트</h1>
        <p className="text-muted-foreground">
          Vercel+Gemini와 별도로 구축된 Vultr+Ollama 전용 시스템을 테스트합니다.
        </p>
      </div>

      <div className="grid gap-6">
        {/* 테스트 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              테스트 메시지 설정
            </CardTitle>
            <CardDescription>
              Ollama 서버에 전송할 테스트 메시지를 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="테스트 메시지를 입력하세요..."
              className="w-full"
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => runTest('health')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Ollama 서버 상태
              </Button>
              <Button 
                onClick={() => runTest('direct')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                직접 Ollama 테스트
              </Button>
              <Button 
                onClick={() => runTest('chatbot')} 
                disabled={isLoading}
                variant="default"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                RAG + Ollama 테스트
              </Button>
              <Button 
                onClick={() => window.open('/chat-ollama', '_blank')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Ollama Chat 페이지
              </Button>
              <Button 
                onClick={() => runTest('supabase')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Supabase 연동 확인
              </Button>
              <Button 
                onClick={() => runTest('rag-search')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                RAG 검색 테스트
              </Button>
              <Button 
                onClick={() => runTest('simple-search')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                간단한 검색 테스트
              </Button>
              <Button 
                onClick={() => runTest('embedding-dimension')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                임베딩 차원 확인
              </Button>
              <Button 
                onClick={() => runTest('data-integrity')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                데이터 무결성 확인
              </Button>
              <Button 
                onClick={() => runTest('table-constraints')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                테이블 제약조건 확인
              </Button>
              <Button 
                onClick={() => runTest('fix-orphaned-chunks')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                고아 청크 수정
              </Button>
              <Button 
                onClick={() => runTest('force-regenerate-embeddings')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                강제 임베딩 재생성
              </Button>
              <Button 
                onClick={() => runTest('fix-embedding-dimension')} 
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                임베딩 차원 불일치 해결
              </Button>
              <Button 
                onClick={() => runTest('debug-database-state')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                데이터베이스 상태 디버그
              </Button>
              <Button 
                onClick={() => runTest('test-rpc-direct')} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                RPC 직접 테스트
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 결과 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                테스트 결과
              </CardTitle>
              <Button onClick={clearResults} variant="outline" size="sm">
                결과 지우기
              </Button>
            </div>
            <CardDescription>
              각 테스트의 결과와 응답 시간을 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                테스트를 실행하면 결과가 여기에 표시됩니다.
              </p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "성공" : "실패"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.responseTime}ms
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{result.message}</p>
                    
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          상세 정보 보기
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 웹 통합 서비스 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>웹 통합 서비스 상태</CardTitle>
            <CardDescription>
              현재 설정된 서비스들의 상태를 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Bot className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Ollama 서버</h3>
                <p className="text-sm text-muted-foreground">주 LLM 모델</p>
                <Badge variant="outline" className="mt-2">Vultr 호스팅</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">RAG 시스템</h3>
                <p className="text-sm text-muted-foreground">문서 검색 + 생성</p>
                <Badge variant="outline" className="mt-2">Supabase</Badge>
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
