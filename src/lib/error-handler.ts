// 전역 에러 핸들러
export function setupGlobalErrorHandlers() {
  // Promise rejection 핸들러
  if (typeof window !== 'undefined') {
    // 기존 핸들러 제거 후 새로 등록
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    window.removeEventListener('error', handleGlobalError);
    window.addEventListener('error', handleGlobalError);
  }
}

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  console.error('Unhandled Promise Rejection:', event.reason);
  
  // 에러를 안전하게 처리하여 기본 동작 방지
  event.preventDefault();
  
  // 에러 타입별 처리
  if (event.reason instanceof Error) {
    console.error('Error details:', {
      name: event.reason.name,
      message: event.reason.message,
      stack: event.reason.stack
    });
  } else if (event.reason && typeof event.reason === 'object') {
    console.error('Rejection reason:', JSON.stringify(event.reason, null, 2));
  }
}

function handleGlobalError(event: ErrorEvent) {
  console.error('Global Error:', event.error);
  
  // 에러를 안전하게 처리
  event.preventDefault();
  
  if (event.error instanceof Error) {
    console.error('Error details:', {
      name: event.error.name,
      message: event.error.message,
      stack: event.error.stack
    });
  }
}

// Next.js API 에러 핸들러
export function handleApiError(error: unknown): { message: string; status: number } {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
      return { message: '요청 시간이 초과되었습니다.', status: 408 };
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { message: '네트워크 오류가 발생했습니다.', status: 503 };
    }
    if (error.message.includes('JSON')) {
      return { message: '서버 응답을 처리할 수 없습니다.', status: 500 };
    }
  }
  
  return { message: '서버 오류가 발생했습니다.', status: 500 };
}
