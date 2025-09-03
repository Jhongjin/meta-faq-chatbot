"use client";

import { TrendingUp, TrendingDown, Users, MessageSquare, Clock, Star, Upload, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, change, icon, description }: StatCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 mt-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {isPositive ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">지난 주 대비</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ChartData {
  date: string;
  questions: number;
  users: number;
  satisfaction: number;
}

export default function Statistics() {
  // Dummy data for demonstration
  const stats = {
    totalQuestions: 1247,
    activeUsers: 156,
    avgResponseTime: "2.3초",
    satisfactionRate: 87,
    weeklyChange: {
      questions: 12,
      users: -3,
      responseTime: -8,
      satisfaction: 2,
    },
  };

  const chartData: ChartData[] = [
    { date: "월", questions: 45, users: 23, satisfaction: 85 },
    { date: "화", questions: 52, users: 28, satisfaction: 88 },
    { date: "수", questions: 38, users: 19, satisfaction: 82 },
    { date: "목", questions: 61, users: 31, satisfaction: 90 },
    { date: "금", questions: 49, users: 25, satisfaction: 86 },
    { date: "토", questions: 23, users: 12, satisfaction: 79 },
    { date: "일", questions: 18, users: 8, satisfaction: 75 },
  ];

  const recentActivity = [
    { type: "질문", content: "광고 정책 변경사항 문의", time: "2분 전", user: "김마케팅" },
    { type: "문서 업로드", content: "2024년 Q4 광고 가이드라인.pdf", time: "15분 전", user: "관리자" },
    { type: "피드백", content: "답변 품질 개선 요청", time: "1시간 전", user: "이퍼포먼스" },
    { type: "질문", content: "인스타그램 광고 설정 방법", time: "2시간 전", user: "박운영" },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 질문 수"
          value={stats.totalQuestions.toLocaleString()}
          change={stats.weeklyChange.questions}
          icon={<MessageSquare className="w-5 h-5" />}
          description="이번 주 12% 증가"
        />
        <StatCard
          title="활성 사용자"
          value={stats.activeUsers}
          change={stats.weeklyChange.users}
          icon={<Users className="w-5 h-5" />}
          description="이번 주 3명 감소"
        />
        <StatCard
          title="평균 응답 시간"
          value={stats.avgResponseTime}
          change={stats.weeklyChange.responseTime}
          icon={<Clock className="w-5 h-5" />}
          description="이번 주 8% 개선"
        />
        <StatCard
          title="만족도"
          value={`${stats.satisfactionRate}%`}
          change={stats.weeklyChange.satisfaction}
          icon={<Star className="w-5 h-5" />}
          description="이번 주 2% 증가"
        />
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>주간 사용 현황</CardTitle>
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
              {chartData.map((day, index) => (
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Badge 
                  variant={
                    activity.type === "질문" ? "default" :
                    activity.type === "문서 업로드" ? "secondary" :
                    "outline"
                  }
                  className="text-xs"
                >
                  {activity.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.content}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium text-blue-900 mb-1">문서 업로드</h3>
              <p className="text-sm text-blue-700">새 정책 문서 추가</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium text-green-900 mb-1">사용자 관리</h3>
              <p className="text-sm text-green-700">접근 권한 설정</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium text-purple-900 mb-1">상세 분석</h3>
              <p className="text-sm text-purple-700">사용 패턴 분석</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
