"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, RefreshCw, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare } from "lucide-react";

export default function LogsPage() {
  // Dummy data for demonstration
  const logLevels = [
    { value: "all", label: "모든 레벨" },
    { value: "error", label: "오류" },
    { value: "warning", label: "경고" },
    { value: "info", label: "정보" },
    { value: "debug", label: "디버그" },
  ];

  const logTypes = [
    { value: "all", label: "모든 유형" },
    { value: "user", label: "사용자 활동" },
    { value: "system", label: "시스템" },
    { value: "security", label: "보안" },
    { value: "performance", label: "성능" },
  ];

  const selectedLevel = "all";
  const selectedType = "all";

  const logs = [
    {
      id: "1",
      timestamp: "2024-01-15 16:45:23",
      level: "info",
      type: "user",
      message: "사용자 김마케팅이 로그인했습니다",
      userId: "user_001",
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: { action: "login", success: true },
    },
    {
      id: "2",
      timestamp: "2024-01-15 16:44:15",
      level: "info",
      type: "user",
      message: "사용자 이퍼포먼스가 질문을 등록했습니다",
      userId: "user_002",
      ip: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      details: { action: "question", questionId: "q_123", category: "광고 정책" },
    },
    {
      id: "3",
      timestamp: "2024-01-15 16:43:42",
      level: "warning",
      type: "system",
      message: "문서 인덱싱 대기 중인 파일이 3개 있습니다",
      userId: null,
      ip: null,
      userAgent: null,
      details: { action: "indexing", pendingFiles: 3, queueSize: 5 },
    },
    {
      id: "4",
      timestamp: "2024-01-15 16:42:18",
      level: "error",
      type: "system",
      message: "문서 업로드 중 오류가 발생했습니다",
      userId: "user_003",
      ip: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: { action: "upload", error: "File size exceeds limit", fileSize: "25MB" },
    },
    {
      id: "5",
      timestamp: "2024-01-15 16:41:55",
      level: "info",
      type: "performance",
      message: "AI 응답 시간: 2.3초 (평균: 2.1초)",
      userId: null,
      ip: null,
      userAgent: null,
      details: { action: "ai_response", responseTime: 2.3, averageTime: 2.1, threshold: 3.0 },
    },
    {
      id: "6",
      timestamp: "2024-01-15 16:40:32",
      level: "info",
      type: "security",
      message: "비정상적인 로그인 시도가 감지되었습니다",
      userId: null,
      ip: "203.241.45.67",
      userAgent: "Mozilla/5.0 (Unknown) AppleWebKit/537.36",
      details: { action: "security_alert", reason: "multiple_failed_logins", attempts: 5 },
    },
    {
      id: "7",
      timestamp: "2024-01-15 16:39:18",
      level: "info",
      type: "user",
      message: "사용자 박운영이 히스토리를 조회했습니다",
      userId: "user_004",
      ip: "192.168.1.103",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: { action: "history_view", items: 15, filters: ["favorites"] },
    },
    {
      id: "8",
      timestamp: "2024-01-15 16:38:45",
      level: "warning",
      type: "performance",
      message: "데이터베이스 연결 지연이 발생했습니다",
      userId: null,
      ip: null,
      userAgent: null,
      details: { action: "db_connection", delay: 1500, threshold: 1000, connectionPool: "80%" },
    },
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      case "debug":
        return <Info className="w-4 h-4 text-gray-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">오류</Badge>;
      case "warning":
        return <Badge variant="secondary">경고</Badge>;
      case "info":
        return <Badge variant="default">정보</Badge>;
      case "debug":
        return <Badge variant="outline">디버그</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "user":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">사용자</Badge>;
      case "system":
        return <Badge variant="secondary">시스템</Badge>;
      case "security":
        return <Badge variant="destructive">보안</Badge>;
      case "performance":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">성능</Badge>;
      default:
        return <Badge variant="outline">기타</Badge>;
    }
  };

  const exportLogs = () => {
    console.log("Exporting logs...");
    // In a real app, this would export logs to CSV/JSON
  };

  const refreshLogs = () => {
    console.log("Refreshing logs...");
    // In a real app, this would fetch latest logs
  };

  return (
    <AdminLayout currentPage="logs">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 로그</h1>
            <p className="text-gray-600">
              시스템 활동과 사용자 행동을 모니터링하여 문제를 조기에 발견하고 대응하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={refreshLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>필터</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">로그 레벨</label>
              <Select value={selectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">로그 유형</label>
              <Select value={selectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">사용자 ID</label>
              <Input placeholder="사용자 ID 입력..." />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="로그 메시지 검색..." className="pl-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>로그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getLevelIcon(log.level)}
                      <div className="flex items-center space-x-2">
                        {getLevelBadge(log.level)}
                        {getTypeBadge(log.type)}
                      </div>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 mb-2">{log.message}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                      {log.userId && (
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span>사용자: {log.userId}</span>
                        </div>
                      )}
                      {log.ip && (
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-3 h-3" />
                          <span>IP: {log.ip}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>시간: {log.timestamp}</span>
                      </div>
                    </div>
                    
                    {log.details && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                        <details>
                          <summary className="cursor-pointer font-medium text-gray-700">
                            상세 정보
                          </summary>
                          <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm" className="text-gray-400">
                      <Info className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 로그 수</CardTitle>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
            <p className="text-xs text-gray-500 mt-1">오늘 생성된 로그</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">오류</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs.filter(log => log.level === "error").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">주의가 필요한 로그</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">경고</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs.filter(log => log.level === "warning").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">모니터링 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">사용자 활동</CardTitle>
            <User className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs.filter(log => log.type === "user").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">사용자 행동 로그</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
