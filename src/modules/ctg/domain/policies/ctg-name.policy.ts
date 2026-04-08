/** @description 카테고리 이름 앞뒤 공백을 제거해 정규화한다. */
export function normalizeCategoryName(ctgName: string): string {
  return ctgName.trim();
}
