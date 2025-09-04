"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, Settings, Home, MessageSquare, History, User, PanelLeft, PanelRight } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LovableLayoutProps {
  children: React.ReactNode;
  onToggleRightPanel?: () => void;
  isRightPanelCollapsed?: boolean;
}

export default function LovableLayout({ children, onToggleRightPanel, isRightPanelCollapsed }: LovableLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "홈", href: "/", icon: Home },
    { name: "채팅", href: "/chat", icon: MessageSquare },
    { name: "히스토리", href: "/history", icon: History },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Lovable style dark */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/" className="md:hidden">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-shrink-0">
                <img 
                  src="/admate-logo.svg" 
                  alt="AdMate" 
                  className="h-6 w-auto"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* 패널 토글 버튼 */}
              {onToggleRightPanel && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleRightPanel}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-700"
                  title={isRightPanelCollapsed ? "우측 패널 펼치기" : "우측 패널 접기"}
                >
                  {isRightPanelCollapsed ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex text-white hover:bg-gray-700">
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* Mobile menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0 text-white hover:bg-gray-700">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 sm:w-80 bg-gray-800/95 backdrop-blur-md border-gray-700">
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="mr-3 w-5 h-5" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex items-center space-x-3 px-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-300">사용자</span>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Lovable style split layout */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
