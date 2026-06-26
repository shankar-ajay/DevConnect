import React, { useState } from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

const TOOLBAR = [
  { label: 'B', title: 'Bold', wrap: ['**', '**'] },
  { label: 'I', title: 'Italic', wrap: ['_', '_'] },
  { label: '<>', title: 'Inline code', wrap: ['`', '`'] },
  { label: '```', title: 'Code block', wrap: ['```\n', '\n```'] },
  { label: '"', title: 'Quote', prefix: '> ' },
  { label: '—', title: 'Horizontal rule', insert: '\n---\n' },
  { label: '1.', title: 'Ordered list', prefix: '1. ' },
  { label: '•', title: 'Unordered list', prefix: '- ' },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here… (Markdown supported)',
  minRows = 12,
  error,
}) {
  const [preview, setPreview] = useState(false);

  const applyFormat = (btn) => {
    const ta = document.getElementById('md-editor-textarea');
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = value.slice(s, e);
    let newVal = value;
    let newCursorS = s, newCursorE = e;

    if (btn.wrap) {
      newVal = value.slice(0, s) + btn.wrap[0] + selected + btn.wrap[1] + value.slice(e);
      newCursorS = s + btn.wrap[0].length;
      newCursorE = newCursorS + selected.length;
    } else if (btn.prefix) {
      const lines = selected ? selected.split('\n').map((l) => btn.prefix + l).join('\n') : btn.prefix;
      newVal = value.slice(0, s) + lines + value.slice(e);
      newCursorE = s + lines.length;
    } else if (btn.insert) {
      newVal = value.slice(0, s) + btn.insert + value.slice(e);
      newCursorE = s + btn.insert.length;
    }

    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursorS, newCursorE);
    }, 0);
  };

  return (
    <div className="border rounded overflow-hidden" style={{ borderColor: error ? 'var(--danger)' : 'var(--border)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
        {TOOLBAR.map((btn) => (
          <button key={btn.label} type="button" title={btn.title} onClick={() => applyFormat(btn)}
            className="px-2 py-1 text-xs font-mono rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            style={{ color: 'var(--text-secondary)', fontWeight: btn.label === 'B' ? 700 : 400 }}>
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {['Write', 'Preview'].map((tab) => (
            <button key={tab} type="button" onClick={() => setPreview(tab === 'Preview')}
              className="px-3 py-1 text-xs transition-colors"
              style={{
                background: (preview === (tab === 'Preview')) ? 'var(--bg-primary)' : 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: (preview === (tab === 'Preview')) ? 600 : 400,
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="p-4 min-h-48" style={{ background: 'var(--bg-primary)' }}>
          {value ? <MarkdownRenderer content={value} /> : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing to preview</p>}
        </div>
      ) : (
        <textarea
          id="md-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full p-4 text-sm resize-y focus:outline-none font-mono"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            minHeight: `${minRows * 1.6}rem`,
          }}
        />
      )}
      {error && <p className="form-error px-3 pb-2">{error}</p>}
    </div>
  );
}
