/** @description 할 일 내용을 정규화한다. */
export function normalizeTodoContent(content: string): string {
  return content.trim();
}

/** @description 메모를 정규화한다. */
export function normalizeTodoMemo(memo?: string): string | null {
  if (memo === undefined) {
    return null;
  }

  const normalizedMemo = memo.trim();
  return normalizedMemo || null;
}

/** @description 검색 키워드를 정규화한다. */
export function normalizeTodoSearchKeyword(keyword: string): string {
  return keyword.trim();
}
