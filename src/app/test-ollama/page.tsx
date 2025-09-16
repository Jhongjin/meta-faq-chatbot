'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Server, CheckCircle, XCircle } from 'lucide-react';

interface OllamaResponse {
  success: boolean;
  response?: {
    message: string;
    model: string;
    processingTime: number;
    server: string;
    timestamp: string;
  };
  error?: string;
  details?: string;
  server?: {
    healthy: boolean;
    baseUrl: string;
    availableModels: Array<{
      name: string;
      size: string;
      modifiedAt: string;
    }>;
  };
}

export default function TestOllamaPage() {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('tinyllama:1.1b');
  const [response, setResponse] = useState<OllamaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<OllamaResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const availableModels = [
    { name: 'tinyllama:1.1b', description: '가벼운 모델 (637MB)' },
    { name: 'llama2:7b', description: '안정적인 모델 (3.8GB)' },
    { name: 'mistral:7b', description: '고성능 모델 (4.4GB)' }
  ];

  // 서버에서 실제 사용 가능한 모델 목록
  const [serverModels, setServerModels] = useState<Array<{
    name: string;
    size: string;
    modifiedAt: string;
  }>>([]);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [useLocalTest, setUseLocalTest] = useState(false);

  const checkServerStatus = async () => {
    setStatusLoading(true);
    try {
      console.log('🔍 서버 상태 확인 요청 시작');
      const endpoint = useLocalTest ? '/api/ollama/local-test' : '/api/ollama';
      const res = await fetch(endpoint);
      const data = await res.json();
      
      console.log('📥 서버 상태 응답:', {
        success: data.success,
        serverHealthy: data.server?.healthy,
        hasServer: !!data.server,
        modelsCount: data.server?.availableModels?.length || 0
      });
      
      setServerStatus(data);
      
      // 서버에서 실제 사용 가능한 모델 목록 저장
      if (data.success && data.server?.availableModels) {
        setServerModels(data.server.availableModels);
        console.log('📋 서버 모델 목록 저장:', data.server.availableModels);
      }
    } catch (error) {
      console.error('서버 상태 확인 오류:', error);
      setServerStatus({
        success: false,
        error: '서버 상태 확인 실패',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const runDiagnosis = async () => {
    setDiagnosisLoading(true);
    try {
      console.log('🔍 Ollama 서버 진단 시작');
      const res = await fetch('/api/ollama/diagnose');
      const data = await res.json();
      setDiagnosis(data);
      console.log('📊 진단 결과:', data);
    } catch (error) {
      console.error('진단 실행 오류:', error);
      setDiagnosis({
        success: false,
        error: '진단 실행 실패',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const endpoint = useLocalTest ? '/api/ollama/local-test' : '/api/ollama';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, model }),
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setResponse({
        success: false,
        error: '메시지 전송 실패',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ollama 서버 테스트</h1>
        <p className="text-muted-foreground">
          Vultr 서버의 Ollama 모델들과 직접 대화해보세요.
        </p>
      </div>

      {/* 서버 상태 확인 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            서버 상태
          </CardTitle>
          <CardDescription>
            Ollama 서버 연결 상태와 사용 가능한 모델을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="localTest"
                checked={useLocalTest}
                onChange={(e) => setUseLocalTest(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="localTest" className="text-sm">
                로컬 테스트 모드 사용 (Vultr 서버 연결 문제 시)
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={checkServerStatus} 
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  useLocalTest ? '로컬 테스트 확인' : '서버 상태 확인'
                )}
              </Button>
              
              <Button 
                onClick={runDiagnosis} 
                disabled={diagnosisLoading}
                variant="outline"
              >
                {diagnosisLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    진단 중...
                  </>
                ) : (
                  '상세 진단'
                )}
              </Button>
            </div>
          </div>

          {serverStatus && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {serverStatus.success && serverStatus.server?.healthy ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {serverStatus.success && serverStatus.server?.healthy ? '서버 정상' : '서버 오류'}
                </span>
              </div>

              {serverStatus.server && (
                <div className="space-y-2">
                  <p><strong>서버 URL:</strong> {serverStatus.server.actualUrl || serverStatus.server.baseUrl}</p>
                  <p><strong>상태:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      serverStatus.server.healthy 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {serverStatus.server.healthy ? '정상' : '오류'}
                    </span>
                  </p>
                  
                  {serverStatus.server.availableModels && 
                   Array.isArray(serverStatus.server.availableModels) && 
                   serverStatus.server.availableModels.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">사용 가능한 모델:</p>
                      <div className="flex flex-wrap gap-2">
                        {serverStatus.server.availableModels.map((model, index) => (
                          <Badge key={index} variant="secondary">
                            {model.name} ({model.size})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {serverStatus.error && (
                <div className="text-red-600">
                  <p><strong>오류:</strong> {serverStatus.error}</p>
                  {serverStatus.details && (
                    <p><strong>세부사항:</strong> {serverStatus.details}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {diagnosis && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">진단 결과</h3>
              <div className="space-y-2">
                <p><strong>전체 상태:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    diagnosis.summary?.overallHealth === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {diagnosis.summary?.overallHealth === 'healthy' ? '정상' : '비정상'}
                  </span>
                </p>
                <p><strong>성공한 테스트:</strong> {diagnosis.summary?.successCount}/{diagnosis.summary?.totalTests}</p>
                
                {diagnosis.tests && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">개별 테스트 결과:</p>
                    <div className="space-y-1">
                      {diagnosis.tests.map((test: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {test.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{test.name}</span>
                          {test.error && (
                            <span className="text-red-600 text-xs">({test.error})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 채팅 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            모델 테스트
          </CardTitle>
          <CardDescription>
            선택한 모델과 대화를 테스트해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 모델 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">모델 선택</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {serverModels && Array.isArray(serverModels) && serverModels.length > 0 ? (
                serverModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.size})
                  </option>
                ))
              ) : (
                availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} - {m.description}
                  </option>
                ))
              )}
            </select>
            {serverModels && Array.isArray(serverModels) && serverModels.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                서버에서 실제 사용 가능한 모델 목록을 표시합니다.
              </p>
            )}
          </div>

          {/* 메시지 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">메시지</label>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="테스트할 메시지를 입력하세요..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 응답 표시 */}
          {response && (
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">응답</h3>
              {response.success ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="whitespace-pre-wrap">{response.response?.message}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>모델:</strong> {response.response?.model}</p>
                    <p><strong>처리 시간:</strong> {response.response?.processingTime}ms</p>
                    <p><strong>서버:</strong> {response.response?.server}</p>
                    <p><strong>시간:</strong> {response.response?.timestamp}</p>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <p><strong>오류:</strong> {response.error}</p>
                  {response.details && (
                    <p><strong>세부사항:</strong> {response.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
