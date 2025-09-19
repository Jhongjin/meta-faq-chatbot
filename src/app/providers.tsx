'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 전역 에러 핸들러 설정 (완전 간소화)
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // 이벤트 객체 에러는 무시
      if (event.target && event.target !== window) {
        return;
      }
      console.error('Global Error:', event.message || 'Unknown error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 이벤트 객체 rejection은 무시
      if (event.reason && typeof event.reason === 'object' && event.reason.type === 'error') {
        return;
      }
      console.error('Unhandled Promise Rejection:', event.reason);
    };

    // 전역 에러 핸들러 등록
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry: 1, // Only retry once
          refetchOnWindowFocus: false // Disable refetch on window focus
        },
        mutations: {
          onError: (error) => {
            // 뮤테이션 에러 로깅 및 처리 - 이벤트 객체 안전 처리
            try {
              // 이벤트 객체인지 확인하고 안전하게 직렬화
              if (error && typeof error === 'object' && 'type' in error) {
                // 이벤트 객체인 경우 메시지만 추출
                const errorMessage = error.message || error.toString() || 'Unknown mutation error';
                console.error('React Query Mutation Error (Event):', errorMessage);
              } else {
                // 일반 에러 객체인 경우
                console.error('React Query Mutation Error:', error);
              }
            } catch (logError) {
              console.error('Error logging failed:', logError);
            }
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
