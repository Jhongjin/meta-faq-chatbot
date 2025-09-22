"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "@/app/admin/globals.admin.css";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileText, Calendar, Trash2, RefreshCw, CheckCircle, Filter, SortAsc, MoreHorizontal, Edit, Archive, ExternalLink, Link, Globe, Upload, Info, HelpCircle, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Check, Square, Download } from "lucide-react";
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
  completedDocuments?: number;
  pendingDocuments?: number;
  totalChunks: number;
  totalEmbeddings: number;
  fileStats?: {
    totalDocuments: number;
    completedDocuments: number;
    totalChunks: number;
    pendingDocuments: number;
    failedDocuments: number;
  };
  urlStats?: {
    totalDocuments: number;
    completedDocuments: number;
    totalChunks: number;
    pendingDocuments: number;
    failedDocuments: number;
  };
}

// 중복 파일 처리는 DocumentUpload 컴포넌트에서 처리

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
  
  // 중복 파일 처리는 DocumentUpload 컴포넌트에서 처리
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
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const { toast } = useToast();

  // 필터링 및 정렬된 문서 목록
  const getFilteredAndSortedDocuments = () => {
    console.log('🔍 getFilteredAndSortedDocuments 호출:', {
      activeTab,
      totalDocuments: documents.length,
      documents: documents.map(d => ({ id: d.id, title: d.title, type: d.type }))
    });
    
    // 활성 탭에 따라 필터링
    let filtered = documents;
    
    if (activeTab === 'upload') {
      // 문서 업로드 탭: 파일 타입 문서만 표시 (pdf, docx, txt, file)
      filtered = documents.filter(doc => 
        doc.type === 'file' || 
        doc.type === 'pdf' || 
        doc.type === 'docx' || 
        doc.type === 'txt'
      );
      console.log('📁 파일 업로드 탭 필터링 결과:', {
        originalCount: documents.length,
        filteredCount: filtered.length,
        filteredDocs: filtered.map(d => ({ id: d.id, title: d.title, type: d.type }))
      });
    } else if (activeTab === 'crawling') {
      // URL 크롤링 탭: URL 타입만
      filtered = documents.filter(doc => doc.type === 'url');
      console.log('🌐 URL 크롤링 탭 필터링 결과:', {
        originalCount: documents.length,
        filteredCount: filtered.length,
        filteredDocs: filtered.map(d => ({ id: d.id, title: d.title, type: d.type }))
      });
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query)
      );
    }

    // 타입 필터링
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // 전체선택 핸들러
  const handleSelectAll = () => {
    const filteredDocs = getFilteredAndSortedDocuments();
    if (isAllSelected) {
      setSelectedDocuments(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(filteredDocs.map(doc => doc.id));
      setSelectedDocuments(allIds);
      setIsAllSelected(true);
    }
  };

  // 개별선택 핸들러
  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
    
    // 전체선택 상태 업데이트
    const filteredDocs = getFilteredAndSortedDocuments();
    setIsAllSelected(newSelected.size === filteredDocs.length && filteredDocs.length > 0);
  };

  // 선택된 문서 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) {
      toast({
        title: "선택된 문서 없음",
        description: "삭제할 문서를 선택해주세요.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const selectedCount = selectedDocuments.size;
    if (!confirm(`선택된 ${selectedCount}개의 문서를 모두 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 임베딩 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, bulkDelete: true }));
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const documentId of selectedDocuments) {
        try {
          const response = await fetch(`/api/admin/upload-new?documentId=${documentId}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || '문서 삭제에 실패했습니다.');
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`문서 ID ${documentId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 결과 토스트 표시
      if (successCount > 0) {
        toast({
          title: "일괄 삭제 완료",
          description: `${successCount}개의 문서가 성공적으로 삭제되었습니다.${errorCount > 0 ? ` (실패: ${errorCount}개)` : ''}`,
          variant: successCount === selectedCount ? "default" : "destructive",
          duration: 5000,
        });
      }

      if (errorCount > 0) {
        console.error('일괄 삭제 오류:', errors);
        toast({
          title: "일부 삭제 실패",
          description: `${errorCount}개의 문서 삭제에 실패했습니다. 자세한 내용은 콘솔을 확인하세요.`,
          variant: "destructive",
          duration: 5000,
        });
      }

      // 선택 상태 초기화 및 문서 목록 새로고침
      setSelectedDocuments(new Set());
      setIsAllSelected(false);
      await loadDocuments();
      
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      toast({
        title: "일괄 삭제 실패",
        description: `일괄 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState.bulkDelete;
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

  // 문서 다운로드 함수
  const handleDownloadDocument = async (documentId: string, documentTitle: string) => {
    try {
      console.log(`📥 다운로드 시작: ${documentTitle} (${documentId})`);
      setActionLoading(prev => ({ ...prev, [`${documentId}_download`]: true }));
      
      const response = await fetch(`/api/admin/document-actions?action=download&documentId=${documentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ 다운로드 API 오류:', errorData);
        
        // 다운로드 불가능한 파일에 대한 특별 처리
        if (errorData.error === '다운로드 불가') {
          toast({
            title: "다운로드 불가",
            description: errorData.message || '이 파일은 다운로드할 수 없습니다.',
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
        
        throw new Error(errorData.error || `다운로드에 실패했습니다. (${response.status})`);
      }

      // 응답에서 파일명 추출
      const contentDisposition = response.headers.get('content-disposition');
      let filename = documentTitle;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          const simpleFilenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (simpleFilenameMatch) {
            filename = simpleFilenameMatch[1];
          }
        }
      }

      console.log(`📁 다운로드 파일명: ${filename}`);

      // Blob으로 변환하여 다운로드
      const blob = await response.blob();
      console.log(`📦 Blob 크기: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('다운로드된 파일이 비어있습니다.');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ 다운로드 완료: ${filename}`);
      toast({
        title: "다운로드 완료",
        description: `"${documentTitle}" 파일이 다운로드되었습니다.`,
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ 다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: `다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`${documentId}_download`];
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
      const response = await fetch(`/api/admin/upload-new?documentId=${documentId}`, {
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

  // 탭별 통계 계산
  const getTabStats = () => {
    console.log('📊 getTabStats 호출:', {
      activeTab,
      stats,
      fileStats: stats.fileStats,
      urlStats: stats.urlStats
    });

    if (activeTab === 'upload') {
      // 파일 업로드 탭: API에서 받은 fileStats 사용
      const result = {
        total: stats.fileStats?.totalDocuments || 0,
        completed: stats.fileStats?.completedDocuments || 0,
        pending: stats.fileStats?.pendingDocuments || 0,
        processing: stats.fileStats?.pendingDocuments || 0,
        totalChunks: stats.fileStats?.totalChunks || 0
      };
      console.log('📊 파일 업로드 탭 통계:', result);
      return result;
    } else if (activeTab === 'crawling') {
      // URL 크롤링 탭: API에서 받은 urlStats 사용
      const result = {
        total: stats.urlStats?.totalDocuments || 0,
        completed: stats.urlStats?.completedDocuments || 0,
        pending: stats.urlStats?.pendingDocuments || 0,
        processing: stats.urlStats?.pendingDocuments || 0,
        totalChunks: stats.urlStats?.totalChunks || 0
      };
      console.log('📊 URL 크롤링 탭 통계:', result);
      return result;
    }
    
    // 기본값 (전체 통계)
    const result = {
      total: stats.totalDocuments || 0,
      completed: stats.completedDocuments || 0,
      pending: stats.pendingDocuments || 0,
      processing: stats.pendingDocuments || 0,
      totalChunks: stats.totalChunks || 0
    };
    console.log('📊 기본 통계:', result);
    return result;
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
      console.log('🔄 loadDocuments 시작');
      const response = await fetch('/api/admin/upload-new');
      const data = await response.json();
      
      console.log('📊 API 응답:', data);
      
      if (data.success) {
        const docs = data.data?.documents || [];
        console.log('📋 원본 API 응답 data:', data);
        console.log('📋 data.data:', data.data);
        console.log('📋 data.data.documents:', data.data?.documents);
        console.log('📋 문서 배열:', docs);
        console.log('📋 문서 수:', docs.length);
        console.log('📋 첫 번째 문서:', docs[0]);
        console.log('📋 첫 번째 문서 타입:', typeof docs[0]);
        console.log('📋 첫 번째 문서 키들:', docs[0] ? Object.keys(docs[0]) : '없음');
        
        // 문서 데이터가 올바르게 있는지 확인
        if (docs.length > 0 && docs[0] && Object.keys(docs[0]).length > 0) {
          setDocuments(docs);
          console.log('✅ setDocuments 호출 완료');
        } else {
          console.error('❌ 문서 데이터가 비어있거나 잘못된 형식입니다:', docs);
          setDocuments([]);
        }
        
        setStats({
          totalDocuments: data.data?.stats?.totalDocuments || 0,
          indexedDocuments: data.data?.stats?.completedDocuments || 0,
          totalChunks: data.data?.stats?.totalChunks || 0,
          totalEmbeddings: data.data?.stats?.totalChunks || 0,
          fileStats: data.data?.stats?.fileStats,
          urlStats: data.data?.stats?.urlStats
        });
        console.log('✅ setStats 호출 완료');
        
        // URL 문서들을 그룹화
        const urlDocuments = docs.filter((doc: Document) => doc.type === 'url');
        console.log('🔍 URL 문서 필터링 결과:', {
          totalDocs: docs.length,
          urlDocs: urlDocuments.length,
          urlDocsData: urlDocuments
        });
        
        const groups = documentGroupingService.groupDocumentsByDomain(urlDocuments);
        setDocumentGroups(groups);
        console.log('✅ setDocumentGroups 호출 완료:', groups.length, '개 그룹');
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
        doc.type === 'pdf' || 
        doc.type === 'docx' || 
        doc.type === 'txt' ||
        doc.type === 'file'
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
    // DocumentUpload 컴포넌트가 모든 파일 업로드를 처리하므로 여기서는 아무것도 하지 않음
    // 파일 업로드 후 약간의 지연을 두고 loadDocuments()를 호출하여 목록을 새로고침
    // 🔧 임시로 자동 새로고침 비활성화 - RAG 처리 로그 확인을 위해
    // setTimeout(async () => {
    //   console.log("🔄 업로드 완료 후 문서 목록 새로고침 시작");
    //   await loadDocuments();
    // }, 1000); // 1초 지연
  };

  // 중복 파일 처리는 DocumentUpload 컴포넌트에서 처리

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Content = base64.split(',')[1]; // data:image/jpeg;base64, 부분 제거
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
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
            <DocumentUpload 
              onUpload={handleUpload} 
              onDocumentListRefresh={loadDocuments}
            />
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
            {selectedDocuments.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={actionLoading.bulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading.bulkDelete ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                선택된 {selectedDocuments.size}개 삭제
              </Button>
            )}
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
            onDeleteDocument={handleDeleteDocument}
            onSelectAll={handleSelectAll}
            onSelectDocument={handleSelectDocument}
            onBulkDelete={handleBulkDelete}
            selectedDocuments={selectedDocuments}
            isAllSelected={isAllSelected}
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
                    <TableHead className="text-white font-semibold w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="p-1 h-6 w-6 hover:bg-gray-700/50"
                      >
                        {isAllSelected ? (
                          <Check className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectDocument(doc.id)}
                          className="p-1 h-6 w-6 hover:bg-gray-700/50"
                        >
                          {selectedDocuments.has(doc.id) ? (
                            <Check className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
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
            <div className="text-3xl font-bold text-white mb-1">{getTabStats().total}</div>
            <p className="text-xs text-gray-400">
              {activeTab === 'upload' ? '업로드된 파일' : activeTab === 'crawling' ? '크롤링된 URL' : '전체 문서'}
            </p>
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
            <div className="text-3xl font-bold text-white mb-1">{getTabStats().completed}</div>
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
            <div className="text-3xl font-bold text-white mb-1">{getTabStats().totalChunks}</div>
            <p className="text-xs text-gray-400">텍스트 청크</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 중복 파일 처리는 DocumentUpload 컴포넌트에서 처리 */}
    </AdminLayout>
  );
}