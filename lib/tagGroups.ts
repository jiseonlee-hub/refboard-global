// 태그 그룹 설정
// 여기서 원하는 부모-자식 태그 구조를 자유롭게 수정하세요

export const TAG_GROUPS: Record<string, string[]> = {
}

// 특정 태그가 어느 그룹의 자식인지 반환
export function getParentTag(tag: string): string | null {
  for (const [parent, children] of Object.entries(TAG_GROUPS)) {
    if (children.includes(tag)) return parent
  }
  return null
}

// 부모 태그 클릭 시 필터에 포함될 태그 목록 반환
export function getGroupTags(parentTag: string): string[] {
  return TAG_GROUPS[parentTag] ?? [parentTag]
}

// 이 태그가 그룹의 부모인지 확인
export function isParentTag(tag: string): boolean {
  return tag in TAG_GROUPS
}

// 이 태그가 어떤 그룹의 자식인지 확인 (단독으로 사이드바에 표시 안 함)
export function isChildTag(tag: string): boolean {
  return Object.values(TAG_GROUPS).some((children) => children.includes(tag))
}
