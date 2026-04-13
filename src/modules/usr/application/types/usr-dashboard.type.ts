export type UsrSummary = {
  usrId: string;
  usrNm: string;
  usrEmail: string;
  frdCnt: number;
};

export type MonthRangeSummary = {
  yearMonth: string;
  startDt: string;
  endDt: string;
};

export type MonthTodoSummary = {
  todoCompletionRate: number; // 투두 달성률
  completedTodoCnt: number; // 완료한 투두 개수
  remainingTodoCnt: number; // 남은 투두 개수
  totalTodoCnt: number; // 총 투두 개수
};

export type TodoStatusSummary = {
  activeDayCnt: number; // 활동한 날
  streakDayCnt: number; // 연속 달성 스트릭
  perfectDayCnt: number; // 퍼펙트 달성일
  dailyAvgTodoCompletionRate: number; // 하루 평균 완료율
  avgTodoCompletionRateDiff: number; // 어제 vs 하루 평균 완료율 차이
};

export type UsrDashboardResult = {
  usrSummary: UsrSummary;
  monthRange: MonthRangeSummary;
  monthTodoSummary: MonthTodoSummary;
  todoStatusSummary: TodoStatusSummary;
};

export type TodoDashboardMetrics = {
  monthCompletedTodoCnt: number;
  monthTotalTodoCnt: number;
  activeDayCnt: number;
  perfectTodoDates: string[];
  todayCompletionRate: number;
  yesterdayCompletionRate: number;
};
