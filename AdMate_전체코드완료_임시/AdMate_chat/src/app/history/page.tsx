"use client";

import { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Clock, Filter, Download, Trash2 } from "lucide-react";

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  isFavorite: boolean;
  helpful: boolean | null;
  sources: Array<{
    id: string;
    title: string;
    url?: string;
    updatedAt: string;
  }>;
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Dummy data for demonstration
  const historyData: HistoryItem[] = [
    {
      id: "1",
      question: "2024년 메타 광고 정책 변경사항이 있나요?",
      answer: "네, 2024년 1월부터 인스타그램 광고 정책이 일부 변경되었습니다. 주요 변경사항은 다음과 같습니다: 1) 광고 콘텐츠 가이드라인 강화, 2) 타겟팅 옵션 세분화, 3) 성과 측정 지표 추가. 자세한 내용은 공식 정책 문서를 참조하시기 바랍니다.",
      timestamp: "2024-01-15 14:30",
      isFavorite: true,
      helpful: true,
      sources: [
        { id: "1", title: "2024년 메타 광고 정책 가이드라인", url: "https://example.com/policy-2024", updatedAt: "2024-01-15" },
      ],
    },
    {
      id: "2",
      question: "페이스북 광고 계정 생성 시 필요한 서류는?",
      answer: "페이스북 광고 계정 생성 시에는 다음 서류가 필요합니다: 1) 사업자등록증 (개인사업자 또는 법인사업자), 2) 신분증 (운영자 본인), 3) 사업자명의 통장사본, 4) 광고 집행 승인서 (해당 시). 모든 서류는 최신 상태여야 하며, 스캔본도 허용됩니다.",
      timestamp: "2024-01-14 11:15",
      isFavorite: false,
      helpful: true,
      sources: [
        { id: "2", title: "페이스북 광고 계정 설정 가이드", url: "https://example.com/fb-ads-setup", updatedAt: "2024-01-10" },
      ],
    },
    {
      id: "3",
      question: "스토리 광고의 최적 크기는 어떻게 되나요?",
      answer: "인스타그램 스토리 광고는 1080x1920 픽셀(9:16 비율)을 권장합니다. 최소 해상도는 600x1067 픽셀이며, 파일 크기는 30MB 이하여야 합니다. 세로형 비디오의 경우 15초 이하가 최적이며, 이미지는 JPG 또는 PNG 형식을 지원합니다.",
      timestamp: "2024-01-13 16:45",
      isFavorite: true,
      helpful: false,
      sources: [
        { id: "3", title: "인스타그램 스토리 광고 가이드", url: "https://example.com/ig-story-ads", updatedAt: "2024-01-08" },
      ],
    },
    {
      id: "4",
      question: "광고 예산 설정 시 주의사항은?",
      answer: "광고 예산 설정 시 다음 사항을 고려해야 합니다: 1) 일일 예산과 총 예산을 명확히 구분, 2) 계절성과 이벤트 기간을 고려한 예산 조정, 3) A/B 테스트를 위한 예산 분배, 4) 성과 지표에 따른 예산 재분배. 예산 부족 시 캠페인이 자동으로 중단되므로 여유 있게 설정하는 것이 좋습니다.",
      timestamp: "2024-01-12 09:20",
      isFavorite: false,
      helpful: true,
      sources: [
        { id: "4", title: "메타 광고 예산 관리 가이드", url: "https://example.com/budget-guide", updatedAt: "2024-01-05" },
      ],
    },
    {
      id: "5",
      question: "광고 승인 거부 시 대응 방법은?",
      answer: "광고 승인이 거부된 경우 다음 단계를 따르세요: 1) 거부 사유 확인 (이메일 또는 광고 관리자에서), 2) 정책 위반 내용 파악 및 수정, 3) 수정된 광고 재제출, 4) 필요시 정책 위반 항목에 대한 추가 정보 제공. 반복적인 거부 시 광고 정책팀과 상담을 권장합니다.",
      timestamp: "2024-01-11 13:10",
      isFavorite: false,
      helpful: true,
      sources: [
        { id: "5", title: "광고 승인 거부 대응 가이드", url: "https://example.com/rejection-guide", updatedAt: "2024-01-03" },
      ],
    },
  ];

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "favorites") return matchesSearch && item.isFavorite;
    if (activeTab === "helpful") return matchesSearch && item.helpful === true;
    if (activeTab === "unhelpful") return matchesSearch && item.helpful === false;
    
    return matchesSearch;
  });

  const toggleFavorite = (id: string) => {
    // In a real app, this would update the database
    console.log("Toggle favorite for item:", id);
  };

  const deleteItem = (id: string) => {
    // In a real app, this would remove from database
    console.log("Delete item:", id);
  };

  const exportHistory = () => {
    // In a real app, this would export to CSV/PDF
    console.log("Export history");
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">질문 히스토리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          이전에 질문한 내용과 AI 답변을 확인하고, 자주 사용하는 답변을 즐겨찾기로 저장하세요.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              placeholder="질문이나 답변 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
            <Button variant="outline" size="sm" onClick={exportHistory} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5 dark:bg-gray-800">
          <TabsTrigger value="all" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">전체 ({historyData.length})</TabsTrigger>
          <TabsTrigger value="favorites" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            즐겨찾기 ({historyData.filter(item => item.isFavorite).length})
          </TabsTrigger>
          <TabsTrigger value="helpful" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            도움됨 ({historyData.filter(item => item.helpful === true).length})
          </TabsTrigger>
          <TabsTrigger value="unhelpful" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            도움 안됨 ({historyData.filter(item => item.helpful === false).length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">최근</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* History List */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400">
                다른 검색어를 사용하거나 필터를 조정해보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {item.answer}
                    </p>
                    
                    {/* Sources */}
                    {item.sources.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">출처:</p>
                        <div className="space-y-2">
                          {item.sources.map((source) => (
                            <div key={source.id} className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">•</span>
                              <span className="text-gray-700 dark:text-gray-300">{source.title}</span>
                              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                {source.updatedAt}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(item.id)}
                      className={item.isFavorite ? "text-yellow-600 dark:text-yellow-400" : "text-gray-400 dark:text-gray-500"}
                    >
                      <Star className={`w-5 h-5 ${item.isFavorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.helpful === true ? (
                        <span className="text-green-600 dark:text-green-400">👍 도움됨</span>
                      ) : item.helpful === false ? (
                        <span className="text-red-600 dark:text-red-400">👎 도움 안됨</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">피드백 없음</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      다시 질문하기
                    </Button>
                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      공유하기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled className="dark:border-gray-600 dark:text-gray-500">
              이전
            </Button>
            <div className="flex items-center space-x-1">
              <Button variant="default" size="sm">1</Button>
              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">2</Button>
              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">3</Button>
            </div>
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              다음
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
