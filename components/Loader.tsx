import React from 'react';

interface LoaderProps {
  text: string;
}

const Loader: React.FC<LoaderProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black text-white">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-2 border-white/30 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-2 border-white/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-4 border-b-2 border-white rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
      </div>
      <p className="text-lg font-light tracking-widest uppercase animate-pulse font-serif">
        {text}
      </p>
    </div>
  );
};

export default Loader;