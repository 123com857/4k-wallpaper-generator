export interface DailyContent {
  date: string;
  imageUrl: string;
  imageCredit: string;
  chinesePoem: string;
  englishPoem: string;
  colors: string[];
  base64Image?: string; // Cached for download/analysis
}

export interface GeminiResponse {
  chinesePoem: string;
  englishPoem: string;
  colors: string[];
}

export enum AppState {
  LOADING_IMAGE,
  ANALYZING_AI,
  READY,
  ERROR,
}

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
  };
  user: {
    name: string;
    username: string;
  };
}