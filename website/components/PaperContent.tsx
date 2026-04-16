'use client';
import { useCallback } from 'react';

interface PaperContentProps {
  html: string;
}

export function PaperContent({ html }: PaperContentProps) {
  const contentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        node.innerHTML = html;
      }
    },
    [html]
  );

  return <div ref={contentRef} className="paper-prose" />;
}
