export type MonthRangeSummary = {
  startDt: string; // 이번 달 시작 날짜 (YYYY. MM. DD)
  endDt: string; // 이번 달 마지막 날짜 (YYYY. MM. DD)
};

export type MonthTodoSummary = {
  todoCompletionRate: number; // 투두 달성률
  completedTodoCnt: number; // 완료한 투두 개수
  remainingTodoCnt: number; // 미 완료 투두 개수
  totalTodoCnt: number; // 등록된 총 투두 개수
};

export type UsrDashboardResult = {
  monthRange: MonthRangeSummary;
  monthTodoSummary: MonthTodoSummary;
};

export type TodoDashboardMetrics = {
  monthCompletedTodoCnt: number; // 이번 달 완료한 투두 개수
  monthTotalTodoCnt: number; // 이번 달 등록된 총 투두 개수
};
