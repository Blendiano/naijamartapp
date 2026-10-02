export interface TrendingSearch {
  id: string;
  label: string;
  query: string;
}

export const TRENDING_SEARCHES: TrendingSearch[] = [
  { id: "mens-fashion", label: "Men's Fashion", query: "mens fashion" },
  { id: "womens-fashion", label: "Women's Fashion", query: "womens fashion" },
  { id: "shoes", label: "Shoes", query: "shoes" },
  { id: "accessories", label: "Accessories", query: "accessories" },
  { id: "ankara", label: "Ankara Styles", query: "ankara" },
  { id: "kaftan", label: "Kaftan", query: "kaftan" },
  { id: "aso-oke", label: "Aso Oke", query: "aso oke" },
];
