'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Zap, Shield, DollarSign } from 'lucide-react';

interface EmbeddingModel {
  id: string;
  name: string;
  provider: 'openai' | 'ollama';
  dimension: number;
  cost: 'free' | 'paid';
  accuracy: 'high' | 'medium';
  speed: 'fast' | 'medium' | 'slow';
  privacy: 'high' | 'medium';
}

const embeddingModels: EmbeddingModel[] = [
  {
    id: 'openai-text-embedding-3-small',
    name: 'OpenAI text-embedding-3-small',
    provider: 'openai',
    dimension: 1536,
    cost: 'paid',
    accuracy: 'high',
    speed: 'fast',
    privacy: 'medium'
  },
  {
    id: 'openai-text-embedding-3-large',
    name: 'OpenAI text-embedding-3-large',
    provider: 'openai',
    dimension: 3072,
    cost: 'paid',
    accuracy: 'high',
    speed: 'medium',
    privacy: 'medium'
  },
  {
    id: 'ollama-nomic-embed-text',
    name: 'Ollama nomic-embed-text',
    provider: 'ollama',
    dimension: 768,
    cost: 'free',
    accuracy: 'medium',
    speed: 'fast',
    privacy: 'high'
  },
  {
    id: 'ollama-mxbai-embed-large',
    name: 'Ollama mxbai-embed-large',
    provider: 'ollama',
    dimension: 1024,
    cost: 'free',
    accuracy: 'high',
    speed: 'medium',
    privacy: 'high'
  }
];

interface TestResult {
  model: string;
  dimension: number;
  processingTime: number;
  accuracy: number;
  sample: number[];
  error?: string;
}

export default function EmbeddingModelSelector() {
  const [selectedModel, setSelectedModel] = useState<string>('ollama-nomic-embed-text');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testQuery, setTestQuery] = useState('메타 광고 정책에 대해 설명해주세요');

  const runEmbeddingTest = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      const response = await fetch('/api/test-embedding-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery,
          models: embeddingModels.map(m => m.id)
        }),
      });

      const results = await response.json();
      setTestResults(results.results || []);
    } catch (error) {
      console.error('임베딩 테스트 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'slow': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          임베딩 모델 비교 테스트
        </CardTitle>
        <CardDescription>
          다양한 임베딩 모델의 성능을 비교하여 최적의 모델을 선택하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 테스트 쿼리 입력 */}
        <div>
          <label className="text-sm font-medium mb-2 block">테스트 쿼리</label>
          <textarea
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="w-full p-3 border rounded-md"
            rows={3}
            placeholder="테스트할 질문을 입력하세요..."
          />
        </div>

        {/* 모델 선택 */}
        <div>
          <label className="text-sm font-medium mb-3 block">비교할 모델들</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {embeddingModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedModel === model.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{model.name}</h4>
                  <Badge variant={model.provider === 'openai' ? 'default' : 'secondary'}>
                    {model.provider.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">차원:</span>
                    <span>{model.dimension}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Badge className={model.cost === 'free' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {model.cost === 'free' ? '무료' : '유료'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <Badge className={getAccuracyColor(model.accuracy)}>
                      정확도: {model.accuracy === 'high' ? '높음' : '보통'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <Badge className={getSpeedColor(model.speed)}>
                      속도: {model.speed === 'fast' ? '빠름' : model.speed === 'medium' ? '보통' : '느림'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <Badge className={getPrivacyColor(model.privacy)}>
                      개인정보: {model.privacy === 'high' ? '높음' : '보통'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 테스트 실행 */}
        <Button 
          onClick={runEmbeddingTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              임베딩 모델 비교 테스트 중...
            </>
          ) : (
            '모든 모델 테스트 실행'
          )}
        </Button>

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">테스트 결과</h4>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{result.model}</h5>
                    {result.error ? (
                      <Badge variant="destructive">오류</Badge>
                    ) : (
                      <Badge variant="default">성공</Badge>
                    )}
                  </div>
                  
                  {result.error ? (
                    <p className="text-red-600 text-sm">{result.error}</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">차원:</span>
                        <span className="ml-1 font-mono">{result.dimension}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">처리시간:</span>
                        <span className="ml-1 font-mono">{result.processingTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">정확도:</span>
                        <span className="ml-1 font-mono">{result.accuracy.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">샘플:</span>
                        <span className="ml-1 font-mono text-xs">
                          [{result.sample.slice(0, 3).map(x => x.toFixed(2)).join(', ')}...]
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
