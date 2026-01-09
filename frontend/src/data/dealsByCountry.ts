export interface CountryCategory {
  name: string;
  count: number;
  color: string;
}

export interface CountryDeals {
  country: string;
  total: number;
  categories: CountryCategory[];
}

export const dealsByCountry: CountryDeals[] = [
  {
    country: "United States (US)",
    total: 133861,
    categories: [
      { name: "g1", count: 91149, color: "#ffa940" },
      { name: "getaways", count: 611, color: "#f759ab" },
      { name: "goods", count: 8541, color: "#52c41a" },
      { name: "marketrate-hotel", count: 33560, color: "#ff4d4f" },
    ],
  },
  {
    country: "UK (UK)",
    total: 15480,
    categories: [
      { name: "local", count: 9991, color: "#1890ff" },
      { name: "shopping", count: 4590, color: "#52c41a" },
      { name: "travel", count: 899, color: "#722ed1" },
    ],
  },
  {
    country: "France (FR)",
    total: 11700,
    categories: [
      { name: "local", count: 7837, color: "#1890ff" },
      { name: "shopping", count: 2704, color: "#52c41a" },
      { name: "travel", count: 1159, color: "#722ed1" },
    ],
  },
  {
    country: "Spain (ES)",
    total: 10603,
    categories: [
      { name: "local", count: 9310, color: "#1890ff" },
      { name: "shopping", count: 1252, color: "#52c41a" },
      { name: "travel", count: 41, color: "#722ed1" },
    ],
  },
  {
    country: "Germany (DE)",
    total: 10068,
    categories: [
      { name: "local", count: 7315, color: "#1890ff" },
      { name: "shopping", count: 1882, color: "#52c41a" },
      { name: "travel", count: 871, color: "#722ed1" },
    ],
  },
  {
    country: "Australia (AU)",
    total: 5863,
    categories: [
      { name: "local", count: 5764, color: "#1890ff" },
      { name: "shopping", count: 1, color: "#52c41a" },
      { name: "travel", count: 98, color: "#722ed1" },
    ],
  },
  {
    country: "Italy (IT)",
    total: 4252,
    categories: [
      { name: "local", count: 90, color: "#1890ff" },
      { name: "shopping", count: 3347, color: "#52c41a" },
      { name: "travel", count: 815, color: "#722ed1" },
    ],
  },
  {
    country: "Poland (PL)",
    total: 3679,
    categories: [
      { name: "local", count: 3435, color: "#1890ff" },
      { name: "travel", count: 244, color: "#722ed1" },
    ],
  },
  {
    country: "Canada (CA)",
    total: 2935,
    categories: [
      { name: "g1", count: 2811, color: "#ffa940" },
      { name: "getaways", count: 5, color: "#f759ab" },
      { name: "local", count: 119, color: "#1890ff" },
    ],
  },
  {
    country: "Netherlands (NL)",
    total: 2652,
    categories: [
      { name: "local", count: 1091, color: "#1890ff" },
      { name: "shopping", count: 1226, color: "#52c41a" },
      { name: "travel", count: 335, color: "#722ed1" },
    ],
  },
  {
    country: "Belgium (BE)",
    total: 2122,
    categories: [
      { name: "local", count: 904, color: "#1890ff" },
      { name: "shopping", count: 1218, color: "#52c41a" },
    ],
  },
  {
    country: "United Arab Emirates (AE)",
    total: 2060,
    categories: [
      { name: "local", count: 2045, color: "#1890ff" },
      { name: "shopping", count: 2, color: "#52c41a" },
      { name: "travel", count: 14, color: "#722ed1" },
    ],
  },
  {
    country: "Ireland (IE)",
    total: 481,
    categories: [{ name: "local", count: 466, color: "#1890ff" }],
  },
];

// Color mapping for category tags (Ant Design colors)
export const categoryColorMap: Record<string, string> = {
  g1: "orange",
  getaways: "magenta",
  goods: "cyan",
  "marketrate-hotel": "red",
  local: "blue",
  shopping: "green",
  travel: "purple",
};
