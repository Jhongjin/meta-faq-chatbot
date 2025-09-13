"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import DocumentUpload from "@/components/admin/DocumentUpload";
import HybridCrawlingManager from "@/components/admin/HybridCrawlingManager";
import GroupedDocumentList from "@/components/admin/GroupedDocumentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, FileText, Calendar, Download, Trash2, RefreshCw, CheckCircle, AlertTriangle, Filter, SortAsc, MoreHorizontal, Eye, Edit, Archive, ExternalLink, Link, Globe, Upload, Info, HelpCircle, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentGroupingService, DocumentGroup, GroupedDocument } from "@/lib/services/DocumentGroupingService";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  url?: string;
}

interface DocumentStats {
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
}

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    indexedDocuments: 0,
    totalChunks: 0,
    totalEmbeddings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // 탭 변경 시 필터 초기화
    setFilterType('all');
    setFilterStatus('all');
    setSearchQuery('');
  };
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [sortField, setSortField] = useState<keyof Document>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  // 문서 다운로드 함수
  const handleDownloadDocument = async (documentId: string, documentTitle: string) => {
    setActionLoading(prev => ({ ...prev, [`${documentId}_download`]: true }));
    try {
      const response = await fetch(`/api/admin/document-actions?action=download&documentId=${documentId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '다운로드에 실패했습니다.');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentTitle;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "다운로드 완료",
        description: "문서가 성공적으로 다운로드되었습니다.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: `다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`${documentId}_download`];
        return newState;
      });
    }
  };

  // 문서 미리보기 함수
  const handlePreviewDocument = async (documentId: string) => {
    setActionLoading(prev => ({ ...prev, [`${documentId}_preview`]: true }));
    try {
      const response = await fetch(`/api/admin/document-actions?action=preview&documentId=${documentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '미리보기에 실패했습니다.');
      }

      // 미리보기 모달 표시 (간단한 alert로 구현)
      const data = result.data;
      let previewText = `제목: ${data.title}\n타입: ${data.type}\n상태: ${data.status}\n청크 수: ${data.chunk_count}\n생성일: ${new Date(data.created_at).toLocaleString()}`;
      
      if (data.preview) {
        previewText += `\n\n미리보기:\n${data.preview}`;
      }

      alert(previewText);
    } catch (error) {
      console.error('미리보기 오류:', error);
      toast({
        title: "미리보기 실패",
        description: `미리보기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`${documentId}_preview`];
        return newState;
      });
    }
  };

  // 문서 재인덱싱 함수
  const handleReindexDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`"${documentTitle}" 문서를 재인덱싱하시겠습니까?\n\n기존 인덱스가 삭제되고 새로 생성됩니다.`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`${documentId}_reindex`]: true }));
    try {
      console.log(`🔄 재인덱싱 시작: ${documentTitle} (${documentId})`);
      
      const response = await fetch(`/api/admin/document-actions?action=reindex&documentId=${documentId}`);
      const result = await response.json();
      console.log('재인덱싱 응답:', result);

      if (!response.ok) {
        throw new Error(result.error || '재인덱싱에 실패했습니다.');
      }

      toast({
        title: "재인덱싱 완료",
        description: `"${documentTitle}" 문서의 재인덱싱이 완료되었습니다.`,
        variant: "default",
        duration: 3000,
      });

      // 문서 목록 새로고침
      await loadDocuments();
    } catch (error) {
      console.error('재인덱싱 오류:', error);
      toast({
        title: "재인덱싱 실패",
        description: `재인덱싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`${documentId}_reindex`];
        return newState;
      });
    }
  };

  // 문서 삭제 함수
  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`"${documentTitle}" 문서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 임베딩 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    setDeletingDocument(documentId);
    try {
      const response = await fetch(`/api/admin/upload?documentId=${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '문서 삭제에 실패했습니다.');
      }

      // 성공 메시지 표시
      toast({
        title: "문서 삭제 완료",
        description: `문서가 성공적으로 삭제되었습니다. (청크: ${result.data.deletedChunks}개, 임베딩: ${result.data.deletedEmbeddings}개)`,
        variant: "default",
        duration: 3000,
      });
      
      // 문서 목록 새로고침
      await loadDocuments();
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: `문서 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setDeletingDocument(null);
    }
  };

  // 필터링 및 정렬된 문서 목록
  const getFilteredAndSortedDocuments = () => {
    // 활성 탭에 따라 필터링
    let filtered = documents;
    
    if (activeTab === 'upload') {
      // 문서 업로드 탭: 파일 타입만 (pdf, docx, txt)
      filtered = documents.filter(doc => 
        doc.type === 'pdf' || doc.type === 'docx' || doc.type === 'txt'
      );
    } else if (activeTab === 'crawling') {
      // URL 크롤링 탭: URL 타입만
      filtered = documents.filter(doc => doc.type === 'url');
    }

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // null/undefined 체크
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // 탭별 통계 계산
  const getTabStats = () => {
    if (activeTab === 'upload') {
      // 파일 업로드 탭: PDF, DOCX, TXT 파일만 카운트
      const fileDocuments = documents.filter(doc => 
        doc.type === 'pdf' || doc.type === 'docx' || doc.type === 'txt'
      );
      return {
        total: fileDocuments.length,
        completed: fileDocuments.filter(doc => doc.status === 'completed' || doc.status === 'indexed').length,
        pending: fileDocuments.filter(doc => doc.status === 'pending').length,
        processing: fileDocuments.filter(doc => doc.status === 'processing').length
      };
    } else if (activeTab === 'crawling') {
      // URL 크롤링 탭: URL 타입만 카운트
      const urlDocuments = documents.filter(doc => doc.type === 'url');
      return {
        total: urlDocuments.length,
        completed: urlDocuments.filter(doc => doc.status === 'completed' || doc.status === 'indexed').length,
        pending: urlDocuments.filter(doc => doc.status === 'pending').length,
        processing: urlDocuments.filter(doc => doc.status === 'processing').length
      };
    }
    
    // 기본값
    return {
      total: documents.length,
      completed: documents.filter(doc => doc.status === 'completed' || doc.status === 'indexed').length,
      pending: documents.filter(doc => doc.status === 'pending').length,
      processing: documents.filter(doc => doc.status === 'processing').length
    };
  };

  // 정렬 핸들러
  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 데이터 로드 함수
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      
      if (data.success) {
        const docs = data.documents || [];
        setDocuments(docs);
        setStats({
          totalDocuments: data.stats?.total || 0,
          indexedDocuments: data.stats?.completed || 0,
          totalChunks: data.stats?.totalChunks || 0,
          totalEmbeddings: data.stats?.totalChunks || 0
        });
        
        // URL 문서들을 그룹화
        const urlDocuments = docs.filter((doc: Document) => doc.type === 'url');
        const groups = documentGroupingService.groupDocumentsByDomain(urlDocuments);
        setDocumentGroups(groups);
      } else {
        throw new Error(data.error || '문서를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('문서 로드 오류:', error);
      toast({
        title: "오류",
        description: "문서를 불러오는데 실패했습니다.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDocuments();
  }, []);

  // 그룹 확장/축소 핸들러
  const handleToggleGroupExpansion = (groupIndex: number) => {
    setDocumentGroups(prev => 
      documentGroupingService.toggleGroupExpansion(prev, groupIndex)
    );
  };

  // 하위 페이지 선택/해제 핸들러
  const handleToggleSubPageSelection = (groupIndex: number, subPageUrl: string) => {
    setDocumentGroups(prev => 
      documentGroupingService.toggleSubPageSelection(prev, groupIndex, subPageUrl)
    );
  };

  // 모든 하위 페이지 선택/해제 핸들러
  const handleToggleAllSubPages = (groupIndex: number) => {
    setDocumentGroups(prev => 
      documentGroupingService.toggleAllSubPages(prev, groupIndex)
    );
  };

  // 탭별 문서 필터링
  const getFilteredDocuments = (tab: string) => {
    let filtered = documents;
    
    if (tab === 'upload') {
      // 파일 업로드 탭: PDF, DOCX, TXT 파일만 표시
      filtered = documents.filter(doc => 
        doc.type === 'file' && 
        (doc.title.includes('.pdf') || doc.title.includes('.docx') || doc.title.includes('.txt'))
      );
    } else if (tab === 'crawling') {
      // URL 크롤링 탭: URL로 크롤링된 문서만 표시
      filtered = documents.filter(doc => doc.type === 'url');
    }
    
    // 검색 쿼리 적용
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredDocuments = getFilteredDocuments(activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "indexed":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "indexing":
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case "crawling":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };


  const handleUpload = async (files: File[]) => {
    console.log("Upload files:", files);
    // 업로드 후 데이터 새로고침
    await loadDocuments();
    
    // 성공 토스트 표시
    toast({
      title: "업로드 완료",
      description: `${files.length}개 파일이 성공적으로 업로드되었습니다.`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "삭제 완료",
          description: "문서가 성공적으로 삭제되었습니다.",
        });
        await loadDocuments();
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "문서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReindex = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${id}/reindex`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "재인덱싱 시작",
          description: "문서 재인덱싱이 시작되었습니다.",
        });
        await loadDocuments();
      } else {
        throw new Error('재인덱싱에 실패했습니다.');
      }
    } catch (error) {
      console.error('재인덱싱 오류:', error);
      toast({
        title: "재인덱싱 실패",
        description: "문서 재인덱싱 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout currentPage="docs">
      {/* System Alert */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert className="bg-blue-900/20 border-blue-500/30 text-blue-100 rounded-xl">
          <Info className="h-4 w-4 text-blue-300" />
          <AlertTitle className="text-blue-100 font-semibold">문서 관리 안내</AlertTitle>
          <AlertDescription className="text-blue-200">
            문서 업로드 후 자동으로 인덱싱됩니다. 처리 상태를 실시간으로 확인할 수 있습니다.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">문서 관리</h1>
            <p className="text-gray-300">
              정책 문서와 가이드라인을 업로드하고 관리하여 AI 챗봇의 지식 베이스를 확장하세요.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-gray-700">
            <TabsTrigger 
              value="upload" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Upload className="w-4 h-4" />
              <span>문서 업로드</span>
            </TabsTrigger>
            <TabsTrigger 
              value="crawling" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <Globe className="w-4 h-4" />
              <span>URL 크롤링</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <DocumentUpload onUpload={handleUpload} />
          </TabsContent>
          
          <TabsContent value="crawling" className="mt-6">
            <HybridCrawlingManager onCrawlingComplete={loadDocuments} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Documents List */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">
              {activeTab === 'upload' ? '업로드된 파일' : '크롤링된 URL 문서'}
            </h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {getTabStats().total}개
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDocuments}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">모든 타입</option>
                {activeTab === 'upload' ? (
                  <>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="txt">TXT</option>
                  </>
                ) : (
                  <option value="url">URL</option>
                )}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">모든 상태</option>
                <option value="indexed">인덱싱 완료</option>
                <option value="processing">처리 중</option>
                <option value="failed">실패</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex items-center space-x-6">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="w-8 h-8" />
                      <Skeleton className="w-8 h-8" />
                      <Skeleton className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : getFilteredAndSortedDocuments().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">문서가 없습니다</h3>
            <p className="text-sm">새로운 문서를 업로드해보세요.</p>
          </div>
        ) : activeTab === 'crawling' ? (
          // URL 크롤링 탭: 그룹화된 뷰 사용
          <GroupedDocumentList
            groups={documentGroups}
            onToggleGroupExpansion={handleToggleGroupExpansion}
            onToggleSubPageSelection={handleToggleSubPageSelection}
            onToggleAllSubPages={handleToggleAllSubPages}
            onReindexDocument={handleReindexDocument}
            onDownloadDocument={handleDownloadDocument}
            onPreviewDocument={handlePreviewDocument}
            onDeleteDocument={handleDeleteDocument}
            actionLoading={actionLoading}
            deletingDocument={deletingDocument}
          />
        ) : (
          // 파일 업로드 탭: 기존 테이블 뷰 사용
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg rounded-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-enhanced font-semibold w-24">상태</TableHead>
                    <TableHead 
                      className="text-white font-semibold cursor-pointer hover:bg-gray-700/50 select-none"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>문서명</span>
                        {sortField === 'title' && (
                          <SortAsc className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-white font-semibold w-20 cursor-pointer hover:bg-gray-700/50 select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>유형</span>
                        {sortField === 'type' && (
                          <SortAsc className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-white font-semibold w-24 cursor-pointer hover:bg-gray-700/50 select-none"
                      onClick={() => handleSort('chunk_count')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>청크 수</span>
                        {sortField === 'chunk_count' && (
                          <SortAsc className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-white font-semibold w-32 cursor-pointer hover:bg-gray-700/50 select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>생성일</span>
                        {sortField === 'created_at' && (
                          <SortAsc className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-white font-semibold w-32 cursor-pointer hover:bg-gray-700/50 select-none"
                      onClick={() => handleSort('updated_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>수정일</span>
                        {sortField === 'updated_at' && (
                          <SortAsc className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold w-32">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedDocuments().map((doc, index) => (
                    <TableRow key={doc.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center space-x-2 min-w-0">
                          {getStatusIcon(doc.status)}
                          <span className="text-xs text-gray-300 whitespace-nowrap">
                            {(doc.status === 'indexed' || doc.status === 'completed') && '완료'}
                            {doc.status === 'indexing' && '인덱싱'}
                            {doc.status === 'crawling' && '크롤링'}
                            {doc.status === 'processing' && '처리중'}
                            {doc.status === 'error' && '오류'}
                            {doc.status === 'failed' && '실패'}
                            {!['indexed', 'completed', 'indexing', 'crawling', 'processing', 'error', 'failed'].includes(doc.status) && '대기'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-white text-sm">{doc.title}</p>
                            {doc.url && (
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                                title="원본 페이지 열기"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-semibold px-3 py-1 ${
                            doc.type.toLowerCase() === 'pdf' 
                              ? 'bg-red-500/20 text-red-300 border-red-400/50 hover:bg-red-500/30' 
                              : doc.type.toLowerCase() === 'docx' 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 hover:bg-blue-500/30'
                              : doc.type.toLowerCase() === 'txt'
                              ? 'bg-green-500/20 text-green-300 border-green-400/50 hover:bg-green-500/30'
                              : doc.type.toLowerCase() === 'url'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 hover:bg-purple-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-400/50 hover:bg-gray-500/30'
                          } transition-all duration-200`}
                        >
                          <div className="flex items-center space-x-1">
                            {doc.type.toLowerCase() === 'pdf' && <FileText className="w-3 h-3" />}
                            {doc.type.toLowerCase() === 'docx' && <FileText className="w-3 h-3" />}
                            {doc.type.toLowerCase() === 'txt' && <FileText className="w-3 h-3" />}
                            {doc.type.toLowerCase() === 'url' && <Globe className="w-3 h-3" />}
                            <span>{doc.type.toUpperCase()}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300 text-sm">{doc.chunk_count}개</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">
                          {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">
                          {new Date(doc.updated_at).toLocaleDateString('ko-KR')}
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
                                  onClick={() => handleReindexDocument(doc.id, doc.title)}
                                  disabled={actionLoading[`${doc.id}_reindex`] || doc.status === "processing"}
                                  className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                                >
                                  {actionLoading[`${doc.id}_reindex`] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>재인덱싱</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc.id, doc.title)}
                                  disabled={actionLoading[`${doc.id}_download`]}
                                  className="text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                                >
                                  {actionLoading[`${doc.id}_download`] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>다운로드</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreviewDocument(doc.id)}
                                  disabled={actionLoading[`${doc.id}_preview`]}
                                  className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                                >
                                  {actionLoading[`${doc.id}_preview`] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>미리보기</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                  disabled={deletingDocument === doc.id}
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  {deletingDocument === doc.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>삭제</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">총 문서 수</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalDocuments}</div>
            <p className="text-xs text-gray-400">업로드된 문서</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">인덱싱 완료</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{stats.indexedDocuments}</div>
            <p className="text-xs text-gray-400">처리 완료</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">총 청크</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalChunks}</div>
            <p className="text-xs text-gray-400">텍스트 청크</p>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
}