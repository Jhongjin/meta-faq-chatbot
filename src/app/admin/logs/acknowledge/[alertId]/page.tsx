"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, User, Mail, ArrowLeft } from 'lucide-react';

interface AlertData {
  id: string;
  log_id: string;
  log_level: string;
  log_type: string;
  log_message: string;
  log_timestamp: string;
  user_id?: string;
  ip_address?: string;
  alert_status: string;
  first_sent_at: string;
  last_sent_at: string;
  email_count: number;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export default function AcknowledgeAlertPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.alertId as string;
  
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (alertId) {
      fetchAlertData();
    }
  }, [alertId]);

  const fetchAlertData = async () => {
    try {
      const response = await fetch(`/api/admin/logs/alerts?alertId=${alertId}`);
      const result = await response.json();
      
      if (result.success && result.data.alerts.length > 0) {
        setAlertData(result.data.alerts[0]);
      } else {
        setMessage({ type: 'error', text: '알림을 찾을 수 없습니다.' });
      }
    } catch (error) {
      console.error('알림 데이터 조회 실패:', error);
      setMessage({ type: 'error', text: '알림 데이터를 불러오는데 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/logs/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'acknowledge',
          alertId: alertId,
          acknowledgedBy: 'admin@system.com' // 실제로는 현재 로그인한 사용자 정보
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: '알림이 성공적으로 확인되었습니다. 이제 재발송이 중단됩니다.' });
        // 알림 데이터 새로고침
        setTimeout(() => {
          fetchAlertData();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.error || '알림 확인에 실패했습니다.' });
      }
    } catch (error) {
      console.error('알림 확인 실패:', error);
      setMessage({ type: 'error', text: '알림 확인에 실패했습니다.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      case 'warning':
        return <Badge variant="secondary">경고</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">대기 중</Badge>;
      case 'acknowledged':
        return <Badge variant="default">확인됨</Badge>;
      case 'resolved':
        return <Badge variant="outline">해결됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout currentPage="logs">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">알림 정보를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!alertData) {
    return (
      <AdminLayout currentPage="logs">
        <div className="max-w-4xl mx-auto p-6">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">알림을 찾을 수 없습니다</AlertTitle>
            <AlertDescription className="text-red-700">
              요청하신 알림 ID를 찾을 수 없습니다. URL을 확인해주세요.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/admin/logs')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그 페이지로 돌아가기
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="logs">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로그 알림 확인</h1>
            <p className="text-gray-600">시스템에서 발생한 로그 알림을 확인하고 재발송을 중단할 수 있습니다.</p>
          </div>
          <Button onClick={() => router.push('/admin/logs')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            로그 페이지로 돌아가기
          </Button>
        </div>

        {/* 메시지 */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.type === 'success' ? '성공' : '오류'}
            </AlertTitle>
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* 알림 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              알림 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">로그 ID:</span>
                    <span className="font-mono text-sm">{alertData.log_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">로그 레벨:</span>
                    {getLevelBadge(alertData.log_level)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">로그 유형:</span>
                    <span>{alertData.log_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태:</span>
                    {getStatusBadge(alertData.alert_status)}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">발송 정보</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">발송 횟수:</span>
                    <span className="font-semibold">{alertData.email_count}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">최초 발생:</span>
                    <span className="text-sm">{new Date(alertData.first_sent_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">마지막 발송:</span>
                    <span className="text-sm">{new Date(alertData.last_sent_at).toLocaleString()}</span>
                  </div>
                  {alertData.acknowledged_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">확인자:</span>
                      <span className="text-sm">{alertData.acknowledged_by}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 로그 메시지 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              로그 메시지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{alertData.log_message}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">발생 시간:</span>
                <span className="ml-2">{new Date(alertData.log_timestamp).toLocaleString()}</span>
              </div>
              {alertData.user_id && (
                <div>
                  <span className="text-gray-600">사용자 ID:</span>
                  <span className="ml-2">{alertData.user_id}</span>
                </div>
              )}
              {alertData.ip_address && (
                <div>
                  <span className="text-gray-600">IP 주소:</span>
                  <span className="ml-2">{alertData.ip_address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        {alertData.alert_status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                알림 확인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                이 알림을 확인하면 1시간 간격 재발송이 중단됩니다. 
                로그를 확인한 후 아래 버튼을 클릭해주세요.
              </p>
              <Button 
                onClick={handleAcknowledge}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    알림 확인
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {alertData.alert_status === 'acknowledged' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">알림이 확인되었습니다</AlertTitle>
            <AlertDescription className="text-green-700">
              이 알림은 이미 확인되어 재발송이 중단되었습니다.
              {alertData.acknowledged_at && (
                <span className="block mt-1">
                  확인 시간: {new Date(alertData.acknowledged_at).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
}
