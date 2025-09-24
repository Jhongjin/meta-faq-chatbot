'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function CustomTooltip({ 
  children, 
  content, 
  side = 'top', 
  align = 'center',
  sideOffset = 8,
  className = ''
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - sideOffset;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + sideOffset;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - sideOffset;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + sideOffset;
        break;
    }

    // Align adjustment
    if (align === 'start') {
      if (side === 'top' || side === 'bottom') {
        left = triggerRect.left + scrollX;
      } else {
        top = triggerRect.top + scrollY;
      }
    } else if (align === 'end') {
      if (side === 'top' || side === 'bottom') {
        left = triggerRect.right + scrollX - tooltipRect.width;
      } else {
        top = triggerRect.bottom + scrollY - tooltipRect.height;
      }
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, side, align, sideOffset]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 max-w-xs ${className}`}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="whitespace-pre-line leading-relaxed">
            {content}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${
              side === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b' :
              side === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t' :
              side === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' :
              'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </>
  );
}
