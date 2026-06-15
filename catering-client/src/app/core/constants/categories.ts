export interface CategoryOption {
  value: string;
  label: string;
}

export const DISH_CATEGORIES: CategoryOption[] = [
  { value: 'starters', label: 'ראשונות' },
  { value: 'mainCourses', label: 'מנות עיקריות' },
  { value: 'salads', label: 'סלטים' },
  { value: 'desserts', label: 'קינוחים' },
  { value: 'breads', label: 'לחמים' },
  { value: 'drinks', label: 'משקאות' },
];

export const CATEGORY_LABELS: Record<string, string> = DISH_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.value] = c.label;
    return acc;
  },
  {} as Record<string, string>,
);

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}
