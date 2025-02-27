'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface TextAnimationProps {
  content: string;
  className?: string;
  speed?: number;
  delay?: number;
}

const TextAnimation: React.FC<TextAnimationProps> = ({
  content,
  className = '',
  speed = 20, // ms per character
  delay = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const contentRef = useRef(content);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If content changes, reset animation
    if (contentRef.current !== content) {
      contentRef.current = content;
      setDisplayedText('');
      setIsComplete(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
    
    // Start animation after delay
    const delayTimeout = setTimeout(() => {
      let currentIndex = displayedText.length;
      
      if (currentIndex < content.length) {
        const animateText = () => {
          if (currentIndex < content.length) {
            setDisplayedText(content.substring(0, currentIndex + 1));
            currentIndex++;
            
            // Schedule next character
            timeoutRef.current = setTimeout(animateText, speed);
          } else {
            setIsComplete(true);
          }
        };
        
        // Start the animation
        animateText();
      } else {
        setIsComplete(true);
      }
    }, delay);
    
    // Cleanup
    return () => {
      clearTimeout(delayTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, displayedText.length, delay, speed]);

  // Allow user to click to complete animation immediately
  const completeAnimation = () => {
    if (!isComplete) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDisplayedText(content);
      setIsComplete(true);
    }
  };

  return (
    <div className={className} onClick={completeAnimation}>
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize, rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-md font-bold mt-3 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
            h4: ({ children }) => <h4 className="text-sm font-bold mt-2 mb-1">{children}</h4>,
            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-6 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-6 mb-2">{children}</ol>,
            li: ({ children }) => <li className="ml-2 mb-1">{children}</li>,
            a: ({ href, children }) => <a href={href} className="text-[#1DB954] hover:underline">{children}</a>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-600 pl-4 italic mb-2">{children}</blockquote>,
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? 
                <code className="bg-zinc-700 text-zinc-200 px-1 py-0.5 rounded text-xs">{children}</code> : 
                <code className="block bg-zinc-700 text-zinc-200 p-2 rounded text-xs overflow-x-auto my-2">{children}</code>;
            },
            pre: ({ children }) => <pre className="bg-zinc-700 rounded p-2 overflow-x-auto mb-2">{children}</pre>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            table: ({ children }) => <table className="border-collapse table-auto w-full text-sm my-2">{children}</table>,
            th: ({ children }) => <th className="border border-zinc-600 px-2 py-1 bg-zinc-700">{children}</th>,
            td: ({ children }) => <td className="border border-zinc-600 px-2 py-1">{children}</td>,
            hr: () => <hr className="border-zinc-600 my-4" />,
          }}
        >
          {displayedText}
        </ReactMarkdown>
      </div>
      {!isComplete && (
        <span className="inline-block w-1.5 h-4 bg-[#1DB954] ml-0.5 animate-pulse"></span>
      )}
    </div>
  );
};

export default TextAnimation; 