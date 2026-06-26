import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'prismjs/themes/prism-tomorrow.css';

export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      style={{ color: 'var(--text-primary)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <pre className={className} style={{ background: 'var(--code-bg)', borderRadius: 4 }}>
                  <code className={className} {...props}>{children}</code>
                </pre>
              );
            }
            return (
              <code style={{ background: 'var(--code-bg)', padding: '2px 4px', borderRadius: 3, fontSize: '0.85em' }} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>{children}</a>;
          },
          blockquote({ children }) {
            return (
              <blockquote style={{ borderLeft: '4px solid var(--border)', paddingLeft: '1rem', color: 'var(--text-secondary)', marginLeft: 0 }}>
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th style={{ border: '1px solid var(--border)', padding: '8px 12px', background: 'var(--bg-tertiary)', textAlign: 'left' }}>{children}</th>;
          },
          td({ children }) {
            return <td style={{ border: '1px solid var(--border)', padding: '8px 12px' }}>{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
