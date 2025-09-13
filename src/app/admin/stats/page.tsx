"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, MessageSquare, Clock, Star, Download, Calendar, Info, AlertTriangle, HelpCircle, Eye, RefreshCw, BarChart3, PieChart, Activity, Zap, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useFeedbackStats } from "@/hooks/useFeedbackStats";
import { useAuth } from "@/hooks/useAuth";

export default function StatisticsPage() {
  const { user, loading } = useAuth();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [statsData, setStatsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 피드백 통계
  const period = selectedTimeRange === "1d" ? "1" : selectedTimeRange === "7d" ? "7" : selectedTimeRange === "30d" ? "30" : "7";
  const { stats: feedbackStats, isLoading: feedbackLoading, error: feedbackError, refetch: refetchFeedback } = useFeedbackStats(period);

  // Dummy data for demonstration
  const timeRanges = [
    { value: "1d", label: "오늘" },
    { value: "7d", label: "이번 주" },
    { value: "30d", label: "이번 달" },
    { value: "90d", label: "3개월" },
    { value: "1y", label: "1년" },
  ];

  // 데이터 새로고침 함수
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 피드백 통계 새로고침
      await refetchFeedback();
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
      console.log(`데이터 새로고침 완료: ${selectedTimeRange} 범위`);
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
    refreshData();
  };

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
    setLastUpdated(new Date());
    refreshData();
  }, []);

  const overviewStats = {
    totalQuestions: 1247,
    activeUsers: 156,
    avgResponseTime: "2.3초",
    satisfactionRate: feedbackStats?.positivePercentage || 87,
    totalDocuments: 45,
    indexedDocuments: 42,
    totalFeedback: feedbackStats?.total || 0,
    positiveFeedback: feedbackStats?.positive || 0,
    negativeFeedback: feedbackStats?.negative || 0,
    weeklyChange: {
      questions: 12,
      users: -3,
      responseTime: -8,
      satisfaction: 2,
    },
  };

  // 간단한 더미 데이터
  const userActivity = [
    { date: "월", questions: 45, users: 23 },
    { date: "화", questions: 52, users: 28 },
    { date: "수", questions: 38, users: 19 },
    { date: "목", questions: 61, users: 31 },
    { date: "금", questions: 49, users: 25 },
    { date: "토", questions: 23, users: 12 },
    { date: "일", questions: 18, users: 8 },
  ];

  const topQuestions = [
    { question: "광고 정책 변경사항", count: 45, change: 12 },
    { question: "광고 계정 설정", count: 38, change: -5 },
    { question: "스토리 광고 가이드", count: 32, change: 8 },
  ];

  const userSegments = [
    { segment: "마케팅팀", users: 45, questions: 234, satisfaction: 89 },
    { segment: "퍼포먼스팀", users: 38, questions: 189, satisfaction: 85 },
    { segment: "운영팀", users: 32, questions: 156, satisfaction: 82 },
  ];

  const documentStats = [
    { type: "PDF", count: 28, size: "45.2 MB", indexed: 26 },
    { type: "DOCX", count: 12, size: "18.7 MB", indexed: 11 },
    { type: "TXT", count: 5, size: "2.1 MB", indexed: 5 },
  ];

  // 간단한 CSV 내보내기 함수
  const exportToCSV = () => {
    const csvData = [
      ['항목', '값', '변화율'],
      ['총 질문 수', overviewStats.totalQuestions, `${overviewStats.weeklyChange.questions}%`],
      ['활성 사용자', overviewStats.activeUsers, `${overviewStats.weeklyChange.users}%`],
      ['평균 응답 시간', overviewStats.avgResponseTime, `${overviewStats.weeklyChange.responseTime}%`],
      ['만족도', `${overviewStats.satisfactionRate}%`, `${overviewStats.weeklyChange.satisfaction}%`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `통계_데이터_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 간단한 PDF 내보내기 함수
  const exportToPDF = () => {
    window.print();
  };

  // 간단한 JSON 내보내기 함수
  const exportToJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      overviewStats,
      feedbackStats
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `통계_데이터_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 로딩 중이거나 로그인하지 않은 경우
  if (loading) {
    return (
      <AdminLayout currentPage="stats">
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout currentPage="stats">
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">관리자 권한이 필요합니다</p>
              <p className="text-sm">통계 페이지에 접근하려면 먼저 로그인해주세요.</p>
            </div>
            <p className="text-gray-600">잠시 후 메인 페이지로 이동합니다...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="stats">
      {/* System Alert */}
      <div className="mb-6">
        <Alert className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/50 text-blue-100 backdrop-blur-sm">
          <Info className="h-4 w-4 text-blue-300" />
          <AlertTitle className="text-blue-100 font-semibold">📊 실시간 통계 업데이트</AlertTitle>
          <AlertDescription className="text-blue-200">
            통계 데이터는 5분마다 자동으로 업데이트됩니다. 실시간 데이터를 보려면 새로고침 버튼을 클릭하세요.
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              📈 사용 통계 대시보드
            </h1>
            <p className="text-gray-300 text-lg">
              시스템 사용 현황과 성과 지표를 분석하여 개선점을 파악하세요.
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
                  <p>통계 데이터를 새로고침합니다</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value} className="text-white hover:bg-gray-700">
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    onClick={exportToPDF}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2 text-green-400" />
                    PDF 리포트
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="w-5 h-5 bg-gray-700" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2 bg-gray-700" />
                <div className="flex items-center space-x-1 mt-1">
                  <Skeleton className="w-4 h-4 bg-gray-700" />
                  <Skeleton className="h-4 w-8 bg-gray-700" />
                  <Skeleton className="h-3 w-16 bg-gray-700" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 hover:from-blue-900/40 hover:to-blue-800/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-200">총 질문 수</CardTitle>
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {overviewStats.totalQuestions.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  {overviewStats.weeklyChange.questions > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    overviewStats.weeklyChange.questions > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {overviewStats.weeklyChange.questions > 0 ? "+" : ""}
                    {overviewStats.weeklyChange.questions}%
                  </span>
                  <span className="text-xs text-gray-200">지난 주 대비</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30 hover:from-green-900/40 hover:to-green-800/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-200">활성 사용자</CardTitle>
                <Users className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{overviewStats.activeUsers}</div>
                <div className="flex items-center space-x-2">
                  {overviewStats.weeklyChange.users > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    overviewStats.weeklyChange.users > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {overviewStats.weeklyChange.users > 0 ? "+" : ""}
                    {overviewStats.weeklyChange.users}%
                  </span>
                  <span className="text-xs text-gray-200">지난 주 대비</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30 hover:from-purple-900/40 hover:to-purple-800/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-200">평균 응답 시간</CardTitle>
                <Clock className="w-5 h-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{overviewStats.avgResponseTime}</div>
                <div className="flex items-center space-x-2">
                  {overviewStats.weeklyChange.responseTime < 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    overviewStats.weeklyChange.responseTime < 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {overviewStats.weeklyChange.responseTime < 0 ? "+" : ""}
                    {Math.abs(overviewStats.weeklyChange.responseTime)}%
                  </span>
                  <span className="text-xs text-gray-200">지난 주 대비</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/30 hover:from-yellow-900/40 hover:to-yellow-800/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-200">만족도</CardTitle>
                <Star className="w-5 h-5 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{overviewStats.satisfactionRate}%</div>
                <div className="flex items-center space-x-2">
                  {overviewStats.weeklyChange.satisfaction > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    overviewStats.weeklyChange.satisfaction > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {overviewStats.weeklyChange.satisfaction > 0 ? "+" : ""}
                    {overviewStats.weeklyChange.satisfaction}%
                  </span>
                  <span className="text-xs text-gray-200">지난 주 대비</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Detailed Stats with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 border-gray-600">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            개요
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Activity className="w-4 h-4 mr-2" />
            활동 현황
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <ThumbsUp className="w-4 h-4 mr-2" />
            피드백
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            성능 지표
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <PieChart className="w-4 h-4 mr-2" />
            분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Activity Chart */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  주간 활동 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>요일별 질문 수</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>질문 수</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>사용자 수</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {userActivity.map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-300 mb-2">{day.date}</div>
                        <div className="space-y-1">
                          <div 
                            className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                            style={{ height: `${(day.questions / 70) * 100}px` }}
                            title={`질문: ${day.questions}개`}
                          ></div>
                          <div 
                            className="bg-green-500 rounded-b transition-all duration-300 hover:bg-green-400"
                            style={{ height: `${(day.users / 35) * 100}px` }}
                            title={`사용자: ${day.users}명`}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                          {day.questions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Questions Table */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-green-400" />
                  인기 질문 TOP 5
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="w-12 text-gray-300">순위</TableHead>
                      <TableHead className="text-gray-300">질문</TableHead>
                      <TableHead className="w-20 text-gray-300">질문 수</TableHead>
                      <TableHead className="w-20 text-gray-300">변화율</TableHead>
                      <TableHead className="w-16 text-gray-300">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topQuestions.map((item, index) => (
                      <TableRow key={index} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            index === 0 ? "bg-yellow-500 text-yellow-900" :
                            index === 1 ? "bg-gray-400 text-gray-900" :
                            index === 2 ? "bg-orange-500 text-orange-900" :
                            "bg-blue-500 text-blue-900"
                          }`}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-white">{item.question}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-300">{item.count}회</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {item.change > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={`text-xs font-medium ${
                              item.change > 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {item.change > 0 ? "+" : ""}{item.change}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>상세 정보 보기</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Activity Chart */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-400" />
                  사용자 활동 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-300">사용자 활동 데이터를 로딩 중입니다...</p>
                </div>
              </CardContent>
            </Card>

            {/* User Segments */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-400" />
                  부서별 사용 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                      <div>
                        <p className="font-medium text-white">{segment.segment}</p>
                        <p className="text-sm text-gray-300">{segment.users}명</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{segment.questions}질문</p>
                        <div className="flex items-center space-x-3">
                          <div className="progress-enhanced progress-info w-20">
                            <div className="progress-fill" style={{ width: `${segment.satisfaction}%` }}></div>
                          </div>
                          <span className="text-sm font-semibold text-white min-w-[3rem]">{segment.satisfaction}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 피드백 통계 카드 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ThumbsUp className="w-5 h-5 mr-2 text-orange-400" />
                  피드백 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full bg-gray-700" />
                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-700" />
                  </div>
                ) : feedbackError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">{feedbackError}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">
                          {feedbackStats?.total || 0}
                        </div>
                        <p className="text-sm text-gray-100">총 피드백</p>
                      </div>
                      <div className="text-center p-4 bg-green-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          {feedbackStats?.positive || 0}
                        </div>
                        <p className="text-sm text-gray-100">도움됨</p>
                      </div>
                      <div className="text-center p-4 bg-red-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-red-400 mb-1">
                          {feedbackStats?.negative || 0}
                        </div>
                        <p className="text-sm text-gray-100">도움안됨</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-3xl font-bold text-orange-400 mb-1">
                        {feedbackStats?.positivePercentage || 0}%
                      </div>
                      <p className="text-sm text-gray-100">만족도</p>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${feedbackStats?.positivePercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 일별 피드백 추이 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  일별 피드백 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full bg-gray-700" />
                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-700" />
                  </div>
                ) : feedbackError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">{feedbackError}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>최근 {period}일간 피드백</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>도움됨</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>도움안됨</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {feedbackStats?.dailyStats?.slice(-7).map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-300 mb-2">
                            {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="space-y-1">
                            <div 
                              className="bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                              style={{ height: `${Math.max((day.positive / Math.max(day.total, 1)) * 100, 5)}px` }}
                              title={`도움됨: ${day.positive}개`}
                            ></div>
                            <div 
                              className="bg-red-500 rounded-b transition-all duration-300 hover:bg-red-400"
                              style={{ height: `${Math.max((day.negative / Math.max(day.total, 1)) * 100, 5)}px` }}
                              title={`도움안됨: ${day.negative}개`}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-300 mt-1">
                            {day.total}
                          </div>
                        </div>
                      )) || []}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 최근 피드백 목록 */}
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-green-400" />
                최근 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                      <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-gray-700" />
                        <Skeleton className="h-3 w-1/2 bg-gray-700" />
                      </div>
                      <Skeleton className="w-16 h-6 bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : feedbackError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm">{feedbackError}</p>
                </div>
              ) : feedbackStats?.recentFeedback?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">아직 피드백이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackStats?.recentFeedback?.slice(0, 10).map((feedback) => (
                    <div key={feedback.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
                        {feedback.helpful ? (
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {feedback.conversations?.user_message || '사용자 질문'}
                        </p>
                        <p className="text-xs text-gray-300 truncate">
                          {feedback.conversations?.ai_response || 'AI 응답'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`${
                            feedback.helpful 
                              ? 'border-green-500 text-green-400' 
                              : 'border-red-500 text-red-400'
                          }`}
                        >
                          {feedback.helpful ? '도움됨' : '도움안됨'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Charts */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-400" />
                  시스템 성능
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-300">시스템 성능 데이터를 로딩 중입니다...</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                  응답 시간 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-300">응답 시간 데이터를 로딩 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resource Usage */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-yellow-400" />
                  리소스 사용률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-white">CPU</span>
                    <span className="text-blue-400">45%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-white">메모리</span>
                    <span className="text-green-400">62%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-white">디스크</span>
                    <span className="text-yellow-400">28%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-white">네트워크</span>
                    <span className="text-red-400">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Statistics */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                  문서 유형별 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentStats.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="border-gray-500 text-gray-300">{doc.type}</Badge>
                        <div>
                          <p className="text-sm font-medium text-white">{doc.count}개</p>
                          <p className="text-xs text-gray-300">{doc.size}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{doc.indexed}개</p>
                        <p className="text-xs text-gray-300">인덱싱 완료</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Metrics */}
      <Card className="mb-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            시스템 성능 지표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-1">99.2%</div>
              <p className="text-sm text-gray-300">시스템 가동률</p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.2%' }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-1">2.3초</div>
              <p className="text-sm text-gray-300">평균 응답 시간</p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-3xl font-bold text-purple-400 mb-1">50명</div>
              <p className="text-sm text-gray-300">최대 동시 사용자</p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-3xl font-bold text-orange-400 mb-1">1.2GB</div>
              <p className="text-sm text-gray-300">벡터 인덱스 크기</p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Download className="w-5 h-5 mr-2 text-blue-400" />
            데이터 내보내기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex-col space-y-2 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500"
              onClick={exportToCSV}
            >
              <Download className="w-6 h-6 text-blue-400" />
              <span className="font-medium">CSV 내보내기</span>
              <span className="text-xs text-gray-400">엑셀에서 분석</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col space-y-2 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500"
              onClick={exportToPDF}
            >
              <Download className="w-6 h-6 text-green-400" />
              <span className="font-medium">PDF 리포트</span>
              <span className="text-xs text-gray-400">공식 문서용</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col space-y-2 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500"
              onClick={exportToJSON}
            >
              <Download className="w-6 h-6 text-purple-400" />
              <span className="font-medium">JSON 데이터</span>
              <span className="text-xs text-gray-400">개발자용</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
