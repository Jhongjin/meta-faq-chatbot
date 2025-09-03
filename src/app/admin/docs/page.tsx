"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import DocumentUpload from "@/components/admin/DocumentUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, Download, Trash2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

export default function DocumentManagementPage() {
  // Dummy data for demonstration
  const documents = [
    {
      id: "1",
      name: "2024년 메타 광고 정책 가이드라인.pdf",
      size: "2.4 MB",
      type: "PDF",
      status: "indexed",
      uploadedAt: "2024-01-15 14:30",
      updatedAt: "2024-01-15 14:30",
      indexedAt: "2024-01-15 14:35",
      pages: 45,
      source: "manual",
    },
    {
      id: "2",
      name: "인스타그램 광고 설정 매뉴얼.docx",
      size: "1.8 MB",
      type: "DOCX",
      status: "indexed",
      uploadedAt: "2024-01-14 11:15",
      updatedAt: "2024-01-14 11:15",
      indexedAt: "2024-01-14 11:20",
      pages: 32,
      source: "manual",
    },
    {
      id: "3",
      name: "페이스북 광고 계정 설정 가이드.pdf",
      size: "3.2 MB",
      type: "PDF",
      status: "indexed",
      uploadedAt: "2024-01-13 16:45",
      updatedAt: "2024-01-13 16:45",
      indexedAt: "2024-01-13 16:50",
      pages: 28,
      source: "manual",
    },
    {
      id: "4",
      name: "광고 정책 변경사항 2024년 1월.txt",
      size: "156 KB",
      type: "TXT",
      status: "indexed",
      uploadedAt: "2024-01-12 09:20",
      updatedAt: "2024-01-12 09:20",
      indexedAt: "2024-01-12 09:22",
      pages: 3,
      source: "manual",
    },
    {
      id: "5",
      name: "스토리 광고 가이드라인.pdf",
      size: "1.5 MB",
      type: "PDF",
      status: "indexing",
      uploadedAt: "2024-01-15 16:00",
      updatedAt: "2024-01-15 16:00",
      indexedAt: null,
      pages: 18,
      source: "manual",
    },
    {
      id: "6",
      name: "광고 예산 관리 가이드.docx",
      size: "2.1 MB",
      type: "DOCX",
      status: "error",
      uploadedAt: "2024-01-15 15:30",
      updatedAt: "2024-01-15 15:30",
      indexedAt: null,
      pages: 25,
      source: "manual",
    },
  ];

  const urls = [
    {
      id: "1",
      url: "https://developers.facebook.com/docs/marketing-api/",
      title: "Facebook Marketing API 문서",
      status: "indexed",
      lastCrawled: "2024-01-15 10:00",
      indexedAt: "2024-01-15 10:05",
      source: "url",
    },
    {
      id: "2",
      url: "https://business.instagram.com/advertising/",
      title: "Instagram 광고 가이드",
      status: "indexed",
      lastCrawled: "2024-01-14 14:00",
      indexedAt: "2024-01-14 14:05",
      source: "url",
    },
    {
      id: "3",
      url: "https://www.facebook.com/business/help/",
      title: "Facebook 비즈니스 도움말",
      status: "crawling",
      lastCrawled: "2024-01-15 16:30",
      indexedAt: null,
      source: "url",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "indexed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "indexing":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "crawling":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "indexed":
        return <Badge variant="default" className="bg-green-100 text-green-800">인덱싱 완료</Badge>;
      case "indexing":
        return <Badge variant="secondary">인덱싱 중</Badge>;
      case "crawling":
        return <Badge variant="secondary">크롤링 중</Badge>;
      case "error":
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const handleUpload = (files: File[], urls: string[]) => {
    console.log("Upload files:", files);
    console.log("Upload URLs:", urls);
    // In a real app, this would handle the upload
  };

  const handleDelete = (id: string, type: "document" | "url") => {
    console.log("Delete", type, "with ID:", id);
    // In a real app, this would remove the item
  };

  const handleReindex = (id: string) => {
    console.log("Reindex document with ID:", id);
    // In a real app, this would trigger reindexing
  };

  return (
    <AdminLayout currentPage="docs">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">문서 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          정책 문서와 가이드라인을 업로드하고 관리하여 AI 챗봇의 지식 베이스를 확장하세요.
        </p>
      </div>

      {/* Document Upload */}
      <div className="mb-8">
        <DocumentUpload onUpload={handleUpload} />
      </div>

      {/* Documents List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">업로드된 문서</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="문서 검색..."
                className="pl-10 w-64 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</h3>
                        {getStatusIcon(doc.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{doc.size}</span>
                        <span>{doc.type}</span>
                        <span>{doc.pages}페이지</span>
                        <span>업로드: {doc.uploadedAt}</span>
                        {doc.indexedAt && <span>인덱싱: {doc.indexedAt}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReindex(doc.id)}
                      disabled={doc.status === "indexing"}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id, "document")}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* URLs List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">크롤링된 URL</h2>
          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            모든 URL 새로고침
          </Button>
        </div>

        <div className="space-y-4">
          {urls.map((url) => (
            <Card key={url.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{url.title}</h3>
                        {getStatusIcon(url.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          {url.url}
                        </span>
                        <span>마지막 크롤링: {url.lastCrawled}</span>
                        {url.indexedAt && <span>인덱싱: {url.indexedAt}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(url.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(url.url, "_blank")}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(url.id, "url")}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">총 문서 수</CardTitle>
            <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">업로드된 문서</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">인덱싱 완료</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {documents.filter(d => d.status === "indexed").length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">처리 완료</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">총 URL</CardTitle>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{urls.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">크롤링된 URL</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
