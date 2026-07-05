import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';

interface Log {
  id: string;
  level: string;
}

interface LogMinimapProps {
  logs: Log[];
  onLogClick: (id: string) => void;
  selectedLogId: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function LogMinimap({ logs, onLogClick, selectedLogId, containerRef }: LogMinimapProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll <= 0) {
          setScrollProgress(0);
        } else {
          setScrollProgress(scrollTop / maxScroll);
        }
      }
    };

    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      // Initial calculation
      handleScroll();
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [containerRef, logs]);

  if (logs.length === 0) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-4 bg-background/40 border-l border-border/50 z-20 flex flex-col overflow-hidden py-2 hidden sm:flex backdrop-blur-sm">
      {/* Scroll indicator overlay */}
      <div 
        className="absolute w-full bg-primary/20 pointer-events-none transition-all duration-75 border-y border-primary/40 rounded-sm shadow-[0_0_8px_rgba(37,99,235,0.3)]"
        style={{ 
          height: Math.max(20, 100 / Math.max(1, logs.length / 20)) + '%',
          top: `${scrollProgress * (100 - Math.max(20, 100 / Math.max(1, logs.length / 20)))}%` 
        }}
      />
      
      {logs.map((log, index) => {
        const isError = log.level === 'error' || log.level === 'fatal';
        const isWarn = log.level === 'warn';
        const isSelected = selectedLogId === log.id;
        
        return (
          <div
            key={log.id}
            onClick={() => onLogClick(log.id)}
            title={`Line ${index + 1} - ${log.level}`}
            className={cn(
              "flex-1 w-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer group relative",
              isError ? "bg-destructive/60 hover:bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.5)] z-10" :
              isWarn ? "bg-amber-500/60 hover:bg-amber-500" :
              "bg-slate-700/30 hover:bg-slate-500/60",
              isSelected && "opacity-100 bg-primary shadow-[0_0_8px_rgba(37,99,235,0.8)] z-20 scale-125"
            )}
          >
            {isError && (
              <span className="absolute right-full mr-1 px-1 py-0.5 rounded text-[8px] font-bold bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                Error
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
