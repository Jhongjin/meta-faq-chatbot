'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Settings,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Layers,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

// 미리 정의된 URL 템플릿 (대표 도메인만)
const predefinedUrlTemplates = {
  'Facebook Business (한국어)': [
    'https://ko-kr.facebook.com/business'
  ],
  'Instagram Business (한국어)': [
    'https://business.instagram.com/help/ko/'
  ],
  'Meta 개발자 문서 (한국어)': [
    'https://developers.facebook.com/docs/marketing-api/ko/'
  ],
  'Facebook Help (영어)': [
    'https://www.facebook.com/help/'
  ],
  'Facebook Business (영어)': [
    'https://www.facebook.com/business/help/'
  ],
  'Instagram Business (영어)': [
    'https://business.instagram.com/help/'
  ],
  'Meta 개발자 문서 (영어)': [
    'https://developers.facebook.com/docs/marketing-api/'
  ]
};

interface CrawlingProgress {
  url: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  message?: string;
  discoveredUrls?: Array<{
    url: string;
    title?: string;
    source: 'sitemap' | 'robots' | 'links' | 'pattern';
  }>;
}

interface HybridCrawlingManagerProps {
  onCrawlingComplete?: () => void;
}

export default function HybridCrawlingManager({ onCrawlingComplete }: HybridCrawlingManagerProps) {
  const [crawlingMode, setCrawlingMode] = useState<'predefined' | 'custom' | 'hybrid'>('hybrid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlingProgress, setCrawlingProgress] = useState<CrawlingProgress[]>([]);
  const [extractSubPages, setExtractSubPages] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateUrls, setTemplateUrls] = useState<{[key: string]: string[]}>({});
  const [originalTemplateUrls, setOriginalTemplateUrls] = useState<{[key: string]: string[]}>({});
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateUrls, setNewTemplateUrls] = useState<string[]>(['']);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrlSelector, setShowUrlSelector] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [showDiscoveredUrls, setShowDiscoveredUrls] = useState<{[key: string]: boolean}>({});
  const [selectedDiscoveredUrls, setSelectedDiscoveredUrls] = useState<{[key: string]: string[]}>({});

  // 템플릿 로드
  const loadTemplates = async () => {
    try {
      console.log('템플릿 로드 시도...');
      const response = await fetch('/api/admin/url-templates');
      const data = await response.json();
      
      console.log('템플릿 로드 응답:', data);
      
      if (data.success) {
        setTemplateUrls(data.templates);
        setOriginalTemplateUrls(data.templates);
        setTemplatesLoaded(true);
        console.log('템플릿 로드 성공:', Object.keys(data.templates).length, '개');
      } else {
        console.error('템플릿 로드 실패:', data.error);
        // 실패 시 기본 템플릿 사용
        setTemplateUrls(predefinedUrlTemplates);
        setOriginalTemplateUrls(predefinedUrlTemplates);
        setTemplatesLoaded(true);
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      // 오류 시 기본 템플릿 사용
      setTemplateUrls(predefinedUrlTemplates);
      setOriginalTemplateUrls(predefinedUrlTemplates);
      setTemplatesLoaded(true);
    }
  };

  // 컴포넌트 마운트 시 템플릿 로드
  React.useEffect(() => {
    if (!templatesLoaded) {
      loadTemplates();
    }
  }, [templatesLoaded]);

  // URL 삭제 함수
  const handleDeleteUrl = async (url: string) => {
    if (!confirm(`"${url}" URL을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingUrl(url);
    try {
      // 사용자 정의 URL은 아직 크롤링되지 않은 상태이므로
      // 프론트엔드 상태에서만 제거하면 됩니다
      
      // URL 목록에서 제거
      setCustomUrls(prev => prev.filter(u => u !== url));
      setSelectedUrls(prev => prev.filter(u => u !== url));
      
      // 성공 메시지 표시
      toast.success('URL이 목록에서 제거되었습니다.');
      
    } catch (error) {
      console.error('URL 삭제 오류:', error);
      toast.error(`URL 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeletingUrl(null);
    }
  };

  // 템플릿 선택 토글
  const toggleTemplate = (templateName: string) => {
    if (selectedTemplates.includes(templateName)) {
      setSelectedTemplates(selectedTemplates.filter(t => t !== templateName));
    } else {
      setSelectedTemplates([...selectedTemplates, templateName]);
    }
  };

  // 사용자 정의 URL 추가
  const addCustomUrl = () => {
    if (newUrl.trim() && !customUrls.includes(newUrl.trim())) {
      setCustomUrls([...customUrls, newUrl.trim()]);
      setNewUrl('');
      toast.success('URL이 추가되었습니다.');
    }
  };

  // 사용자 정의 URL 삭제
  const removeCustomUrl = (index: number) => {
    setCustomUrls(customUrls.filter((_, i) => i !== index));
  };

  // 템플릿 편집 시작
  const startEditingTemplate = (templateName: string) => {
    // 원본 데이터 저장
    setOriginalTemplateUrls(prev => ({
      ...prev,
      [templateName]: [...templateUrls[templateName]]
    }));
    setEditingTemplate(templateName);
  };

  // 템플릿 편집 취소
  const cancelEditingTemplate = () => {
    if (editingTemplate) {
      // 원본 데이터로 복원
      setTemplateUrls(prev => ({
        ...prev,
        [editingTemplate]: [...originalTemplateUrls[editingTemplate]]
      }));
    }
    setEditingTemplate(null);
  };

  // 템플릿 URL 업데이트
  const updateTemplateUrl = (templateName: string, index: number, value: string) => {
    setTemplateUrls(prev => ({
      ...prev,
      [templateName]: prev[templateName].map((url, i) => i === index ? value : url)
    }));
  };

  // 템플릿 URL 추가
  const addTemplateUrl = (templateName: string) => {
    setTemplateUrls(prev => ({
      ...prev,
      [templateName]: [...prev[templateName], '']
    }));
  };

  // 템플릿 URL 삭제
  const removeTemplateUrl = (templateName: string, index: number) => {
    setTemplateUrls(prev => ({
      ...prev,
      [templateName]: prev[templateName].filter((_, i) => i !== index)
    }));
  };

  // 새 템플릿 추가
  const addNewTemplate = async () => {
    if (newTemplateName.trim() && newTemplateUrls.some(url => url.trim())) {
      const validUrls = newTemplateUrls.filter(url => url.trim());
      const templateName = newTemplateName.trim();
      
      try {
        console.log('새 템플릿 추가 시도:', { name: templateName, urls: validUrls });
        
        const response = await fetch('/api/admin/url-templates', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: templateName,
            urls: validUrls
          })
        });
        
        const data = await response.json();
        console.log('API 응답:', data);
        
        if (data.success) {
          // 먼저 백엔드에서 최신 데이터를 다시 로드
          await loadTemplates();
          
          setNewTemplateName('');
          setNewTemplateUrls(['']);
          toast.success('새 템플릿이 추가되었습니다.');
        } else {
          toast.error(data.error || '템플릿 추가에 실패했습니다.');
        }
      } catch (error) {
        console.error('템플릿 추가 오류:', error);
        toast.error('템플릿 추가 중 오류가 발생했습니다.');
      }
    } else {
      toast.error('템플릿 이름과 최소 하나의 URL을 입력해주세요.');
    }
  };

  // 템플릿 저장
  const saveTemplate = async (templateName: string) => {
    // 빈 URL 제거
    const validUrls = templateUrls[templateName].filter(url => url.trim());
    if (validUrls.length === 0) {
      toast.error('최소 하나의 유효한 URL이 필요합니다.');
      return;
    }
    
    try {
      console.log('템플릿 저장 시도:', { name: templateName, urls: validUrls });
      
      const response = await fetch('/api/admin/url-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          urls: validUrls
        })
      });
      
      const data = await response.json();
      console.log('API 응답:', data);
      
      if (data.success) {
        // 먼저 백엔드에서 최신 데이터를 다시 로드
        await loadTemplates();
        
        setEditingTemplate(null);
        toast.success('템플릿이 저장되었습니다.');
      } else {
        toast.error(data.error || '템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      toast.error('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  // 템플릿 삭제
  const deleteTemplate = async (templateName: string) => {
    if (!confirm(`"${templateName}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      console.log('템플릿 삭제 시도:', templateName);
      
      const response = await fetch(`/api/admin/url-templates?name=${encodeURIComponent(templateName)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      console.log('API 응답:', data);
      
      if (data.success) {
        // 먼저 백엔드에서 최신 데이터를 다시 로드
        await loadTemplates();
        
        setSelectedTemplates(prev => prev.filter(t => t !== templateName));
        setEditingTemplate(null);
        toast.success('템플릿이 삭제되었습니다.');
      } else {
        toast.error(data.error || '템플릿 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      toast.error('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };

  // 크롤링 시작
  const handleStartCrawling = async () => {
    const urlsToCrawl: string[] = [];

    // 선택된 템플릿에서 URL 추출
    if (crawlingMode !== 'custom') {
      selectedTemplates.forEach(templateName => {
        const urls = templateUrls[templateName] || [];
        urlsToCrawl.push(...urls);
      });
    }

    // 사용자 정의 URL 추가
    if (crawlingMode !== 'predefined') {
      urlsToCrawl.push(...customUrls);
    }

    if (urlsToCrawl.length === 0) {
      toast.error('크롤링할 URL을 선택하거나 입력해주세요.');
      return;
    }

    setIsCrawling(true);
    setCrawlingProgress(urlsToCrawl.map(url => ({ url, status: 'pending' })));

    try {
      // 하위 페이지 추출이 활성화된 경우
      if (extractSubPages) {
        toast.info('하위 페이지를 추출하고 있습니다...');
        console.log('🔍 하위 페이지 추출이 활성화되어 있습니다.');
      }

      // 각 URL에 대해 순차적으로 크롤링 상태 업데이트
      for (let i = 0; i < urlsToCrawl.length; i++) {
        const url = urlsToCrawl[i];
        
        // 현재 URL을 크롤링 중으로 표시
        setCrawlingProgress(prev => 
          prev.map((p, index) => 
            index === i 
              ? { ...p, status: 'crawling', message: '크롤링 중...' }
              : p
          )
        );
        
        // 실제 크롤링은 API에서 일괄 처리되므로 짧은 지연만 추가
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 크롤링 API 호출
      const response = await fetch('/api/puppeteer-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'crawl-custom',
          urls: urlsToCrawl,
          extractSubPages: extractSubPages
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`크롤링 완료: ${result.documents?.length || 0}개 문서 처리`);
        setCrawlingProgress(prev => 
          prev.map((p, index) => {
            const document = result.documents?.[index];
            return {
              ...p, 
              status: 'completed' as const, 
              message: '크롤링 완료',
              discoveredUrls: document?.discoveredUrls?.map((discovered: any) => ({
                url: discovered.url,
                title: discovered.title,
                source: discovered.source
              }))
            };
          })
        );
        
        // 크롤링 완료 후 3초 뒤에 진행상황 초기화
        setTimeout(() => {
          setCrawlingProgress([]);
          // 부모 컴포넌트에 크롤링 완료 알림
          if (onCrawlingComplete) {
            onCrawlingComplete();
          }
        }, 3000);
      } else {
        throw new Error(result.error || '크롤링 실패');
      }

    } catch (error) {
      console.error('크롤링 오류:', error);
      toast.error('크롤링 중 오류가 발생했습니다.');
      setCrawlingProgress(prev => 
        prev.map(p => ({ ...p, status: 'failed', message: '크롤링 실패' }))
      );
    } finally {
      setIsCrawling(false);
    }
  };

  // 선택된 URL 수 계산
  const getSelectedUrlCount = () => {
    let count = 0;
    if (crawlingMode !== 'custom') {
      selectedTemplates.forEach(templateName => {
        const urls = templateUrls[templateName] || [];
        count += urls.length;
      });
    }
    if (crawlingMode !== 'predefined') {
      count += customUrls.length;
    }
    return count;
  };

  // 발견된 URL 토글
  const toggleDiscoveredUrls = (url: string) => {
    setShowDiscoveredUrls(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  // 발견된 URL 선택/해제
  const toggleDiscoveredUrlSelection = (parentUrl: string, discoveredUrl: string) => {
    setSelectedDiscoveredUrls(prev => {
      const current = prev[parentUrl] || [];
      const isSelected = current.includes(discoveredUrl);
      
      if (isSelected) {
        return {
          ...prev,
          [parentUrl]: current.filter(url => url !== discoveredUrl)
        };
      } else {
        return {
          ...prev,
          [parentUrl]: [...current, discoveredUrl]
        };
      }
    });
  };

  // 모든 발견된 URL 선택/해제
  const toggleAllDiscoveredUrls = (parentUrl: string, discoveredUrls: Array<{url: string; title?: string; source: string}>) => {
    const current = selectedDiscoveredUrls[parentUrl] || [];
    const allSelected = discoveredUrls.every(discovered => current.includes(discovered.url));
    
    if (allSelected) {
      setSelectedDiscoveredUrls(prev => ({
        ...prev,
        [parentUrl]: []
      }));
    } else {
      setSelectedDiscoveredUrls(prev => ({
        ...prev,
        [parentUrl]: discoveredUrls.map(discovered => discovered.url)
      }));
    }
  };

  // URL을 도메인별로 그룹화
  const groupUrlsByDomain = (urls: string[]) => {
    const groups: {[key: string]: string[]} = {};
    urls.forEach(url => {
      try {
        const domain = new URL(url).hostname;
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(url);
      } catch (e) {
        // URL 파싱 실패 시 기본 그룹에 추가
        if (!groups['기타']) {
          groups['기타'] = [];
        }
        groups['기타'].push(url);
      }
    });
    return groups;
  };

  // 카테고리 토글
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // URL 선택 토글
  const toggleUrlSelection = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  // 전체 선택/해제
  const toggleAllTemplates = () => {
    if (selectedTemplates.length === Object.keys(templateUrls).length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(Object.keys(templateUrls));
    }
  };

  // 도메인별 전체 선택/해제
  const toggleAllUrlsInDomain = (domain: string, urls: string[]) => {
    const domainUrls = urls;
    const allSelected = domainUrls.every(url => selectedUrls.includes(url));
    
    if (allSelected) {
      setSelectedUrls(prev => prev.filter(url => !domainUrls.includes(url)));
    } else {
      setSelectedUrls(prev => [...new Set([...prev, ...domainUrls])]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            URL 크롤링 관리자
          </h2>
          <p className="text-gray-400 mt-2">
            미리 정의된 템플릿과 사용자 정의 URL을 조합하여 Meta 공식 사이트를 크롤링합니다.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-orange-300 border-orange-500/30 px-3 py-1">
            <BarChart3 className="w-3 h-3 mr-1" />
            {getSelectedUrlCount()}개 URL 선택됨
          </Badge>
          <Button
            onClick={() => setShowUrlSelector(!showUrlSelector)}
            variant="outline"
            size="sm"
            className="bg-orange-600/10 border-orange-500/30 text-orange-300 hover:bg-orange-600/20"
          >
            <Filter className="w-4 h-4 mr-2" />
            URL 선택기
          </Button>
        </div>
      </div>

      {/* URL 선택기 드롭다운 */}
      {showUrlSelector && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Layers className="w-5 h-5 text-orange-400" />
                크롤링된 URL 선택
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              도메인별로 그룹화된 크롤링된 URL에서 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="URL 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* 도메인별 URL 그룹 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(groupUrlsByDomain(Object.values(templateUrls).flat())).map(([domain, urls]) => (
                  <div key={domain} className="border border-gray-600/30 rounded-lg overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        className="flex-1 justify-between p-3 h-auto bg-gray-700/30 hover:bg-gray-700/50 text-left"
                        onClick={() => toggleCategory(domain)}
                      >
                        <div className="flex items-center space-x-3">
                          <Globe className="w-4 h-4 text-orange-400" />
                          <div>
                            <div className="font-medium text-white">{domain}</div>
                            <div className="text-sm text-gray-400">{urls.length}개 URL</div>
                          </div>
                        </div>
                        {expandedCategories[domain] ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllUrlsInDomain(domain, urls);
                        }}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        title={urls.every(url => selectedUrls.includes(url)) ? "전체 해제" : "전체 선택"}
                      >
                        {urls.every(url => selectedUrls.includes(url)) ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedCategories[domain] && (
                      <div className="border-t border-gray-600/30 bg-gray-800/30">
                        <div className="p-3 space-y-1">
                          {urls.map((url, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedUrls.includes(url)
                                  ? 'bg-orange-500/20 border border-orange-500/30'
                                  : 'bg-gray-700/20 hover:bg-gray-700/40'
                              }`}
                              onClick={() => toggleUrlSelection(url)}
                            >
                              <Checkbox
                                checked={selectedUrls.includes(url)}
                                onChange={() => toggleUrlSelection(url)}
                              />
                              <LinkIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-300 truncate flex-1">{url}</span>
                              <ExternalLink className="w-3 h-3 text-gray-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 선택된 URL 요약 */}
              {selectedUrls.length > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-300">
                      {selectedUrls.length}개 URL 선택됨
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUrls([])}
                      className="text-orange-300 hover:text-orange-200"
                    >
                      <X className="w-3 h-3 mr-1" />
                      모두 해제
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 크롤링 모드 선택 */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-blue-400" />
            크롤링 모드 선택
          </CardTitle>
          <CardDescription className="text-gray-400">
            크롤링 방식을 선택하여 URL을 관리하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-300 rounded-xl group ${
                crawlingMode === 'predefined' 
                  ? 'ring-2 ring-blue-500 bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                  : 'hover:bg-gray-700/40 border-gray-600/50 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/10'
              }`}
              onClick={() => setCrawlingMode('predefined')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    crawlingMode === 'predefined' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-blue-500 group-hover:to-blue-600'
                  }`}>
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-semibold group-hover:text-blue-300 transition-colors duration-200">
                      미리 정의된 URL
                    </CardTitle>
                    <CardDescription className="text-gray-200 group-hover:text-white transition-colors duration-200">
                      검증된 URL 템플릿만 사용
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs px-2 py-1">
                    안전한 크롤링
                  </Badge>
                  {crawlingMode === 'predefined' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all duration-300 rounded-xl group ${
                crawlingMode === 'custom' 
                  ? 'ring-2 ring-green-500 bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                  : 'hover:bg-gray-700/40 border-gray-600/50 hover:border-green-400/30 hover:shadow-lg hover:shadow-green-500/10'
              }`}
              onClick={() => setCrawlingMode('custom')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    crawlingMode === 'custom' 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-green-500 group-hover:to-green-600'
                  }`}>
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-semibold group-hover:text-green-300 transition-colors duration-200">
                      사용자 정의 URL
                    </CardTitle>
                    <CardDescription className="text-gray-200 group-hover:text-white transition-colors duration-200">
                      직접 URL 입력
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/50 text-xs px-2 py-1">
                    유연한 크롤링
                  </Badge>
                  {crawlingMode === 'custom' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all duration-300 rounded-xl group ${
                crawlingMode === 'hybrid' 
                  ? 'ring-2 ring-purple-500 bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                  : 'hover:bg-gray-700/40 border-gray-600/50 hover:border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/10'
              }`}
              onClick={() => setCrawlingMode('hybrid')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    crawlingMode === 'hybrid' 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-purple-500 group-hover:to-purple-600'
                  }`}>
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-semibold group-hover:text-purple-300 transition-colors duration-200">
                      하이브리드
                    </CardTitle>
                    <CardDescription className="text-gray-200 group-hover:text-white transition-colors duration-200">
                      템플릿 + 사용자 정의
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 text-xs px-2 py-1">
                    통합 크롤링
                  </Badge>
                  {crawlingMode === 'hybrid' && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 미리 정의된 URL 템플릿 선택 */}
      {crawlingMode !== 'custom' && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Layers className="w-5 h-5 text-blue-400" />
                  URL 템플릿 관리
                </CardTitle>
                <CardDescription className="text-gray-400">
                  검증된 Meta 공식 사이트 템플릿을 선택하고 관리하세요.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-blue-300 border-blue-500/30">
                  {Object.keys(templateUrls).length}개 템플릿
                </Badge>
                <Button
                  onClick={toggleAllTemplates}
                  variant="outline"
                  size="sm"
                  className="bg-green-600/10 hover:bg-green-600/20 text-green-300 border-green-500/30"
                >
                  {selectedTemplates.length === Object.keys(templateUrls).length ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      전체 해제
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      전체 선택
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setNewTemplateName('')}
                  variant="outline"
                  size="sm"
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border-blue-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 템플릿 추가
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(templateUrls).map(([name, urls]) => (
                <Card key={name} className={`relative group transition-all duration-300 rounded-xl ${
                  editingTemplate === name
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : selectedTemplates.includes(name)
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/50'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox 
                          checked={selectedTemplates.includes(name)}
                          onCheckedChange={() => toggleTemplate(name)}
                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-base text-white flex items-center space-x-2">
                            {name}
                            {editingTemplate === name && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                편집 중
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {urls.length}개 URL
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingTemplate(name)}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(name)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {editingTemplate === name ? (
                      <div className="space-y-2">
                        {urls.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={url}
                              onChange={(e) => updateTemplateUrl(name, index, e.target.value)}
                              className="text-sm"
                              placeholder="URL 입력"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTemplateUrl(name, index)}
                              className="h-8 w-8 p-0 text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTemplateUrl(name)}
                            className="text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            URL 추가
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveTemplate(name)}
                            className="text-xs"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            저장
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditingTemplate}
                            className="text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {urls.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <Globe className="w-3 h-3" />
                            <span className="truncate">{url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 새 템플릿 추가 폼 */}
            {!editingTemplate && (
              <Card className="mt-4 border-dashed border-2 border-gray-600 rounded-xl">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">템플릿 이름</Label>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="예: Facebook Help (한국어)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">URL 목록</Label>
                      <div className="space-y-2 mt-1">
                        {newTemplateUrls.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...newTemplateUrls];
                                newUrls[index] = e.target.value;
                                setNewTemplateUrls(newUrls);
                              }}
                              placeholder="https://example.com"
                              className="text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newUrls = newTemplateUrls.filter((_, i) => i !== index);
                                setNewTemplateUrls(newUrls);
                              }}
                              className="h-8 w-8 p-0 text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewTemplateUrls([...newTemplateUrls, ''])}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          URL 추가
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addNewTemplate}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        템플릿 추가
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewTemplateName('');
                          setNewTemplateUrls(['']);
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* 사용자 정의 URL 입력 */}
      {crawlingMode !== 'predefined' && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>사용자 정의 URL</CardTitle>
            <CardDescription>크롤링하고 싶은 URL을 직접 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                placeholder="새 URL 입력 (예: https://ko-kr.facebook.com/business)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomUrl();
                  }
                }}
              />
              <Button onClick={addCustomUrl} disabled={!newUrl.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {customUrls.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">등록된 URL 목록</h4>
                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {customUrls.length}개 URL
                  </Badge>
                </div>
                <div className="space-y-2">
                  {customUrls.map((url, index) => (
                    <div key={index} className="group flex items-center space-x-3 p-3 bg-gray-700/30 border border-gray-600/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">
                            {url}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                            대기 중
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          크롤링 대기 상태
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUrl(url)}
                          disabled={deletingUrl === url}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          {deletingUrl === url ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 고급 설정 */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-purple-400" />
            고급 설정
          </CardTitle>
          <CardDescription className="text-gray-400">
            크롤링 동작을 세밀하게 제어할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <Checkbox 
              id="extractSubPages"
              checked={extractSubPages}
              onCheckedChange={(checked) => setExtractSubPages(checked as boolean)}
              className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
            />
            <div className="flex-1">
              <label htmlFor="extractSubPages" className="text-sm font-medium text-white cursor-pointer">
                하위 페이지 자동 추출 (사이트맵 기반)
              </label>
              <p className="text-xs text-gray-400 mt-1">
                활성화하면 선택된 URL의 하위 페이지들을 자동으로 찾아서 크롤링합니다.
              </p>
            </div>
            <Badge variant="outline" className="text-purple-300 border-purple-500/30">
              {extractSubPages ? '활성화' : '비활성화'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 크롤링 진행 상황 */}
      {crawlingProgress.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-gray-700/50 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                <CardTitle className="text-white">크롤링 진행 상황</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                  {crawlingProgress.filter(p => p.status === 'completed').length}개 완료
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {crawlingProgress.filter(p => p.status === 'crawling').length}개 진행 중
                </Badge>
                <Badge variant="outline" className="text-xs bg-gray-500/20 text-gray-300 border-gray-500/30">
                  {crawlingProgress.filter(p => p.status === 'pending').length}개 대기 중
                </Badge>
                {crawlingProgress.filter(p => p.status === 'failed').length > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                    {crawlingProgress.filter(p => p.status === 'failed').length}개 실패
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-gray-400">
              전체 {crawlingProgress.length}개 URL 중 {crawlingProgress.filter(p => p.status === 'completed').length}개 완료
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crawlingProgress.map((progress, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                    progress.status === 'completed' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : progress.status === 'failed'
                      ? 'bg-red-500/10 border-red-500/30'
                      : progress.status === 'crawling'
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-gray-700/30 border-gray-600/50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {progress.status === 'pending' && (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                      </div>
                    )}
                    {progress.status === 'crawling' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    )}
                    {progress.status === 'completed' && (
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {progress.status === 'failed' && (
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-white truncate">
                        {progress.url}
                      </span>
                    </div>
                    {progress.message && (
                      <p className="text-xs text-gray-400 truncate">
                        {progress.message}
                      </p>
                    )}
                    
                    {/* 발견된 하위 페이지 표시 */}
                    {progress.discoveredUrls && progress.discoveredUrls.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-300">
                            발견된 하위 페이지 ({progress.discoveredUrls.length}개)
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllDiscoveredUrls(progress.url, progress.discoveredUrls!)}
                              className="h-6 px-2 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                            >
                              {selectedDiscoveredUrls[progress.url]?.length === progress.discoveredUrls.length ? '전체 해제' : '전체 선택'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDiscoveredUrls(progress.url)}
                              className="h-6 px-2 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                            >
                              {showDiscoveredUrls[progress.url] ? '숨기기' : '보기'}
                            </Button>
                          </div>
                        </div>
                        
                        {showDiscoveredUrls[progress.url] && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {progress.discoveredUrls.map((discovered, idx) => (
                              <div 
                                key={idx}
                                className={`flex items-center space-x-2 p-2 rounded border transition-colors ${
                                  selectedDiscoveredUrls[progress.url]?.includes(discovered.url)
                                    ? 'bg-purple-500/20 border-purple-500/50'
                                    : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-600/30'
                                }`}
                              >
                                <Checkbox
                                  checked={selectedDiscoveredUrls[progress.url]?.includes(discovered.url) || false}
                                  onCheckedChange={() => toggleDiscoveredUrlSelection(progress.url, discovered.url)}
                                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-white truncate">
                                      {discovered.title || discovered.url}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        discovered.source === 'sitemap' 
                                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                          : discovered.source === 'robots'
                                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                          : discovered.source === 'links'
                                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                      }`}
                                    >
                                      {discovered.source}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">
                                    {discovered.url}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(discovered.url, '_blank')}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600/50"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="outline"
                      className={`text-xs font-medium ${
                        progress.status === 'completed' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                          : progress.status === 'failed'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : progress.status === 'crawling'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}
                    >
                      {progress.status === 'pending' && '대기 중'}
                      {progress.status === 'crawling' && '크롤링 중'}
                      {progress.status === 'completed' && '완료'}
                      {progress.status === 'failed' && '실패'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 전체 진행률 표시 */}
            <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                <span className="text-white font-medium">크롤링 진행 중...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 크롤링 실행 버튼 */}
      <div className="flex justify-center">
        <Button 
          onClick={handleStartCrawling}
          disabled={isCrawling || getSelectedUrlCount() === 0}
          size="lg"
          className={`w-full max-w-md h-14 text-lg font-semibold transition-all duration-300 ${
            isCrawling || getSelectedUrlCount() === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isCrawling ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              크롤링 진행 중...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-3" />
              크롤링 시작 ({getSelectedUrlCount()}개 URL)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
