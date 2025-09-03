"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Link, X, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "indexing" | "success" | "error";
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  onUpload?: (files: File[], urls: string[]) => void;
}

export default function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // 파일 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileSelect(droppedFiles);
    }
  }, []);

  const handleFileSelect = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(file => {
      // PDF, DOCX, 텍스트 파일 허용
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const validExtensions = ['.pdf', '.docx', '.txt'];
      
      return validTypes.includes(file.type) || 
             validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "PDF(.pdf), Word(.docx), 텍스트(.txt) 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
    }

    const newFiles: DocumentFile[] = validFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending" as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleUrlAdd = () => {
    if (urlInput.trim() && !urls.includes(urlInput.trim())) {
      setUrls(prev => [...prev, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleUrlRemove = (urlToRemove: string) => {
    setUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleFileRemove = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadAndIndexDocument = async (file: File, fileId: string) => {
    try {
      // 1단계: 파일 업로드
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
      ));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'file');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 업로드 실패');
      }

      // 2단계: 인덱싱 진행
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "indexing", progress: 50 } : f
      ));

      // 3단계: 완료
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "success", progress: 100 } : f
      ));

      toast({
        title: "업로드 완료",
        description: `${file.name} 파일이 성공적으로 업로드되고 인덱싱되었습니다.`,
      });

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : "알 수 없는 오류"
        } : f
      ));

      toast({
        title: "업로드 실패",
        description: `${file.name} 파일 업로드 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    }
  };

  const uploadAndIndexUrl = async (url: string) => {
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type: 'url' }),
      });

      if (!response.ok) {
        throw new Error('URL 처리 실패');
      }

      toast({
        title: "URL 처리 완료",
        description: `${url} URL이 성공적으로 처리되고 인덱싱되었습니다.`,
      });

    } catch (error) {
      toast({
        title: "URL 처리 실패",
        description: `${url} URL 처리 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0 && urls.length === 0) return;

    setIsUploading(true);

    try {
      // 파일 업로드 및 인덱싱
      const uploadPromises = files
        .filter(file => file.status === "pending")
        .map(async (file) => {
          // 실제 파일 객체를 찾아서 업로드
          const actualFile = await findActualFile(file.name);
          if (actualFile) {
            return uploadAndIndexDocument(actualFile, file.id);
          } else {
            throw new Error(`파일을 찾을 수 없습니다: ${file.name}`);
          }
        });

      // URL 처리 및 인덱싱
      const urlPromises = urls.map(url => uploadAndIndexUrl(url));

      await Promise.all([...uploadPromises, ...urlPromises]);

      // 성공 시 상태 초기화
      if (onUpload) {
        onUpload([], urls);
      }

    } catch (error) {
      toast({
        title: "일괄 처리 실패",
        description: "일부 파일 또는 URL 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 실제 파일 객체를 찾는 함수
  const findActualFile = async (fileName: string): Promise<File | null> => {
    // 파일 입력 요소에서 실제 파일 찾기
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput && fileInput.files) {
      const fileArray = Array.from(fileInput.files);
      return fileArray.find(file => file.name === fileName) || null;
    }
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: DocumentFile["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 border-t-transparent rounded-full" />;
      case "uploading":
        return <div className="w-4 h-4 border-2 border-primary-600 dark:border-primary-500 border-t-transparent rounded-full animate-spin" />;
      case "indexing":
        return <div className="w-4 h-4 border-2 border-yellow-600 dark:border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusText = (status: DocumentFile["status"]) => {
    switch (status) {
      case "pending":
        return "대기 중";
      case "uploading":
        return "업로드 중";
      case "indexing":
        return "인덱싱 중";
      case "success":
        return "완료";
      case "error":
        return "오류";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>문서 업로드 및 인덱싱</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="file-upload">파일 업로드</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-500 font-medium">
                  파일 선택
                </span>
                <span className="text-gray-500"> 또는 드래그 앤 드롭</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF(.pdf), Word(.docx), 텍스트(.txt) 파일 지원 (최대 10MB)
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <Label htmlFor="url-input">URL 추가</Label>
          <div className="flex space-x-2">
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/document"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUrlAdd()}
            />
            <Button onClick={handleUrlAdd} disabled={!urlInput.trim()}>
              추가
            </Button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>업로드 중인 파일</Label>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <span className="text-xs text-gray-600">{getStatusText(file.status)}</span>
                    </div>
                    
                    {(file.status === "uploading" || file.status === "indexing") && (
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {file.status === "error" && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">{file.error}</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL List */}
        {urls.length > 0 && (
          <div className="space-y-2">
            <Label>추가된 URL</Label>
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Link className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-900 truncate">{url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUrlRemove(url)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 && urls.length === 0 || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? "처리 중..." : "업로드 및 인덱싱 시작"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
