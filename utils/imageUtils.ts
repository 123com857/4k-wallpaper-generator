import { CURATED_IMAGE_IDS } from '../constants';

export const getDailyImageId = (): string => {
  const today = new Date();
  // Use the day of the year to select an image index
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % CURATED_IMAGE_IDS.length;
  return CURATED_IMAGE_IDS[index];
};

export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getFormattedDate = () => {
  const date = new Date();
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    year: date.getFullYear(),
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    fullDate: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  };
};