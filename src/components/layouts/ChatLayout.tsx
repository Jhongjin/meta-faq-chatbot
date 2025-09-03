"use client";

import { useState } from "react";
import { ArrowLeft, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "홈", href: "/", icon: "🏠" },
    { name: "채팅", href: "/chat", icon: "💬" },
    { name: "히스토리", href: "/history", icon: "📚" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized for chat */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="md:hidden">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-shrink-0">
                <h1 className="text-lg font-semibold text-gray-900">메타 광고 FAQ 챗봇</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
              
              {/* Mobile menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center space-x-2 px-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">사</span>
                      </div>
                      <span className="text-sm text-gray-700">사용자</span>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Full width for chat */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
