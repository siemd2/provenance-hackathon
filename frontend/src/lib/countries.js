// Country centroids (lat, lng) + display names for the countries that appear in
// the corpus, used to place points and draw journey arcs on the globe.
export const COUNTRIES = {
  CA: { name: "Canada", lat: 56.13, lng: -106.35 },
  US: { name: "United States", lat: 39.8, lng: -98.6 },
  FR: { name: "France", lat: 46.6, lng: 2.2 },
  GB: { name: "United Kingdom", lat: 55.38, lng: -3.44 },
  UK: { name: "United Kingdom", lat: 55.38, lng: -3.44 },
  EU: { name: "European Union", lat: 50.85, lng: 4.35 },
  DE: { name: "Germany", lat: 51.17, lng: 10.45 },
  IT: { name: "Italy", lat: 41.87, lng: 12.57 },
  ES: { name: "Spain", lat: 40.46, lng: -3.75 },
  NL: { name: "Netherlands", lat: 52.13, lng: 5.29 },
  CH: { name: "Switzerland", lat: 46.82, lng: 8.23 },
  SE: { name: "Sweden", lat: 60.13, lng: 18.64 },
  PL: { name: "Poland", lat: 51.92, lng: 19.15 },
  TR: { name: "Turkey", lat: 38.96, lng: 35.24 },
  CN: { name: "China", lat: 35.86, lng: 104.2 },
  HK: { name: "Hong Kong", lat: 22.32, lng: 114.17 },
  TW: { name: "Taiwan", lat: 23.7, lng: 120.96 },
  JP: { name: "Japan", lat: 36.2, lng: 138.25 },
  KR: { name: "South Korea", lat: 35.91, lng: 127.77 },
  VN: { name: "Vietnam", lat: 14.06, lng: 108.28 },
  TH: { name: "Thailand", lat: 15.87, lng: 100.99 },
  MY: { name: "Malaysia", lat: 4.21, lng: 101.98 },
  SG: { name: "Singapore", lat: 1.35, lng: 103.82 },
  ID: { name: "Indonesia", lat: -0.79, lng: 113.92 },
  PH: { name: "Philippines", lat: 12.88, lng: 121.77 },
  IN: { name: "India", lat: 20.59, lng: 78.96 },
  MX: { name: "Mexico", lat: 23.63, lng: -102.55 },
  BR: { name: "Brazil", lat: -14.24, lng: -51.93 },
  AU: { name: "Australia", lat: -25.27, lng: 133.78 },
};

export function countryMeta(code) {
  return COUNTRIES[code] || { name: code || "Unknown", lat: 0, lng: 0 };
}

export function countryName(code) {
  return countryMeta(code).name;
}
