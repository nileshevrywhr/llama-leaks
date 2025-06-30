import React from 'react';
import { useTheme } from 'next-themes';

const BoltBadge = () => {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full"
        aria-label="Built with Bolt.new"
      >
        <div className={`
          relative w-14 h-14 rounded-full shadow-lg transition-all duration-200
          ${isDark 
            ? 'bg-white hover:shadow-white/30 border border-gray-200' 
            : 'bg-black hover:shadow-black/30 border border-gray-800'
          }
          hover:shadow-xl
        `}>
          {/* Bolt.new Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isDark ? 'text-black' : 'text-white'}
            >
              {/* Lightning bolt icon representing Bolt.new */}
              <path
                d="M13 2L3 14h6l-2 8 10-12h-6l2-8z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        
        {/* Tooltip */}
        <div 
          className={`
            absolute bottom-full right-0 mb-3 px-3 py-1.5 text-xs font-medium rounded-md
            opacity-0 pointer-events-none transition-all duration-200
            group-hover:opacity-100
            ${isDark 
              ? 'bg-white text-black shadow-lg' 
              : 'bg-black text-white shadow-lg'
            }
            whitespace-nowrap
          `}
        >
          Built with Bolt.new
          <div className={`
            absolute top-full right-3 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px]
            border-l-transparent border-r-transparent
            ${isDark ? 'border-t-white' : 'border-t-black'}
          `} />
        </div>
      </a>
    </div>
  );
};

export default BoltBadge;