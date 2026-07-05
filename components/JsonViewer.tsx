import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface JsonViewerProps {
  data: any;
  name?: string;
  isLast?: boolean;
  initiallyExpanded?: boolean;
}

export function JsonViewer({ data, name, isLast = true, initiallyExpanded = true }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  const renderValue = (val: any) => {
    if (val === null) return <span className="text-slate-500 font-bold">null</span>;
    if (typeof val === 'boolean') return <span className="text-pink-400 font-bold">{val ? 'true' : 'false'}</span>;
    if (typeof val === 'number') return <span className="text-amber-300">{val}</span>;
    if (typeof val === 'string') return <span className="text-emerald-300">"{val}"</span>;
    return <span>{String(val)}</span>;
  };

  if (!isObject) {
    return (
      <div className="flex font-mono text-xs leading-5">
        {name && <span className="text-cyan-200 mr-2">{name}:</span>}
        {renderValue(data)}
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex font-mono text-xs leading-5">
        {name && <span className="text-cyan-200 mr-2">{name}:</span>}
        <span className="text-slate-500">{isArray ? '[]' : '{}'}</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';

  return (
    <div className="font-mono text-xs leading-5">
      <div 
        className="flex items-center cursor-pointer hover:bg-slate-800/50 rounded px-1 -ml-1 transition-colors group select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-slate-500 group-hover:text-slate-300 mr-1 flex-shrink-0 transition-colors">
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
        {name && <span className="text-cyan-200 mr-2">{name}:</span>}
        <span className="text-slate-400">{bracketOpen}</span>
        {!isExpanded && (
          <span className="text-slate-500 mx-2 italic text-[10px]">
            {isArray ? `${keys.length} items` : `${keys.length} keys`}
          </span>
        )}
        {!isExpanded && <span className="text-slate-400">{bracketClose}</span>}
        {!isExpanded && !isLast && <span className="text-slate-500">,</span>}
      </div>
      
      {isExpanded && (
        <div className="pl-4 border-l border-slate-800/80 ml-0.5">
          {keys.map((key, index) => (
            <JsonViewer 
              key={key} 
              name={isArray ? undefined : key} 
              data={data[key as keyof typeof data]} 
              isLast={index === keys.length - 1} 
            />
          ))}
        </div>
      )}
      
      {isExpanded && (
        <div>
          <span className="text-slate-400">{bracketClose}</span>
          {!isLast && <span className="text-slate-500">,</span>}
        </div>
      )}
    </div>
  );
}
