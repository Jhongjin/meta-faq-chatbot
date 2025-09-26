"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  MessageSquare,
  Mail,
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 팀 목록 (숫자 -> ㄱㄴㄷ 순)
const TEAM_OPTIONS = [
  "1실",
  "2실", 
  "3실",
  "4실",
  "5실",
  "6실",
  "3본부",
  "미디어본부",
  "플랫폼본부",
  "경영본부"
];

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  team: string;
  is_admin: boolean;
  is_active: boolean;
  last_sign_in?: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisWeek: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsersThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [addUserLoading, setAddUserLoading] = useState(false);
  const { toast } = useToast();

  // 사용자 추가 폼 상태
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    team: '미디어본부',
    isAdmin: false
  });

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        filter,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "20"
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
        
        // 통계 계산
        const allUsers = data.data.users;
        const activeUsers = allUsers.filter((user: User) => user.is_active).length;
        const adminUsers = allUsers.filter((user: User) => user.is_admin).length;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newUsersThisWeek = allUsers.filter((user: User) => 
          new Date(user.created_at) > oneWeekAgo
        ).length;

        setStats({
          totalUsers: data.data.pagination.total,
          activeUsers,
          adminUsers,
          newUsersThisWeek
        });
      } else {
        throw new Error(data.error || '사용자 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "사용자 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadUsers();
  }, [searchQuery, filter, sortBy, sortOrder, page]);

  // 사용자 정보 업데이트
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "성공",
          description: "사용자 정보가 업데이트되었습니다."
        });
        loadUsers(); // 목록 새로고침
      } else {
        throw new Error(data.error || '사용자 정보 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 정보 업데이트 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "사용자 정보 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // 사용자 권한 관리
  const handleUserPermission = async (userId: string, action: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));

      const response = await fetch('/api/admin/users/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "성공",
          description: data.data.message
        });
        loadUsers(); // 목록 새로고침
      } else {
        throw new Error(data.error || '사용자 권한 관리에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 권한 관리 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "사용자 권한 관리에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // 사용자 삭제 확인
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`"${user.name}" 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 삭제됩니다.`)) {
      return;
    }

    await handleUserPermission(user.id, 'delete');
  };

  // 관리자 권한 부여/해제
  const handleAdminPermission = async (user: User) => {
    const action = user.is_admin ? 'revoke_admin' : 'grant_admin';
    const actionText = user.is_admin ? '관리자 권한을 해제' : '관리자 권한을 부여';
    
    if (!confirm(`"${user.name}" 사용자에게 ${actionText}하시겠습니까?`)) {
      return;
    }

    await handleUserPermission(user.id, action);
  };

  // 사용자 편집 다이얼로그 열기
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  // 사용자 추가
  const handleAddUser = async () => {
    try {
      setAddUserLoading(true);

      // 이메일에 @nasmedia.co.kr 도메인 추가
      const userData = {
        ...newUser,
        email: newUser.email.includes('@') ? newUser.email : `${newUser.email}@nasmedia.co.kr`
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "성공",
          description: data.data.message
        });
        
        // 폼 초기화
        setNewUser({
          email: '',
          password: '',
          name: '',
          team: '미디어본부',
          isAdmin: false
        });
        
        setAddUserDialogOpen(false);
        loadUsers(); // 목록 새로고침
      } else {
        throw new Error(data.error || '사용자 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 추가 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "사용자 추가에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setAddUserLoading(false);
    }
  };

  // 상태 아이콘 반환
  const getStatusIcon = (user: User) => {
    if (user.is_admin) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    if (user.is_active) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  // 상태 배지 반환
  const getStatusBadge = (user: User) => {
    if (user.is_admin) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">관리자</Badge>;
    }
    if (user.is_active) {
      return <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">활성</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 text-xs whitespace-nowrap">비활성</Badge>;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout currentPage="users">
      <div className="space-y-6">
        {/* 헤더 */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">사용자 관리</h1>
            <p className="text-gray-300 mt-2">사용자 계정을 관리하고 권한을 설정하세요.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setAddUserDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              사용자 추가
            </Button>
            <Button
              onClick={loadUsers}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </motion.div>

        {/* 통계 카드 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Users className="w-5 h-5" />
                총 사용자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <UserCheck className="w-5 h-5 text-green-500" />
                활성 사용자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Crown className="w-5 h-5 text-yellow-500" />
                관리자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.adminUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <UserPlus className="w-5 h-5 text-blue-500" />
                이번 주 신규
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.newUsersThisWeek}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 검색 및 필터 */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="사용자 이름이나 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/80 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800/80 border-gray-700 text-white">
              <SelectValue placeholder="필터 선택" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">전체 사용자</SelectItem>
              <SelectItem value="admin" className="text-white hover:bg-gray-700">관리자</SelectItem>
              <SelectItem value="active" className="text-white hover:bg-gray-700">활성 사용자</SelectItem>
              <SelectItem value="inactive" className="text-white hover:bg-gray-700">비활성 사용자</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800/80 border-gray-700 text-white">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="created_at" className="text-white hover:bg-gray-700">가입일</SelectItem>
              <SelectItem value="name" className="text-white hover:bg-gray-700">이름</SelectItem>
              <SelectItem value="email" className="text-white hover:bg-gray-700">이메일</SelectItem>
              <SelectItem value="team" className="text-white hover:bg-gray-700">소속</SelectItem>
              <SelectItem value="last_sign_in" className="text-white hover:bg-gray-700">최근 로그인</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </motion.div>

        {/* 사용자 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">사용자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">사용자가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">사용자</TableHead>
                        <TableHead className="text-gray-300 min-w-[100px]">소속</TableHead>
                        <TableHead className="text-gray-300 min-w-[80px]">상태</TableHead>
                        <TableHead className="text-gray-300">대화 수</TableHead>
                        <TableHead className="text-gray-300">가입일</TableHead>
                        <TableHead className="text-gray-300">최근 로그인</TableHead>
                        <TableHead className="text-gray-300">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <span className="text-white font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-white">{user.name}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm whitespace-nowrap min-w-[100px]">
                            {user.team}
                          </TableCell>
                          <TableCell className="min-w-[80px]">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(user)}
                              {getStatusBadge(user)}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.conversation_count}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.last_sign_in ? formatDate(user.last_sign_in) : '없음'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                      className="text-gray-400 hover:text-white"
                                      disabled={actionLoading[user.id]}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>사용자 정보 편집</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* 관리자 권한 변경 버튼 */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAdminPermission(user)}
                                      className={user.is_admin ? "text-yellow-400 hover:text-yellow-300" : "text-blue-400 hover:text-blue-300"}
                                      disabled={actionLoading[user.id]}
                                    >
                                      {user.is_admin ? <Shield className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.is_admin ? '관리자 권한 해제' : '관리자 권한 부여'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* 사용자 활성화/비활성화 버튼 */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUserPermission(user.id, user.is_active ? 'deactivate' : 'activate')}
                                      className="text-gray-400 hover:text-white"
                                      disabled={actionLoading[user.id]}
                                    >
                                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.is_active ? '사용자 비활성화' : '사용자 활성화'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* 사용자 삭제 버튼 */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-400 hover:text-red-300"
                                      disabled={actionLoading[user.id]}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>사용자 삭제</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <motion.div 
            className="flex justify-center items-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              이전
            </Button>
            <span className="text-gray-300 px-4">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              다음
            </Button>
          </motion.div>
        )}

        {/* 사용자 편집 다이얼로그 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>사용자 정보 편집</DialogTitle>
              <DialogDescription>
                {selectedUser?.name}의 정보를 편집하세요.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">이름</Label>
                  <Input
                    id="name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">이메일</Label>
                  <Input
                    id="email"
                    value={selectedUser.email}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                  <p className="text-sm text-gray-400 mt-1">이메일은 변경할 수 없습니다.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_admin"
                    checked={selectedUser.is_admin}
                    disabled
                    className="data-[state=checked]:bg-yellow-500"
                  />
                  <Label htmlFor="is_admin" className="text-gray-300">
                    관리자 권한
                  </Label>
                  <p className="text-sm text-gray-400">관리자 권한은 코드에서 설정됩니다.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    handleUpdateUser(selectedUser.id, { name: selectedUser.name });
                    setEditDialogOpen(false);
                  }
                }}
                disabled={actionLoading[selectedUser?.id || '']}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading[selectedUser?.id || ''] ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사용자 추가 다이얼로그 */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>새 사용자 추가</DialogTitle>
              <DialogDescription>
                새로운 사용자 계정을 생성하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-email" className="text-gray-300">이메일 *</Label>
                <div className="flex items-center">
                  <Input
                    id="new-email"
                    type="text"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="사용자명"
                    className="bg-gray-700 border-gray-600 text-white rounded-r-none"
                  />
                  <div className="bg-gray-600 text-gray-300 px-3 py-2 border border-l-0 border-gray-600 rounded-r-md">
                    @nasmedia.co.kr
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1">@nasmedia.co.kr 도메인만 사용 가능합니다.</p>
              </div>
              <div>
                <Label htmlFor="new-password" className="text-gray-300">비밀번호 *</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="최소 6자 이상"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="new-name" className="text-gray-300">이름 *</Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="홍길동"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="new-team" className="text-gray-300">소속 *</Label>
                <Select
                  value={newUser.team}
                  onValueChange={(value) => setNewUser({...newUser, team: value})}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="소속을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {TEAM_OPTIONS.map((team) => (
                      <SelectItem 
                        key={team} 
                        value={team}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-is-admin"
                  checked={newUser.isAdmin}
                  onCheckedChange={(checked) => setNewUser({...newUser, isAdmin: checked})}
                  className="data-[state=checked]:bg-yellow-500"
                />
                <Label htmlFor="new-is-admin" className="text-gray-300">
                  관리자 권한 부여
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddUserDialogOpen(false);
                  setNewUser({
                    email: '',
                    password: '',
                    name: '',
                    team: '미디어본부',
                    isAdmin: false
                  });
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                취소
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={addUserLoading || !newUser.email || !newUser.password || !newUser.name}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addUserLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                사용자 추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
