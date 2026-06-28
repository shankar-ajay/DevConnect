import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import MarkdownEditor from '../components/common/MarkdownEditor';
import { questionsAPI } from '../api/client';
import { extractErrorMessage } from '../utils/helpers';
import { suggestTags } from '../api/groq';

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState('');
  const add = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9#.+-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags([...tags, clean]);
    }
    setInput('');
  };
  const remove = (t) => setTags(tags.filter((x) => x !== t));
  const handleKey = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
  };

  return (
    <div className="form-input flex flex-wrap gap-1.5 min-h-10 items-center cursor-text"
      onClick={() => document.getElementById('tag-input-field')?.focus()}>
      {tags.map((t) => (
        <span key={t} className="tag-pill flex items-center gap-1">
          {t}
          <button type="button" onClick={() => remove(t)} className="hover:text-red-500 font-bold">×</button>
        </span>
      ))}
      <input
        id="tag-input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && add(input)}
        placeholder={tags.length === 0 ? 'e.g. python, react, mysql' : ''}
        className="flex-1 min-w-20 outline-none text-sm bg-transparent"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}

const TIPS = [
  { title: '✍️ Writing a good title', body: 'Pretend you\'re asking a colleague. Include just enough detail to identify the problem.' },
  { title: '📋 Describe the problem', body: 'Include any error messages, relevant code, and what you\'ve already tried.' },
  { title: '🏷️ Tagging', body: 'Include a tag for the programming language, library, or framework your question relates to.' },
];

export default function AskQuestionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ title: '', body: '', tags: [] });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [tagSuggestError, setTagSuggestError] = useState('');

  const handleSuggestTags = async () => {
    setSuggestingTags(true);
    setTagSuggestError('');
    try {
      const suggested = await suggestTags(form.title, form.body);
      if (suggested.length === 0) {
        setTagSuggestError('No tags suggested. Try adding more detail to your title.');
        return;
      }
      // Merge with existing tags, no duplicates, max 5
      const merged = [...new Set([...form.tags, ...suggested])].slice(0, 5);
      setForm((f) => ({ ...f, tags: merged }));
    } catch (err) {
      setTagSuggestError('AI tag suggestion failed. Check your Gemini API key.');
    } finally {
      setSuggestingTags(false);
    }
  };

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 15) e.title = 'Title must be at least 15 characters';
    if (form.body.trim().length < 30) e.body = 'Body must be at least 30 characters';
    if (form.tags.length === 0) e.tags = 'Add at least one tag';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const { data } = await questionsAPI.create(form);
      navigate(`/questions/${data.id}`);
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Ask a public question</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Your question will be seen by thousands of developers. Make it count.
        </p>

        {/* Tips banner */}
        <div className="card p-5 mb-6" style={{ borderColor: 'var(--brand)', borderWidth: 2 }}>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Writing a good question</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TIPS.map((tip) => (
              <div key={tip.title}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{tip.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

        {serverError && (
          <div className="alert alert-error mb-4">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="card p-5">
            <label className="form-label text-base mb-1">Title</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Be specific and concise. Imagine you're asking another developer.
            </p>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. How do I reverse a string in Python?"
              className="form-input"
              style={errors.title ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Body */}
          <div className="card p-5">
            <label className="form-label text-base mb-1">What are the details of your problem?</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Include all information someone would need to answer your question. Markdown is supported.
            </p>
            <MarkdownEditor
              value={form.body}
              onChange={(v) => setForm({ ...form, body: v })}
              placeholder="Describe your problem in detail..."
              error={errors.body}
            />
          </div>

          {/* Tags */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label text-base mb-0">Tags</label>
              <button
                type="button"
                onClick={handleSuggestTags}
                disabled={suggestingTags || !form.title || form.title.trim().length < 10}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all"
                style={{
                  background: suggestingTags ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: suggestingTags ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  opacity: (!form.title || form.title.trim().length < 10) ? 0.5 : 1,
                  cursor: (!form.title || form.title.trim().length < 10) ? 'not-allowed' : 'pointer',
                }}
                title={!form.title || form.title.trim().length < 10 ? 'Enter a title first' : 'Let AI suggest tags'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                {suggestingTags ? 'Suggesting…' : 'AI Suggest Tags'}
              </button>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Add up to 5 tags to describe what your question is about. Press Enter or comma to add.
            </p>
            {tagSuggestError && (
              <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>{tagSuggestError}</p>
            )}
            <TagInput tags={form.tags} setTags={(t) => setForm({ ...form, tags: t })} />
            {errors.tags && <p className="form-error">{errors.tags}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Posting…' : 'Post your question'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Discard
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}