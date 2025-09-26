"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Users, MessageSquare, TrendingUp } from "lucide-react";

interface TeamStats {
  team: string;
  user_count: number;
  new_users_30d: number;
  new_users_7d: number;
  first_user_created: string;
  last_user_created: string;
}

interface TeamQuestionStats {
  team: string;
  question_count: number;
  questions_30d: number;
  questions_7d: number;
  avg_response_time: number | null;
}

interface TeamStatsProps {
  teamStats: TeamStats[];
  teamQuestionStats: TeamQuestionStats[];
}

export default function TeamStats({ teamStats, teamQuestionStats }: TeamStatsProps) {
  // 팀별 통계를 합치기
  const combinedStats = teamStats.map(teamStat => {
    const questionStat = teamQuestionStats.find(q => q.team === teamStat.team);
    return {
      ...teamStat,
      question_count: questionStat?.question_count || 0,
      questions_30d: questionStat?.questions_30d || 0,
      questions_7d: questionStat?.questions_7d || 0,
      avg_response_time: questionStat?.avg_response_time || null
    };
  });

  // 전체 사용자 수와 질문 수 계산
  const totalUsers = teamStats.reduce((sum, team) => sum + team.user_count, 0);
  const totalQuestions = teamQuestionStats.reduce((sum, team) => sum + team.question_count, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          부서별 사용 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {combinedStats.map((team) => {
          const userPercentage = totalUsers > 0 ? (team.user_count / totalUsers) * 100 : 0;
          const questionPercentage = totalQuestions > 0 ? (team.question_count / totalQuestions) * 100 : 0;
          
          return (
            <div key={team.team} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm font-medium">
                    {team.team}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {team.user_count}명
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {team.question_count}질문
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(questionPercentage)}%
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>사용자 비율</span>
                  <span>{Math.round(userPercentage)}%</span>
                </div>
                <Progress value={userPercentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">7일 신규</div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {team.new_users_7d}명
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">30일 신규</div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {team.new_users_30d}명
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">7일 질문</div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {team.questions_7d}개
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {combinedStats.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>팀별 통계 데이터가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
