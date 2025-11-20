import React, { useState, useEffect, useRef } from 'react';
import { Download, Share2, Maximize2, Info, Palette, RefreshCw } from 'lucide-react';
import { analyzeImage } from './services/geminiService';
import { getDailyImageId, fetchImageAsBase64, downloadImage, getFormattedDate } from './utils/imageUtils';
import { DailyContent, AppState } from './types';
import { STORAGE_KEY } from './constants';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOADING_IMAGE);
  const [content, setContent] = useState<DailyContent | null>(null);
  const [showUI, setShowUI] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toDateString();

  // Main load logic
  useEffect(() => {
    const loadDailyContent = async () => {
      try {
        // 1. Check Local Storage
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed: DailyContent = JSON.parse(cached);
          // If it's from today, use it
          if (parsed.date === todayStr) {
            setContent(parsed);
            setState(AppState.READY);
            return;
          }
        }

        // 2. Fetch New Content
        setState(AppState.LOADING_IMAGE);
        
        // Construct high-quality Unsplash URL
        const imageId = getDailyImageId();
        // Using source.unsplash.com is flaky, so we use images.unsplash.com with parameters
        // w=3840 for 4K, q=85 for quality
        const imageUrl = `https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&q=85&w=3840&auto=format&fit=crop`;
        
        // Fetch blob to convert to base64 (needed for Gemini and download)
        const base64 = await fetchImageAsBase64(imageUrl);
        
        setState(AppState.ANALYZING_AI);
        const analysis = await analyzeImage(base64);

        const newContent: DailyContent = {
          date: todayStr,
          imageUrl: imageUrl,
          imageCredit: "Unsplash Photographer", // In a real app with API key, we'd get the name
          chinesePoem: analysis.chinesePoem,
          englishPoem: analysis.englishPoem,
          colors: analysis.colors,
          base64Image: base64
        };

        // Save to storage
        try {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
        } catch (e) {
            console.warn("Storage full or disabled", e);
        }
       
        setContent(newContent);
        setState(AppState.READY);

      } catch (error) {
        console.error("Failed to load content", error);
        setState(AppState.ERROR);
      }
    };

    loadDailyContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleDownload = () => {
    if (content?.base64Image) {
      downloadImage(content.base64Image, `zenpaper-${getFormattedDate().fullDate}.jpg`);
    }
  };

  const handleShare = async () => {
    if (navigator.share && content) {
      try {
        await navigator.share({
          title: 'ZenPaper Daily',
          text: `${content.chinesePoem}\n${content.englishPoem}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      alert("Web Share API not supported on this browser.");
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const dateInfo = getFormattedDate();

  if (state === AppState.LOADING_IMAGE) return <Loader text="Fetching 4K Views..." />;
  if (state === AppState.ANALYZING_AI) return <Loader text="AI Composing Poetry..." />;
  if (state === AppState.ERROR) return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white flex-col gap-4">
          <p>Something went wrong loading the daily zen.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-black rounded">Retry</button>
      </div>
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black select-none group"
    >
      {/* Background Image */}
      {content && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear scale-100 hover:scale-105"
          style={{ backgroundImage: `url(${content.base64Image || content.imageUrl})` }}
          onClick={() => setShowUI(!showUI)}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Main Content Card - Responsive Positioning */}
      <div 
        className={`absolute transition-all duration-500 ease-in-out
          ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
          bottom-0 md:bottom-12 left-0 md:left-12 right-0 md:right-auto
          w-full md:w-[420px] p-6 md:p-0
        `}
      >
        <div className="glass-panel rounded-t-3xl md:rounded-2xl overflow-hidden text-white p-8 shadow-2xl border border-white/10">
          
          {/* Header: Date */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col">
              <span className="text-5xl font-serif font-bold tracking-tighter">{dateInfo.day}</span>
              <div className="flex items-center gap-2 text-sm font-light tracking-widest opacity-80 uppercase">
                <span>{dateInfo.month}</span>
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span>{dateInfo.weekday}</span>
              </div>
            </div>
            <div className="p-2 rounded-full border border-white/20 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                 <Info size={16} />
            </div>
          </div>

          {/* Poems */}
          <div className="space-y-6 mb-10">
            <div className="relative">
               <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/0 via-white/40 to-white/0"></div>
               <h1 className="text-2xl md:text-3xl font-poem-cn leading-relaxed tracking-wide text-shadow-sm">
                 {content?.chinesePoem}
               </h1>
            </div>
            <p className="text-sm md:text-base font-poem-en opacity-90 italic leading-relaxed font-light text-zinc-200">
              "{content?.englishPoem}"
            </p>
          </div>

          {/* Color Palette */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 opacity-60 text-xs tracking-widest uppercase">
              <Palette size={12} />
              <span>Palette</span>
            </div>
            <div className="flex gap-3">
              {content?.colors.map((color, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full shadow-lg ring-1 ring-white/20 transition-transform hover:scale-110 cursor-pointer relative group/color"
                  style={{ backgroundColor: color }}
                  onClick={() => navigator.clipboard.writeText(color)}
                >
                   <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] px-2 py-1 rounded opacity-0 group-hover/color:opacity-100 transition-opacity whitespace-nowrap">
                     {color}
                   </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <button 
              onClick={handleDownload}
              className="flex flex-col items-center gap-2 text-xs hover:text-cyan-300 transition-colors group/btn"
            >
              <div className="p-3 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                <Download size={20} />
              </div>
              <span>Download</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-2 text-xs hover:text-purple-300 transition-colors group/btn"
            >
              <div className="p-3 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                <Share2 size={20} />
              </div>
              <span>Share</span>
            </button>
            
            <button 
              onClick={toggleFullScreen}
              className="flex flex-col items-center gap-2 text-xs hover:text-emerald-300 transition-colors group/btn"
            >
              <div className="p-3 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                 {isFullScreen ? <RefreshCw size={20} /> : <Maximize2 size={20} />}
              </div>
              <span>{isFullScreen ? 'Reset' : 'Full View'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Hint (only visible if UI is hidden) */}
      {!showUI && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs animate-pulse">
          Tap to show details
        </div>
      )}
    </div>
  );
};

export default App;