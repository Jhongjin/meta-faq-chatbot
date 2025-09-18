'use client';

export interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  processingDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
  systemStatus: {
    overall: 'healthy' | 'warning' | 'error';
    database: 'connected' | 'disconnected' | 'error';
    llm: 'operational' | 'degraded' | 'error';
    vectorStore: 'indexed' | 'indexing' | 'error';
    lastUpdate: string;
  };
  recentActivity: Array<{
    id: string;
    type: 'question' | 'document_upload' | 'feedback' | 'system';
    content: string;
    time: string;
    user?: string;
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: string;
    status: 'excellent' | 'good' | 'warning' | 'error';
    trend: string;
  }>;
  weeklyStats: {
    questions: number;
    users: number;
    satisfaction: number;
    documents: number;
  };
}

export class DashboardDataService {
  private baseUrl = '/api/admin';

  /**
   * 대시보드 통계 데이터 조회
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '대시보드 데이터 조회에 실패했습니다.');
      }

      return data.data;
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
      throw error;
    }
  }


  /**
   * 실시간 데이터 새로고침
   */
  async refreshDashboardStats(): Promise<DashboardStats> {
    return this.getDashboardStats();
  }
}

// 싱글톤 인스턴스
export const dashboardDataService = new DashboardDataService();
