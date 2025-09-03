"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, MessageSquare, Clock, Star, Download, Calendar } from "lucide-react";

export default function StatisticsPage() {
  // Dummy data for demonstration
  const timeRanges = [
    { value: "1d", label: "오늘" },
    { value: "7d", label: "이번 주" },
    { value: "30d", label: "이번 달" },
    { value: "90d", label: "3개월" },
    { value: "1y", label: "1년" },
  ];

  const selectedTimeRange = "7d";

  const overviewStats = {
    totalQuestions: 1247,
    activeUsers: 156,
    avgResponseTime: "2.3초",
    satisfactionRate: 87,
    totalDocuments: 45,
    indexedDocuments: 42,
    weeklyChange: {
      questions: 12,
      users: -3,
      responseTime: -8,
      satisfaction: 2,
    },
  };

  const userActivity = [
    { date: "월", questions: 45, users: 23, satisfaction: 85 },
    { date: "화", questions: 52, users: 28, satisfaction: 88 },
    { date: "수", questions: 38, users: 19, satisfaction: 82 },
    { date: "목", questions: 61, users: 31, satisfaction: 90 },
    { date: "금", questions: 49, users: 25, satisfaction: 86 },
    { date: "토", questions: 23, users: 12, satisfaction: 79 },
    { date: "일", questions: 18, users: 8, satisfaction: 75 },
  ];

  const topQuestions = [
    { question: "광고 정책 변경사항", count: 45, change: 12 },
    { question: "광고 계정 설정", count: 38, change: -5 },
    { question: "스토리 광고 가이드", count: 32, change: 8 },
    { question: "광고 예산 관리", count: 28, change: 3 },
    { question: "광고 승인 거부", count: 25, change: -2 },
  ];

  const userSegments = [
    { segment: "마케팅팀", users: 45, questions: 234, satisfaction: 89 },
    { segment: "퍼포먼스팀", users: 38, questions: 189, satisfaction: 85 },
    { segment: "운영팀", users: 32, questions: 156, satisfaction: 82 },
    { segment: "기타", users: 41, questions: 668, satisfaction: 88 },
  ];

  const documentStats = [
    { type: "PDF", count: 28, size: "45.2 MB", indexed: 26 },
    { type: "DOCX", count: 12, size: "18.7 MB", indexed: 11 },
    { type: "TXT", count: 5, size: "2.1 MB", indexed: 5 },
  ];

  const exportData = () => {
    console.log("Exporting statistics data...");
    // In a real app, this would generate and download a report
  };

  return (
    <AdminLayout currentPage="stats">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">사용 통계</h1>
            <p className="text-gray-600">
              시스템 사용 현황과 성과 지표를 분석하여 개선점을 파악하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 질문 수</CardTitle>
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {overviewStats.totalQuestions.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {overviewStats.weeklyChange.questions > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                overviewStats.weeklyChange.questions > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {overviewStats.weeklyChange.questions > 0 ? "+" : ""}
                {overviewStats.weeklyChange.questions}%
              </span>
              <span className="text-xs text-gray-500">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 사용자</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewStats.activeUsers}</div>
            <div className="flex items-center space-x-1 mt-1">
              {overviewStats.weeklyChange.users > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                overviewStats.weeklyChange.users > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {overviewStats.weeklyChange.users > 0 ? "+" : ""}
                {overviewStats.weeklyChange.users}%
              </span>
              <span className="text-xs text-gray-500">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 응답 시간</CardTitle>
            <Clock className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewStats.avgResponseTime}</div>
            <div className="flex items-center space-x-1 mt-1">
              {overviewStats.weeklyChange.responseTime < 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                overviewStats.weeklyChange.responseTime < 0 ? "text-green-600" : "text-red-600"
              }`}>
                {overviewStats.weeklyChange.responseTime < 0 ? "+" : ""}
                {Math.abs(overviewStats.weeklyChange.responseTime)}%
              </span>
              <span className="text-xs text-gray-500">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">만족도</CardTitle>
            <Star className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overviewStats.satisfactionRate}%</div>
            <div className="flex items-center space-x-1 mt-1">
              {overviewStats.weeklyChange.satisfaction > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                overviewStats.weeklyChange.satisfaction > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {overviewStats.weeklyChange.satisfaction > 0 ? "+" : ""}
                {overviewStats.weeklyChange.satisfaction}%
              </span>
              <span className="text-xs text-gray-500">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>주간 활동 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>요일별 질문 수</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary-600 rounded"></div>
                    <span>질문 수</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>사용자 수</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {userActivity.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-2">{day.date}</div>
                    <div className="space-y-1">
                      <div 
                        className="bg-primary-600 rounded-t"
                        style={{ height: `${(day.questions / 70) * 100}px` }}
                      ></div>
                      <div 
                        className="bg-green-600 rounded-b"
                        style={{ height: `${(day.users / 35) * 100}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {day.questions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Questions */}
        <Card>
          <CardHeader>
            <CardTitle>인기 질문 TOP 5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? "bg-yellow-100 text-yellow-800" :
                      index === 1 ? "bg-gray-100 text-gray-800" :
                      index === 2 ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.question}</p>
                      <p className="text-xs text-gray-500">{item.count}회 질문</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {item.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs ${
                      item.change > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {item.change > 0 ? "+" : ""}{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Segments and Document Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle>부서별 사용 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{segment.segment}</p>
                    <p className="text-sm text-gray-500">{segment.users}명</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{segment.questions}질문</p>
                    <p className="text-sm text-gray-500">{segment.satisfaction}% 만족</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>문서 유형별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentStats.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{doc.type}</Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.count}개</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{doc.indexed}개</p>
                    <p className="text-xs text-gray-500">인덱싱 완료</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>성능 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">99.2%</div>
              <p className="text-sm text-gray-600">시스템 가동률</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">2.3초</div>
              <p className="text-sm text-gray-600">평균 응답 시간</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">50명</div>
              <p className="text-sm text-gray-600">최대 동시 사용자</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">1.2GB</div>
              <p className="text-sm text-gray-600">벡터 인덱스 크기</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 내보내기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="w-6 h-6" />
              <span>CSV 내보내기</span>
              <span className="text-xs text-gray-500">엑셀에서 분석</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="w-6 h-6" />
              <span>PDF 리포트</span>
              <span className="text-xs text-gray-500">공식 문서용</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="w-6 h-6" />
              <span>JSON 데이터</span>
              <span className="text-xs text-gray-500">개발자용</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
