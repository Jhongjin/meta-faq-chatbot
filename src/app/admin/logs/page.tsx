"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Filter, Download, RefreshCw, AlertTriangle, Info, CheckCircle, Clock, 
  User, MessageSquare, HelpCircle, Eye, FileText, Shield, Zap, Activity,
  TrendingUp, TrendingDown, Minus, Calendar, Clock3, Users, Server, Mail, Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LogsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedLogs, setShowAdvancedLogs] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

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

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
    setLastUpdated(new Date());
    fetchAlerts();
  }, []);

  // 알림 목록 조회
  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetch('/api/admin/logs/alerts?limit=10');
      const result = await response.json();
      if (result.success) {
        setAlerts(result.data.alerts);
      }
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  // 테스트 로그 생성
  const createTestLog = async () => {
    try {
      const testLogData = {
        log_id: `test_${Date.now()}`,
        log_level: 'warning',
        log_type: 'system',
        log_message: '테스트용 경고 로그가 생성되었습니다. 이메일 알림이 발송됩니다.',
        log_timestamp: new Date().toISOString(),
        user_id: 'test_user',
        ip_address: '192.168.1.100'
      };

      const response = await fetch('/api/admin/logs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLogData),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 테스트 로그 생성 완료');
        // 알림 목록 새로고침
        setTimeout(() => {
          fetchAlerts();
        }, 1000);
      } else {
        console.error('테스트 로그 생성 실패:', result.error);
      }
    } catch (error) {
      console.error('테스트 로그 생성 실패:', error);
    }
  };

  // 데이터 새로고침 함수
  const refreshData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
      await fetchAlerts(); // 알림 목록도 함께 새로고침
      console.log('로그 데이터 새로고침 완료');
    } catch (error) {
      console.error('로그 데이터 새로고침 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        return <Info className="w-4 h-4 text-gray-300" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge className="bg-red-500/20 text-red-300 border-red-400/50 text-xs px-3 py-1 font-semibold">오류</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50 text-xs px-3 py-1 font-semibold">경고</Badge>;
      case "info":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs px-3 py-1 font-semibold">정보</Badge>;
      case "debug":
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/50 text-xs px-3 py-1 font-semibold">디버그</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/50 text-xs px-3 py-1 font-semibold">알 수 없음</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "user":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs px-3 py-1 font-semibold">사용자</Badge>;
      case "system":
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/50 text-xs px-3 py-1 font-semibold">시스템</Badge>;
      case "security":
        return <Badge className="bg-red-500/20 text-red-300 border-red-400/50 text-xs px-3 py-1 font-semibold">보안</Badge>;
      case "performance":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 text-xs px-3 py-1 font-semibold">성능</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/50 text-xs px-3 py-1 font-semibold">기타</Badge>;
    }
  };

  // CSV 내보내기 함수
  const exportToCSV = () => {
    const csvData = [
      ['시간', '레벨', '유형', '메시지', '사용자 ID', 'IP 주소'],
      ...logs.map(log => [
        log.timestamp,
        log.level,
        log.type,
        log.message,
        log.userId || '',
        log.ip || ''
      ])
    ];

    const BOM = '\uFEFF';
    const csvContent = BOM + csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `시스템_로그_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('CSV 파일이 다운로드되었습니다.');
  };

  // JSON 내보내기 함수
  const exportToJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs,
      summary: {
        errors: logs.filter(log => log.level === "error").length,
        warnings: logs.filter(log => log.level === "warning").length,
        info: logs.filter(log => log.level === "info").length,
        userActivity: logs.filter(log => log.type === "user").length,
        systemLogs: logs.filter(log => log.type === "system").length,
        securityLogs: logs.filter(log => log.type === "security").length,
        performanceLogs: logs.filter(log => log.type === "performance").length
      }
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `시스템_로그_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('JSON 파일이 다운로드되었습니다.');
  };

  return (
    <AdminLayout currentPage="logs">
      {/* System Alert */}
      <div className="mb-6">
        <Alert className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/50 text-blue-100 backdrop-blur-sm">
          <Activity className="h-4 w-4 text-blue-300" />
          <AlertTitle className="text-blue-100 font-semibold">🔍 실시간 로그 모니터링</AlertTitle>
          <AlertDescription className="text-blue-200">
            시스템 활동과 사용자 행동을 실시간으로 모니터링하여 문제를 조기에 발견하고 대응하세요.
            <br />
            {isClient && lastUpdated && (
              <span className="text-blue-300 text-sm">
                마지막 업데이트: {lastUpdated.toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                시스템 로그
              </h1>
            </div>
            <p className="text-gray-100 text-lg">
              시스템 활동과 사용자 행동을 실시간으로 모니터링하여 문제를 조기에 발견하고 대응하세요.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={refreshData}
                    disabled={isLoading}
                    className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>로그 데이터를 새로고침합니다</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={createTestLog}
                    className="bg-yellow-800/50 border-yellow-600 text-yellow-100 hover:bg-yellow-700/50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    테스트 로그
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>테스트용 경고 로그를 생성합니다</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="relative group">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="p-2">
                  <button 
                    onClick={exportToCSV}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2 text-blue-400" />
                    CSV 다운로드
                  </button>
                  <button 
                    onClick={exportToJSON}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2 text-purple-400" />
                    JSON 데이터
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-100">
                <Bell className="w-5 h-5" />
                활성 알림 ({alerts.filter(alert => alert.alert_status === 'pending').length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.filter(alert => alert.alert_status === 'pending').slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-800/20 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-red-100 font-medium">{alert.log_message}</p>
                        <p className="text-red-300 text-sm">
                          {alert.log_level.toUpperCase()} • {alert.email_count}회 발송 • {new Date(alert.last_sent_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => window.open(`/admin/logs/acknowledge/${alert.id}`, '_blank')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      확인
                    </Button>
                  </div>
                ))}
                {alerts.filter(alert => alert.alert_status === 'pending').length > 3 && (
                  <p className="text-red-300 text-sm text-center">
                    +{alerts.filter(alert => alert.alert_status === 'pending').length - 3}개의 추가 알림
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">총 로그 수</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{logs.length}</div>
            <p className="text-xs text-blue-300 mt-1">오늘 생성된 로그</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-200">오류</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {logs.filter(log => log.level === "error").length}
            </div>
            <p className="text-xs text-red-300 mt-1">주의가 필요한 로그</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-200">경고</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {logs.filter(log => log.level === "warning").length}
            </div>
            <p className="text-xs text-yellow-300 mt-1">모니터링 필요</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-200">사용자 활동</CardTitle>
            <User className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {logs.filter(log => log.type === "user").length}
            </div>
            <p className="text-xs text-green-300 mt-1">사용자 행동 로그</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Filter className="w-5 h-5" />
              <span>필터 및 검색</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-100 mb-2 block">로그 레벨</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
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
                <label className="text-sm font-medium text-gray-100 mb-2 block">로그 유형</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
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
                <label className="text-sm font-medium text-gray-100 mb-2 block">사용자 ID</label>
                <Input 
                  placeholder="사용자 ID 입력..." 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-100 mb-2 block">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                  <Input 
                    placeholder="로그 메시지 검색..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <div className="mb-8">
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                로그 목록
              </CardTitle>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isLoading}
                        className="text-gray-300 border-gray-600 hover:bg-gray-700"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        새로고침
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>로그 목록 새로고침</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-white font-semibold w-24">레벨</TableHead>
                    <TableHead className="text-white font-semibold w-28">유형</TableHead>
                    <TableHead className="text-white font-semibold">메시지</TableHead>
                    <TableHead className="text-white font-semibold w-32">사용자</TableHead>
                    <TableHead className="text-white font-semibold w-32">IP</TableHead>
                    <TableHead className="text-white font-semibold w-40">시간</TableHead>
                    <TableHead className="text-white font-semibold w-24">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <div className="flex items-center space-x-2 min-w-0">
                          {getLevelIcon(log.level)}
                          <span className="text-sm whitespace-nowrap">
                            {getLevelBadge(log.level)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <span className="text-sm whitespace-nowrap">
                            {getTypeBadge(log.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm text-white truncate">{log.message}</p>
                          {log.details && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs text-gray-300 hover:text-gray-100">
                                상세 정보
                              </summary>
                              <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-2 rounded">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300 text-sm">
                          {log.userId || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300 text-sm">
                          {log.ip || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300 text-sm">
                          {log.timestamp}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-300 hover:text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Info className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>상세 정보</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-300 hover:text-green-400 hover:bg-green-500/10"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>로그 다운로드</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">총 {logs.length}개의 로그</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock3 className="w-4 h-4" />
            <span className="text-sm">실시간 업데이트</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToJSON}
            className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON 내보내기
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}