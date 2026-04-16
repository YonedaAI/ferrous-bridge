'use client';
import { useState, useEffect } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 100;
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) {
          current = id;
        }
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="toc-hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle table of contents"
      >
        <span className="toc-hamburger-icon">
          {isOpen ? '✕' : '☰'} Contents
        </span>
      </button>

      {/* TOC nav */}
      <nav className={`toc-nav ${isOpen ? 'toc-open' : ''}`} aria-label="Table of contents">
        <div className="toc-header">Contents</div>
        {headings.map(({ id, text, level }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setIsOpen(false)}
            className={`toc-item ${level === 3 ? 'toc-sub' : ''} ${activeId === id ? 'toc-active' : ''}`}
          >
            {text}
          </a>
        ))}
      </nav>
    </>
  );
}
