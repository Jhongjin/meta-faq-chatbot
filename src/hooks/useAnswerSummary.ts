"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UseAnswerSummaryProps {
  aiResponse: string;
  userQuestion: string;
  sources: Array<{
    id: string;
    title: string;
    excerpt: string;
    sourceType?: 'file' | 'url';
  }>;
}

interface AnswerSummaryData {
  keyPoints: string[];
  documentHighlights: string[];
  confidence: number;
}

export function useAnswerSummary({ aiResponse, userQuestion, sources }: UseAnswerSummaryProps) {
  const [summaryData, setSummaryData] = useState<AnswerSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (): Promise<AnswerSummaryData> => {
    const response = await fetch('/api/chat/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userQuestion,
        aiResponse,
        sources: sources.map(s => ({
          title: s.title,
          excerpt: s.excerpt,
          sourceType: s.sourceType
        }))
      }),
    });

    if (!response.ok) {
      throw new Error('요약 생성에 실패했습니다.');
    }

    return response.json();
  };

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['answerSummary', userQuestion, aiResponse],
    queryFn: generateSummary,
    enabled: !!aiResponse && !!userQuestion && aiResponse.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    retry: 2,
  });

  useEffect(() => {
    if (data) {
      setSummaryData(data);
      setIsLoading(false);
      setError(null);
    } else if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
    } else if (queryLoading) {
      setIsLoading(true);
      setError(null);
    }
  }, [data, queryError, queryLoading]);

  return {
    summaryData,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true);
      setError(null);
    }
  };
}
