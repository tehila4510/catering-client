export interface PackageLimits {
  starters: number;
  mainCourses: number;
  salads: number;
  desserts: number;
  breads: number;
  drinks: number;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  limits: PackageLimits;
  featured?: boolean;
  imageUrl?: string;
}
