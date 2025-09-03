"use client";

import { useState } from "react";
import { Menu, X, BarChart3, FileText, Upload, Settings, Users, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function AdminLayout({ children, currentPage = "dashboard" }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "대시보드", href: "/admin", icon: BarChart3, current: currentPage === "dashboard" },
    { name: "문서 관리", href: "/admin/docs", icon: FileText, current: currentPage === "docs" },
    { name: "통계", href: "/admin/stats", icon: Activity, current: currentPage === "stats" },
    { name: "로그", href: "/admin/logs", icon: Users, current: currentPage === "logs" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">관리자 대시보드</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                사용자 모드로 돌아가기
              </Link>
              <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">관</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">관리자</span>
                <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-300 border-r-2 border-red-600 dark:border-red-500"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* Admin info */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium">시스템 상태</p>
                <p className="mt-1">🟢 정상 운영 중</p>
                <p className="mt-1">마지막 업데이트: 방금 전</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden fixed top-20 left-4 z-50 bg-white dark:bg-gray-800 shadow-md dark:border dark:border-gray-700"
            >
              <Menu className="h-5 w-5 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 pt-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-300 border-r-2 border-red-600 dark:border-red-500"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="md:pl-64 flex-1">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
