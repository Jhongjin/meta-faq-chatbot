"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import Statistics from "@/components/admin/Statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Dummy data for demonstration
  const systemStatus = {
    overall: "healthy",
    database: "connected",
    llm: "operational",
    vectorStore: "indexed",
    lastUpdate: "2분 전",
  };

  const recentAlerts = [
    {
      id: "1",
      type: "warning",
      message: "문서 인덱싱 대기 중인 파일이 3개 있습니다",
      timestamp: "5분 전",
      priority: "medium",
    },
    {
      id: "2",
      type: "info",
      message: "새로운 사용자 2명이 시스템에 접속했습니다",
      timestamp: "15분 전",
      priority: "low",
    },
    {
      id: "3",
      type: "success",
      message: "일일 백업이 성공적으로 완료되었습니다",
      timestamp: "1시간 전",
      priority: "low",
    },
  ];

  const quickActions = [
    {
      title: "문서 업로드",
      description: "새로운 정책 문서를 시스템에 추가",
      href: "/admin/docs",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-blue-600",
    },
    {
      title: "사용자 관리",
      description: "사용자 권한 및 접근 설정 관리",
      href: "/admin/users",
      icon: <Users className="w-6 h-6" />,
      color: "bg-green-600",
    },
    {
      title: "시스템 모니터링",
      description: "실시간 시스템 상태 및 성능 확인",
      href: "/admin/monitoring",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-purple-600",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "operational":
      case "indexed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "operational":
      case "indexed":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <AdminLayout currentPage="dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">관리자 대시보드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          시스템 전반의 상태를 모니터링하고 관리 작업을 수행하세요.
        </p>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 상태</CardTitle>
            {getStatusIcon(systemStatus.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {systemStatus.overall}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">시스템 전반 상태</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">데이터베이스</CardTitle>
            {getStatusIcon(systemStatus.database)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {systemStatus.database}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PostgreSQL 연결 상태</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">LLM 서비스</CardTitle>
            {getStatusIcon(systemStatus.llm)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {systemStatus.llm}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI 모델 응답 상태</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">벡터 저장소</CardTitle>
            {getStatusIcon(systemStatus.vectorStore)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {systemStatus.vectorStore}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pgvector 인덱싱 상태</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <div className="text-white">{action.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{action.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">최근 알림</h2>
          <Link href="/admin/alerts">
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">모든 알림 보기</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <Card key={alert.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{alert.timestamp}</span>
                      <Badge 
                        variant={
                          alert.priority === "high" ? "destructive" :
                          alert.priority === "medium" ? "secondary" :
                          "outline"
                        }
                        className="text-xs dark:border-gray-600 dark:text-gray-300"
                      >
                        {alert.priority === "high" ? "높음" :
                         alert.priority === "medium" ? "보통" : "낮음"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 dark:hover:bg-gray-700">
                    확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">사용 통계</h2>
        <Statistics />
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-white">
              <Clock className="w-5 h-5" />
              <span>시스템 정보</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">마지막 업데이트:</span>
              <span className="text-sm font-medium dark:text-white">{systemStatus.lastUpdate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">시스템 버전:</span>
              <span className="text-sm font-medium dark:text-white">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">데이터베이스 크기:</span>
              <span className="text-sm font-medium dark:text-white">2.4 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">인덱싱된 문서:</span>
              <span className="text-sm font-medium dark:text-white">1,247개</span>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-white">
              <TrendingUp className="w-5 h-5" />
              <span>성능 지표</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">평균 응답 시간:</span>
              <span className="text-sm font-medium dark:text-white">2.3초</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">동시 사용자:</span>
              <span className="text-sm font-medium dark:text-white">24명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">CPU 사용률:</span>
              <span className="text-sm font-medium dark:text-white">23%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">메모리 사용률:</span>
              <span className="text-sm font-medium dark:text-white">67%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
