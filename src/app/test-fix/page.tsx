'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestFixPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fixEmbeddings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResults((prev: any) => ({ ...prev, embeddings: data }));
      console.log('임베딩 수정 결과:', data);
    } catch (error) {
      console.error('오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMetaChunks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-meta-chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, chunks: data }));
      console.log('Meta 청크 생성 결과:', data);
    } catch (error) {
      console.error('오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">데이터베이스 수정 도구</h1>
      
      <div className="space-y-4">
        <Button 
          onClick={fixEmbeddings} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '처리 중...' : '1단계: 임베딩 형식 수정'}
        </Button>
        
        <Button 
          onClick={createMetaChunks} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '처리 중...' : '2단계: Meta 문서 청크 생성'}
        </Button>
      </div>

      {results && (
        <div className="mt-8 space-y-4">
          {results.embeddings && (
            <div className="p-4 bg-green-100 rounded">
              <h3 className="font-bold">임베딩 수정 결과:</h3>
              <pre className="text-sm">{JSON.stringify(results.embeddings, null, 2)}</pre>
            </div>
          )}
          
          {results.chunks && (
            <div className="p-4 bg-blue-100 rounded">
              <h3 className="font-bold">Meta 청크 생성 결과:</h3>
              <pre className="text-sm">{JSON.stringify(results.chunks, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

