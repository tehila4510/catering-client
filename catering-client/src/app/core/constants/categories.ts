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

/** Short one-line summary of package limits for admin tables. */
export function formatPackageLimitsSummary(
  limits: object | undefined,
): string {
  if (!limits) return '—';
  const rec = limits as Record<string, number>;
  return (
    DISH_CATEGORIES.map((c) => {
      const count = rec[c.value] ?? 0;
      return count > 0 ? `${c.label} ${count}` : null;
    })
      .filter(Boolean)
      .join(' · ') || '—'
  );
}

/** Maximum dish count per category when editing a package (must match server validation). */
export const PACKAGE_LIMIT_MAX: Record<string, number> = {
  starters: 10,
  mainCourses: 8,
  salads: 15,
  desserts: 8,
  breads: 6,
  drinks: 10,
};
