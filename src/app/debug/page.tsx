'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import EmbeddingModelSelector from '@/components/debug/EmbeddingModelSelector';

interface DebugResult {
  success: boolean;
  debug?: {
    environment: any;
    services: any;
    database: any;
    errors: string[];
    overallStatus: any;
  };
  error?: string;
}

interface SimpleTestResult {
  success: boolean;
  response?: {
    message: string;
    debug: any;
  };
  error?: string;
}

export default function DebugPage() {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [simpleTestResult, setSimpleTestResult] = useState<SimpleTestResult | null>(null);
  const [embeddingTestResult, setEmbeddingTestResult] = useState<any>(null);
  const [ragTestResult, setRagTestResult] = useState<any>(null);
  const [dbTestResult, setDbTestResult] = useState<any>(null);
  const [vectorTestResult, setVectorTestResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [ragDetailedResult, setRagDetailedResult] = useState<any>(null);
  const [testDataResult, setTestDataResult] = useState<any>(null);
  const [embeddingDimensionsResult, setEmbeddingDimensionsResult] = useState<any>(null);
  const [embeddingFormatResult, setEmbeddingFormatResult] = useState<any>(null);
  const [databaseSchemaResult, setDatabaseSchemaResult] = useState<any>(null);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<any>(null);
  const [vectorDirectTestResult, setVectorDirectTestResult] = useState<any>(null);
  const [searchFunctionResult, setSearchFunctionResult] = useState<any>(null);
  const [quickTestResult, setQuickTestResult] = useState<any>(null);
  const [simpleRagResult, setSimpleRagResult] = useState<any>(null);
  const [ultraSimpleResult, setUltraSimpleResult] = useState<any>(null);
  const [similarityDebugResult, setSimilarityDebugResult] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('메타 광고 정책에 대해 설명해주세요');
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    setDebugResult(null);
    
    try {
      const response = await fetch('/api/debug-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      setDebugResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSimpleTest = async () => {
    setIsLoading(true);
    setSimpleTestResult(null);
    
    try {
      const response = await fetch('/api/test-simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: testMessage }),
      });

      const result = await response.json();
      setSimpleTestResult(result);
    } catch (error) {
      setSimpleTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runEmbeddingTest = async () => {
    setIsLoading(true);
    setEmbeddingTestResult(null);
    
    try {
      const response = await fetch('/api/test-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setEmbeddingTestResult(result);
    } catch (error) {
      setEmbeddingTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runRagTest = async () => {
    setIsLoading(true);
    setRagTestResult(null);
    
    try {
      const response = await fetch('/api/test-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setRagTestResult(result);
    } catch (error) {
      setRagTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDbTest = async () => {
    setIsLoading(true);
    setDbTestResult(null);
    
    try {
      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setDbTestResult(result);
    } catch (error) {
      setDbTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runVectorTest = async () => {
    setIsLoading(true);
    setVectorTestResult(null);
    
    try {
      const response = await fetch('/api/test-vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setVectorTestResult(result);
    } catch (error) {
      setVectorTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runMigrationCheck = async () => {
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const response = await fetch('/api/check-migration');
      const result = await response.json();
      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runRagDetailedTest = async () => {
    setIsLoading(true);
    setRagDetailedResult(null);
    
    try {
      const response = await fetch('/api/test-rag-detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testMessage
        }),
      });

      const result = await response.json();
      setRagDetailedResult(result);
    } catch (error) {
      setRagDetailedResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTestData = async () => {
    setIsLoading(true);
    setTestDataResult(null);
    
    try {
      const response = await fetch('/api/add-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setTestDataResult(result);
    } catch (error) {
      setTestDataResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmbeddingDimensions = async () => {
    setIsLoading(true);
    setEmbeddingDimensionsResult(null);
    
    try {
      const response = await fetch('/api/check-embedding-dimensions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setEmbeddingDimensionsResult(result);
    } catch (error) {
      setEmbeddingDimensionsResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmbeddingFormat = async () => {
    setIsLoading(true);
    setEmbeddingFormatResult(null);
    
    try {
      const response = await fetch('/api/check-embedding-format', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setEmbeddingFormatResult(result);
    } catch (error) {
      setEmbeddingFormatResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseSchema = async () => {
    setIsLoading(true);
    setDatabaseSchemaResult(null);
    
    try {
      const response = await fetch('/api/check-database-schema', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setDatabaseSchemaResult(result);
    } catch (error) {
      setDatabaseSchemaResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDeepAnalysis = async () => {
    setIsLoading(true);
    setDeepAnalysisResult(null);
    
    try {
      const response = await fetch('/api/deep-database-analysis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setDeepAnalysisResult(result);
    } catch (error) {
      setDeepAnalysisResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runVectorDirectTest = async () => {
    setIsLoading(true);
    setVectorDirectTestResult(null);
    
    try {
      const response = await fetch('/api/test-vector-direct', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setVectorDirectTestResult(result);
    } catch (error) {
      setVectorDirectTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSearchFunction = async () => {
    setIsLoading(true);
    setSearchFunctionResult(null);
    
    try {
      const response = await fetch('/api/check-search-function', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setSearchFunctionResult(result);
    } catch (error) {
      setSearchFunctionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async () => {
    setIsLoading(true);
    setQuickTestResult(null);
    
    try {
      const response = await fetch('/api/quick-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testMessage })
      });
      const result = await response.json();
      setQuickTestResult(result);
    } catch (error) {
      setQuickTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSimpleRagTest = async () => {
    setIsLoading(true);
    setSimpleRagResult(null);
    
    try {
      const response = await fetch('/api/simple-rag-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testMessage })
      });
      const result = await response.json();
      setSimpleRagResult(result);
    } catch (error) {
      setSimpleRagResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runUltraSimpleTest = async () => {
    setIsLoading(true);
    setUltraSimpleResult(null);
    
    try {
      const response = await fetch('/api/ultra-simple-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      setUltraSimpleResult(result);
    } catch (error) {
      setUltraSimpleResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSimilarityDebug = async () => {
    setIsLoading(true);
    setSimilarityDebugResult(null);
    
    try {
      const response = await fetch('/api/debug-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      setSimilarityDebugResult(result);
    } catch (error) {
      setSimilarityDebugResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (status === true || status === 'connected' || status === 'working') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === false || status === 'error' || status === 'not_available') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: boolean | string) => {
    if (status === true || status === 'connected' || status === 'working') {
      return <Badge variant="default" className="bg-green-500">정상</Badge>;
    } else if (status === false || status === 'error' || status === 'not_available') {
      return <Badge variant="destructive">오류</Badge>;
    } else {
      return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 챗봇 디버깅 도구</h1>
        <p className="text-muted-foreground">
          챗봇 시스템의 상태를 진단하고 문제점을 파악합니다.
        </p>
      </div>

      <div className="grid gap-6">
        {/* 전체 시스템 진단 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              전체 시스템 진단
            </CardTitle>
            <CardDescription>
              모든 서비스의 상태를 종합적으로 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDebugTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  진단 중...
                </>
              ) : (
                '시스템 진단 시작'
              )}
            </Button>

            {debugResult && (
              <div className="mt-6 space-y-4">
                <Alert className={debugResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {debugResult.success ? '진단이 완료되었습니다.' : `오류: ${debugResult.error}`}
                  </AlertDescription>
                </Alert>

                {debugResult.debug && (
                  <div className="space-y-4">
                    {/* 환경 변수 상태 */}
                    <div>
                      <h4 className="font-semibold mb-2">환경 변수 상태</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Supabase URL:</span>
                          {getStatusIcon(debugResult.debug.environment.hasSupabaseUrl)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Supabase Key:</span>
                          {getStatusIcon(debugResult.debug.environment.hasSupabaseKey)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Google API Key:</span>
                          {getStatusIcon(debugResult.debug.environment.hasGoogleApiKey)}
                        </div>
                      </div>
                    </div>

                    {/* 데이터베이스 상태 */}
                    <div>
                      <h4 className="font-semibold mb-2">데이터베이스 상태</h4>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugResult.debug.database.connected)}
                        <span>연결 상태: {getStatusBadge(debugResult.debug.database.connected)}</span>
                        <span className="text-sm text-muted-foreground">
                          (문서 수: {debugResult.debug.database.documentsCount})
                        </span>
                      </div>
                      {debugResult.debug.database.error && (
                        <p className="text-sm text-red-600 mt-1">
                          오류: {debugResult.debug.database.error}
                        </p>
                      )}
                    </div>

                    {/* 서비스 상태 */}
                    <div>
                      <h4 className="font-semibold mb-2">서비스 상태</h4>
                      <div className="space-y-2">
                        {debugResult.debug.services.gemini && (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(debugResult.debug.services.gemini.available)}
                            <span>Gemini: {getStatusBadge(debugResult.debug.services.gemini.available)}</span>
                            {debugResult.debug.services.gemini.error && (
                              <span className="text-sm text-red-600">
                                ({debugResult.debug.services.gemini.error})
                              </span>
                            )}
                          </div>
                        )}
                        {debugResult.debug.services.embedding && (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(debugResult.debug.services.embedding.available)}
                            <span>임베딩: {getStatusBadge(debugResult.debug.services.embedding.available)}</span>
                            {debugResult.debug.services.embedding.isDummy && (
                              <Badge variant="outline" className="text-yellow-600">더미 모드</Badge>
                            )}
                          </div>
                        )}
                        {debugResult.debug.services.rag && (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(debugResult.debug.services.rag.available)}
                            <span>RAG: {getStatusBadge(debugResult.debug.services.rag.available)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 오류 목록 */}
                    {debugResult.debug.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">발견된 오류</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                          {debugResult.debug.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 간단한 챗봇 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              간단한 챗봇 테스트
            </CardTitle>
            <CardDescription>
              기본적인 챗봇 기능을 테스트합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">테스트 메시지</label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="테스트할 메시지를 입력하세요..."
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={runSimpleTest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  '챗봇 테스트 실행'
                )}
              </Button>

              {simpleTestResult && (
                <div className="mt-4 space-y-4">
                  <Alert className={simpleTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {simpleTestResult.success ? '테스트가 완료되었습니다.' : `오류: ${simpleTestResult.error}`}
                    </AlertDescription>
                  </Alert>

                  {simpleTestResult.response && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">챗봇 응답</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm">{simpleTestResult.response.message}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">디버그 정보</h4>
                        <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto">
                          {JSON.stringify(simpleTestResult.response.debug, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 임베딩 서비스 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              임베딩 서비스 테스트
            </CardTitle>
            <CardDescription>
              임베딩 서비스가 더미 모드로 작동하는 원인을 진단합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runEmbeddingTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  임베딩 테스트 중...
                </>
              ) : (
                '임베딩 서비스 테스트'
              )}
            </Button>

            {embeddingTestResult && (
              <div className="mt-4 space-y-4">
                <Alert className={embeddingTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {embeddingTestResult.success ? '임베딩 테스트가 완료되었습니다.' : `오류: ${embeddingTestResult.error}`}
                  </AlertDescription>
                </Alert>

                {embeddingTestResult.success && embeddingTestResult.result && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">임베딩 결과</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>모델:</span>
                          <Badge variant={embeddingTestResult.result.isDummy ? "destructive" : "default"}>
                            {embeddingTestResult.result.model}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>차원:</span>
                          <span>{embeddingTestResult.result.dimension}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>처리 시간:</span>
                          <span>{embeddingTestResult.result.processingTime}ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>더미 모드:</span>
                          <Badge variant={embeddingTestResult.result.isDummy ? "destructive" : "default"}>
                            {embeddingTestResult.result.isDummy ? "예" : "아니오"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">임베딩 값 분석</h4>
                      <div className="text-sm space-y-1">
                        <p>첫 5개 값: [{embeddingTestResult.result.firstFewValues.map((v: number) => v.toFixed(4)).join(', ')}]</p>
                        <p>모든 값이 0인가: {embeddingTestResult.result.isAllZeros ? "예" : "아니오"}</p>
                        <p>랜덤 값 포함: {embeddingTestResult.result.isRandom ? "예" : "아니오"}</p>
                      </div>
                    </div>

                    {embeddingTestResult.result.isDummy && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          임베딩 서비스가 더미 모드로 작동하고 있습니다. 이는 임베딩 모델 로딩에 실패했음을 의미합니다.
                          RAG 검색의 정확성이 크게 떨어질 수 있습니다.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {!embeddingTestResult.success && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">오류 상세</h4>
                    <pre className="text-xs bg-red-50 p-3 rounded-md overflow-auto">
                      {embeddingTestResult.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RAG 서비스 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              RAG 서비스 테스트
            </CardTitle>
            <CardDescription>
              RAG 검색이 실패하는 원인을 진단합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runRagTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  RAG 테스트 중...
                </>
              ) : (
                'RAG 서비스 테스트'
              )}
            </Button>

            {ragTestResult && (
              <div className="mt-4 space-y-4">
                <Alert className={ragTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {ragTestResult.success ? 'RAG 테스트가 완료되었습니다.' : `오류: ${ragTestResult.error}`}
                  </AlertDescription>
                </Alert>

                {ragTestResult.success && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">RAG 응답 결과</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>답변 길이:</span>
                          <span>{ragTestResult.response.answerLength}자</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>소스 수:</span>
                          <span>{ragTestResult.response.sourcesCount}개</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>신뢰도:</span>
                          <span>{ragTestResult.response.confidence?.toFixed(3) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>모델:</span>
                          <span>{ragTestResult.response.model}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">생성된 답변</h4>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">{ragTestResult.response.answer}</p>
                      </div>
                    </div>

                    {ragTestResult.sources && ragTestResult.sources.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">검색된 소스</h4>
                        <div className="space-y-2">
                          {ragTestResult.sources.map((source: any, index: number) => (
                            <div key={index} className="p-2 bg-blue-50 rounded-md">
                              <p className="font-medium text-sm">{source.title}</p>
                              <p className="text-xs text-gray-600">{source.content}</p>
                              <p className="text-xs text-blue-600">유사도: {source.similarity?.toFixed(3) || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ragTestResult.response.sourcesCount === 0 && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          검색된 소스가 없습니다. 데이터베이스에 문서가 없거나 임베딩이 생성되지 않았을 수 있습니다.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 데이터베이스 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              데이터베이스 테스트
            </CardTitle>
            <CardDescription>
              데이터베이스 연결과 문서 데이터를 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDbTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  DB 테스트 중...
                </>
              ) : (
                '데이터베이스 테스트'
              )}
            </Button>

            {dbTestResult && (
              <div className="mt-4 space-y-4">
                <Alert className={dbTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {dbTestResult.success ? '데이터베이스 테스트가 완료되었습니다.' : `오류: ${dbTestResult.error}`}
                  </AlertDescription>
                </Alert>

                {dbTestResult.success && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">데이터베이스 상태</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>문서 수:</span>
                          <span>{dbTestResult.database.documentsCount}개</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>청크 수:</span>
                          <span>{dbTestResult.database.chunksCount}개</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>임베딩 차원:</span>
                          <span>{dbTestResult.database.embedding.dimension}차원</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>임베딩 모델:</span>
                          <span>{dbTestResult.database.embedding.model}</span>
                        </div>
                      </div>
                    </div>

                    {dbTestResult.documents && dbTestResult.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">문서 목록</h4>
                        <div className="space-y-1">
                          {dbTestResult.documents.map((doc: any, index: number) => (
                            <div key={index} className="text-sm">
                              {index + 1}. {doc.title} ({doc.status})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dbTestResult.chunks && dbTestResult.chunks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">청크 목록</h4>
                        <div className="space-y-1">
                          {dbTestResult.chunks.map((chunk: any, index: number) => (
                            <div key={index} className="text-sm">
                              {index + 1}. {chunk.content} (임베딩: {chunk.hasEmbedding ? '있음' : '없음'})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dbTestResult.database.documentsCount === 0 && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          데이터베이스에 문서가 없습니다. 문서를 업로드하거나 테스트 데이터를 추가해야 합니다.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 마이그레이션 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              마이그레이션 확인
            </CardTitle>
            <CardDescription>
              Supabase 마이그레이션 상태와 테이블 구조를 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runMigrationCheck} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  마이그레이션 확인 중...
                </>
              ) : (
                '마이그레이션 확인'
              )}
            </Button>
            {migrationResult && (
              <div className="mt-4 space-y-4">
                <Alert className={migrationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {migrationResult.success ? '마이그레이션 확인이 완료되었습니다.' : `오류: ${migrationResult.error}`}
                  </AlertDescription>
                </Alert>
                {migrationResult.success && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">테이블 상태</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>존재하는 테이블:</span><span>{migrationResult.tables.join(', ')}</span>
                        <span>문서 수:</span><span>{migrationResult.dataCounts.documents}개</span>
                        <span>청크 수:</span><span>{migrationResult.dataCounts.chunks}개</span>
                        <span>search_documents 함수:</span><span>{migrationResult.functions.includes('search_documents') ? '존재' : '없음'}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">document_chunks 테이블 구조</h4>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="space-y-1 text-sm">
                          {migrationResult.columns.map((col: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className="font-mono">{col.name}</span>
                              <span className="text-gray-600">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {migrationResult.errors.documents && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          문서 테이블 오류: {migrationResult.errors.documents}
                        </AlertDescription>
                      </Alert>
                    )}
                    {migrationResult.errors.chunks && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          청크 테이블 오류: {migrationResult.errors.chunks}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* search_documents 함수 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              search_documents 함수 확인
            </CardTitle>
            <CardDescription>
              Supabase의 search_documents 함수가 정상 작동하는지 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkSearchFunction} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    함수 확인 중...
                  </>
                ) : (
                  'search_documents 함수 확인'
                )}
              </Button>
              
              {searchFunctionResult && (
                <div className="space-y-2">
                  {searchFunctionResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">함수 확인 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• 함수 존재: {searchFunctionResult.functionExists ? '예' : '아니오'}</p>
                        <p>• 테스트 성공: {searchFunctionResult.testResult?.success ? '예' : '아니오'}</p>
                        {searchFunctionResult.testResult?.result && (
                          <p>• 검색 결과: {searchFunctionResult.testResult.result.length}개</p>
                        )}
                      </div>
                      {searchFunctionResult.testResult?.error && (
                        <div className="mt-3">
                          <h5 className="font-semibold mb-1">오류 메시지:</h5>
                          <div className="text-xs bg-red-50 p-2 rounded border">
                            <code>{searchFunctionResult.testResult.error}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {searchFunctionResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 직접 벡터 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              직접 벡터 테스트
            </CardTitle>
            <CardDescription>
              information_schema 없이 직접 벡터 데이터를 분석합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runVectorDirectTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    직접 벡터 테스트 중...
                  </>
                ) : (
                  '직접 벡터 테스트 실행'
                )}
              </Button>
              
              {vectorDirectTestResult && (
                <div className="space-y-2">
                  {vectorDirectTestResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">직접 벡터 테스트 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• 총 청크 수: {vectorDirectTestResult.analysis.summary.totalChunks}개</p>
                        <p>• 임베딩 타입: {vectorDirectTestResult.analysis.summary.embeddingTypes.join(', ')}</p>
                        <p>• 차원: {vectorDirectTestResult.analysis.summary.dimensions.join(', ')}</p>
                        <p>• 파싱 오류: {vectorDirectTestResult.analysis.summary.parseErrors}개</p>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">벡터 검색 테스트:</h5>
                        <div className="text-xs bg-white p-2 rounded border">
                          <p><strong>상태:</strong> {vectorDirectTestResult.analysis.searchTest.success ? '성공' : '실패'}</p>
                          {!vectorDirectTestResult.analysis.searchTest.success && (
                            <p className="text-red-500"><strong>오류:</strong> {vectorDirectTestResult.analysis.searchTest.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">청크별 분석:</h5>
                        {vectorDirectTestResult.analysis.chunks?.map((chunk: any, index: number) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border mb-2">
                            <p><strong>청크 ID:</strong> {chunk.chunkId}</p>
                            <p><strong>타입:</strong> {chunk.rawType}</p>
                            <p><strong>차원:</strong> {chunk.length || 'N/A'}</p>
                            <p><strong>벡터 테스트:</strong> {chunk.vectorTest?.success ? '성공' : '실패'}</p>
                            {chunk.vectorTest?.error && (
                              <p className="text-red-500"><strong>오류:</strong> {chunk.vectorTest.error}</p>
                            )}
                            {chunk.sample && (
                              <p><strong>샘플:</strong> {JSON.stringify(chunk.sample)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {vectorDirectTestResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 심층 데이터베이스 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              심층 데이터베이스 분석
            </CardTitle>
            <CardDescription>
              벡터 차원 불일치 문제의 근본 원인을 심층 분석합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runDeepAnalysis} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    심층 분석 중...
                  </>
                ) : (
                  '심층 데이터베이스 분석 실행'
                )}
              </Button>
              
              {deepAnalysisResult && (
                <div className="space-y-2">
                  {deepAnalysisResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">심층 분석 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• 총 청크 수: {deepAnalysisResult.analysis.summary.totalChunks}개</p>
                        <p>• 임베딩 타입: {deepAnalysisResult.analysis.summary.embeddingTypes.join(', ')}</p>
                        <p>• 차원: {deepAnalysisResult.analysis.summary.dimensions.join(', ')}</p>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">벡터 검색 테스트:</h5>
                        <div className="text-xs bg-white p-2 rounded border">
                          <p><strong>상태:</strong> {deepAnalysisResult.analysis.searchTest.success ? '성공' : '실패'}</p>
                          {!deepAnalysisResult.analysis.searchTest.success && (
                            <p className="text-red-500"><strong>오류:</strong> {deepAnalysisResult.analysis.searchTest.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">임베딩 데이터 상세:</h5>
                        {deepAnalysisResult.analysis.embeddingData?.map((item: any, index: number) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border mb-2">
                            <p><strong>청크 ID:</strong> {item.chunkId}</p>
                            <p><strong>타입:</strong> {item.type}</p>
                            <p><strong>원시 타입:</strong> {item.rawType}</p>
                            <p><strong>차원:</strong> {item.length || 'N/A'}</p>
                            <p><strong>샘플:</strong> {JSON.stringify(item.sample)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {deepAnalysisResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 데이터베이스 스키마 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              데이터베이스 스키마 확인
            </CardTitle>
            <CardDescription>
              document_chunks 테이블의 스키마와 search_documents 함수 상태를 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkDatabaseSchema} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    스키마 확인 중...
                  </>
                ) : (
                  '데이터베이스 스키마 확인'
                )}
              </Button>
              
              {databaseSchemaResult && (
                <div className="space-y-2">
                  {databaseSchemaResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">데이터베이스 스키마 분석 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• search_documents 함수 존재: {databaseSchemaResult.functionExists ? '예' : '아니오'}</p>
                        <p>• 샘플 데이터 타입: {databaseSchemaResult.sampleData?.embeddingType || 'N/A'}</p>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">테이블 스키마:</h5>
                        {databaseSchemaResult.tableSchema?.map((col: any, index: number) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <p><strong>컬럼:</strong> {col.column_name}</p>
                            <p><strong>타입:</strong> {col.data_type}</p>
                            <p><strong>UDT:</strong> {col.udt_name}</p>
                          </div>
                        ))}
                      </div>
                      {databaseSchemaResult.sampleData && (
                        <div className="mt-3">
                          <h5 className="font-semibold mb-1">샘플 데이터:</h5>
                          <div className="text-xs bg-white p-2 rounded border">
                            <p><strong>청크 ID:</strong> {databaseSchemaResult.sampleData.chunkId}</p>
                            <p><strong>임베딩 타입:</strong> {databaseSchemaResult.sampleData.embeddingType}</p>
                            <p><strong>샘플:</strong> {databaseSchemaResult.sampleData.embeddingSample}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {databaseSchemaResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 임베딩 형식 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              임베딩 형식 확인
            </CardTitle>
            <CardDescription>
              데이터베이스에 저장된 임베딩의 형식을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkEmbeddingFormat} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    임베딩 형식 확인 중...
                  </>
                ) : (
                  '임베딩 형식 확인'
                )}
              </Button>
              
              {embeddingFormatResult && (
                <div className="space-y-2">
                  {embeddingFormatResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">임베딩 형식 분석 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• 청크 ID: {embeddingFormatResult.chunkId}</p>
                        <p>• 형식: {embeddingFormatResult.format}</p>
                        <p>• 차원: {embeddingFormatResult.dimension}</p>
                        <p>• 타입: {embeddingFormatResult.type}</p>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">샘플 데이터 (처음 10개):</h5>
                        <div className="text-xs bg-white p-2 rounded border">
                          <code>{JSON.stringify(embeddingFormatResult.sample)}</code>
                        </div>
                        <h5 className="font-semibold mb-1 mt-2">원본 데이터 (처음 100자):</h5>
                        <div className="text-xs bg-white p-2 rounded border">
                          <code>{embeddingFormatResult.rawSample}</code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {embeddingFormatResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 임베딩 차원 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              임베딩 차원 확인
            </CardTitle>
            <CardDescription>
              데이터베이스에 저장된 임베딩의 차원을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkEmbeddingDimensions} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    임베딩 차원 확인 중...
                  </>
                ) : (
                  '임베딩 차원 확인'
                )}
              </Button>
              
              {embeddingDimensionsResult && (
                <div className="space-y-2">
                  {embeddingDimensionsResult.success ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">임베딩 차원 분석 결과:</h4>
                      <div className="text-sm space-y-1">
                        <p>• 총 청크 수: {embeddingDimensionsResult.totalChunks}개</p>
                        <p>• 고유 차원: {embeddingDimensionsResult.summary.uniqueDimensions.join(', ')}</p>
                        <p>• 평균 차원: {embeddingDimensionsResult.summary.averageDimension.toFixed(1)}</p>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1">상세 정보:</h5>
                        {embeddingDimensionsResult.dimensions.map((dim: any, index: number) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <p><strong>청크 ID:</strong> {dim.chunkId}</p>
                            <p><strong>차원:</strong> {dim.dimension}</p>
                            <p><strong>타입:</strong> {dim.type}</p>
                            {dim.error && <p className="text-red-500"><strong>오류:</strong> {dim.error}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription>
                        오류: {embeddingDimensionsResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 테스트 데이터 추가 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              테스트 데이터 추가
            </CardTitle>
            <CardDescription>
              메타 광고 정책 관련 테스트 문서를 데이터베이스에 추가합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">추가될 테스트 데이터:</h4>
                <ul className="text-sm space-y-1">
                  <li>• 메타 광고 정책 2024</li>
                  <li>• 인스타그램 광고 사양</li>
                  <li>• 페이스북 광고 정책</li>
                </ul>
              </div>
              
              <Button onClick={addTestData} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    테스트 데이터 추가 중...
                  </>
                ) : (
                  '테스트 데이터 추가'
                )}
              </Button>
              
              {testDataResult && (
                <Alert className={testDataResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {testDataResult.success ? 
                      `테스트 데이터가 성공적으로 추가되었습니다. (${testDataResult.chunks}개 청크)` : 
                      `오류: ${testDataResult.error}`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 초간단 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              초간단 테스트 (1초 이내)
            </CardTitle>
            <CardDescription>
              서버 연결과 기본 API 동작을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runUltraSimpleTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    초간단 테스트 중...
                  </>
                ) : (
                  '초간단 테스트 실행'
                )}
              </Button>
              
              {ultraSimpleResult && (
                <div className="space-y-4">
                  <Alert className={ultraSimpleResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {ultraSimpleResult.success ? '초간단 테스트가 완료되었습니다.' : `오류: ${ultraSimpleResult.error}`}
                    </AlertDescription>
                  </Alert>
                  
                  {ultraSimpleResult.success && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600">
                        <div>상태: {ultraSimpleResult.results?.test || 'OK'}</div>
                        <div>서버: {ultraSimpleResult.results?.server || 'Running'}</div>
                        <div>시간: {ultraSimpleResult.results?.time || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 유사도 디버깅 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              유사도 디버깅
            </CardTitle>
            <CardDescription>
              벡터 검색이 0개 결과를 반환하는 원인을 상세히 분석합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runSimilarityDebug} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    유사도 디버깅 중...
                  </>
                ) : (
                  '유사도 디버깅 실행'
                )}
              </Button>
              
              {similarityDebugResult && (
                <div className="space-y-4">
                  <Alert className={similarityDebugResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {similarityDebugResult.success ? '유사도 디버깅이 완료되었습니다.' : `오류: ${similarityDebugResult.error}`}
                    </AlertDescription>
                  </Alert>
                  
                  {similarityDebugResult.success && (
                    <div className="space-y-4">
                      {/* 쿼리 정보 */}
                      <div>
                        <h4 className="font-semibold mb-2">쿼리 정보</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="text-sm text-gray-600">
                            <div>쿼리: {similarityDebugResult.results.query}</div>
                            <div>임베딩 차원: {similarityDebugResult.results.query_embedding_length}</div>
                            <div>임베딩 샘플: [{similarityDebugResult.results.query_embedding_sample.join(', ')}]</div>
                          </div>
                        </div>
                      </div>

                      {/* 유사도 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">유사도 분석</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="text-sm text-gray-600 space-y-2">
                            <div>총 청크 수: {similarityDebugResult.results.total_chunks}개</div>
                            <div>최대 유사도: {similarityDebugResult.results.max_similarity.toFixed(6)}</div>
                            <div>최소 유사도: {similarityDebugResult.results.min_similarity.toFixed(6)}</div>
                            <div>임계값: 0.01</div>
                          </div>
                        </div>
                      </div>

                      {/* 상세 유사도 */}
                      <div>
                        <h4 className="font-semibold mb-2">청크별 유사도</h4>
                        <div className="space-y-2">
                          {similarityDebugResult.results.similarities.map((item: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-md">
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">{item.chunk_id}</div>
                                <div>유사도: {item.similarity.toFixed(6)} {item.similarity > 0.01 ? '✅' : '❌'}</div>
                                <div className="text-xs mt-1">{item.content_preview}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 빠른 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              빠른 테스트 (5초 이내)
            </CardTitle>
            <CardDescription>
              임베딩 서비스와 데이터베이스 연결을 빠르게 테스트합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">테스트 쿼리</label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="테스트할 질문을 입력하세요"
                  className="min-h-[100px]"
                />
              </div>
              
              <Button onClick={runQuickTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    빠른 테스트 중...
                  </>
                ) : (
                  '빠른 테스트 실행'
                )}
              </Button>
              
              {quickTestResult && (
                <div className="space-y-4">
                  <Alert className={quickTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {quickTestResult.success ? '빠른 테스트가 완료되었습니다.' : `오류: ${quickTestResult.error}`}
                    </AlertDescription>
                  </Alert>
                  
                  {quickTestResult.success && (
                    <div className="space-y-4">
                      {/* 임베딩 서비스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">임베딩 서비스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {quickTestResult.results.embedding.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>차원: {quickTestResult.results.embedding.dimension}</div>
                                <div>처리 시간: {quickTestResult.results.embedding.processingTime}ms</div>
                                <div>모델: {quickTestResult.results.embedding.model}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {quickTestResult.results.embedding.error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 데이터베이스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">데이터베이스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {quickTestResult.results.database.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>청크 수: {quickTestResult.results.database.count}개</div>
                                <div>샘플: {quickTestResult.results.database.samples.join(', ')}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {quickTestResult.results.database.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 간단한 RAG 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              간단한 RAG 테스트 (10초 이내)
            </CardTitle>
            <CardDescription>
              RAG 시스템의 전체 파이프라인을 간단하게 테스트합니다. (RPC 함수 사용 안함)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">테스트 쿼리</label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="테스트할 질문을 입력하세요"
                  className="min-h-[100px]"
                />
              </div>
              
              <Button onClick={runSimpleRagTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    간단한 RAG 테스트 중...
                  </>
                ) : (
                  '간단한 RAG 테스트 실행'
                )}
              </Button>
              
              {simpleRagResult && (
                <div className="space-y-4">
                  <Alert className={simpleRagResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {simpleRagResult.success ? '간단한 RAG 테스트가 완료되었습니다.' : `오류: ${simpleRagResult.error}`}
                    </AlertDescription>
                  </Alert>
                  
                  {simpleRagResult.success && (
                    <div className="space-y-4">
                      {/* 임베딩 서비스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">임베딩 서비스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {simpleRagResult.results.embedding.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>차원: {simpleRagResult.results.embedding.dimension}</div>
                                <div>처리 시간: {simpleRagResult.results.embedding.processingTime}ms</div>
                                <div>모델: {simpleRagResult.results.embedding.model}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {simpleRagResult.results.embedding.error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 벡터 검색 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">벡터 검색</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {simpleRagResult.results.vectorSearch.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>검색 결과: {simpleRagResult.results.vectorSearch.results}개</div>
                                <div>샘플: {simpleRagResult.results.vectorSearch.data?.map((d: any) => d.chunk_id).join(', ') || '없음'}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {simpleRagResult.results.vectorSearch.error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* LLM 서비스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">LLM 서비스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {simpleRagResult.results.llm.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>처리 시간: {simpleRagResult.results.llm.processingTime}ms</div>
                                <div>모델: {simpleRagResult.results.llm.model}</div>
                                <div>신뢰도: {simpleRagResult.results.llm.confidence}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {simpleRagResult.results.llm.error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RAG 통합 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">RAG 통합</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {simpleRagResult.results.rag.success ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700 font-medium">성공</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>출처 수: {simpleRagResult.results.rag.sources}개</div>
                                <div>신뢰도: {simpleRagResult.results.rag.confidence}</div>
                                <div>처리 시간: {simpleRagResult.results.rag.processingTime}ms</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-700">실패: {simpleRagResult.results.rag.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RAG 상세 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              RAG 상세 테스트
            </CardTitle>
            <CardDescription>
              RAG 시스템의 각 구성 요소를 상세히 테스트하여 문제점을 파악합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">테스트 쿼리</label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="테스트할 질문을 입력하세요..."
                  rows={3}
                />
              </div>
              
              <Button onClick={runRagDetailedTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    RAG 상세 테스트 중...
                  </>
                ) : (
                  'RAG 상세 테스트 실행'
                )}
              </Button>
              
              {ragDetailedResult && (
                <div className="space-y-4">
                  <Alert className={ragDetailedResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {ragDetailedResult.success ? 'RAG 상세 테스트가 완료되었습니다.' : `오류: ${ragDetailedResult.error}`}
                    </AlertDescription>
                  </Alert>
                  
                  {ragDetailedResult.success && (
                    <div className="space-y-4">
                      {/* 임베딩 서비스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">임베딩 서비스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {ragDetailedResult.results.embedding.success ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span>상태:</span><span className="text-green-600">성공</span>
                              <span>차원:</span><span>{ragDetailedResult.results.embedding.dimension}</span>
                              <span>처리시간:</span><span>{ragDetailedResult.results.embedding.processingTime}ms</span>
                              <span>모델:</span><span>{ragDetailedResult.results.embedding.model}</span>
                            </div>
                          ) : (
                            <div className="text-red-600 text-sm">
                              실패: {ragDetailedResult.results.embedding.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 벡터 검색 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">벡터 검색</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {ragDetailedResult.results.vectorSearch.success ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span>상태:</span><span className="text-green-600">성공</span>
                              <span>검색 결과:</span><span>{ragDetailedResult.results.vectorSearch.results}개</span>
                            </div>
                          ) : (
                            <div className="text-red-600 text-sm">
                              실패: {ragDetailedResult.results.vectorSearch.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* LLM 서비스 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">LLM 서비스</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {ragDetailedResult.results.llm.success ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span>상태:</span><span className="text-green-600">성공</span>
                                <span>처리시간:</span><span>{ragDetailedResult.results.llm.processingTime}ms</span>
                                <span>모델:</span><span>{ragDetailedResult.results.llm.model}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">답변:</span>
                                <p className="text-sm mt-1 p-2 bg-white rounded border">{ragDetailedResult.results.llm.answer}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-600 text-sm">
                              실패: {ragDetailedResult.results.llm.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* RAG 통합 결과 */}
                      <div>
                        <h4 className="font-semibold mb-2">RAG 통합</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          {ragDetailedResult.results.rag.success ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span>상태:</span><span className="text-green-600">성공</span>
                                <span>소스 수:</span><span>{ragDetailedResult.results.rag.sources}개</span>
                                <span>신뢰도:</span><span>{ragDetailedResult.results.rag.confidence}</span>
                                <span>처리시간:</span><span>{ragDetailedResult.results.rag.processingTime}ms</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">RAG 답변:</span>
                                <p className="text-sm mt-1 p-2 bg-white rounded border">{ragDetailedResult.results.rag.answer}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-600 text-sm">
                              실패: {ragDetailedResult.results.rag.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 임베딩 모델 비교 테스트 */}
        <EmbeddingModelSelector />

        {/* 벡터 검색 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              벡터 검색 테스트
            </CardTitle>
            <CardDescription>
              벡터 검색 함수와 임베딩 데이터 형식을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runVectorTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  벡터 검색 테스트 중...
                </>
              ) : (
                '벡터 검색 테스트'
              )}
            </Button>

            {vectorTestResult && (
              <div className="mt-4 space-y-4">
                <Alert className={vectorTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    {vectorTestResult.success ? '벡터 검색 테스트가 완료되었습니다.' : `오류: ${vectorTestResult.error}`}
                  </AlertDescription>
                </Alert>

                {vectorTestResult.success && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">벡터 검색 결과</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>검색 결과 수:</span>
                          <span>{vectorTestResult.vectorSearch.results}개</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>직접 쿼리 결과:</span>
                          <span>{vectorTestResult.directQuery.results}개</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>임베딩 데이터 타입:</span>
                          <span>{vectorTestResult.embeddingData.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>임베딩 데이터 길이:</span>
                          <span>{vectorTestResult.embeddingData.length}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">임베딩 데이터 샘플</h4>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-mono">
                          {JSON.stringify(vectorTestResult.embeddingData.sample, null, 2)}
                        </p>
                      </div>
                    </div>

                    {vectorTestResult.vectorSearch.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          벡터 검색 함수 오류: {vectorTestResult.vectorSearch.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {vectorTestResult.directQuery.error && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          직접 쿼리 오류: {vectorTestResult.directQuery.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
