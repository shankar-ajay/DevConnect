import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import MarkdownEditor from '../components/common/MarkdownEditor';
import { LoadingCenter, ErrorBanner } from '../components/common/UI';
import { questionsAPI } from '../api/client';
import { extractErrorMessage } from '../utils/helpers';
import useAuthStore from '../context/authStore';

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState('');
  const add = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9#.+-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 5) setTags([...tags, clean]);
    setInput('');
  };
  const remove = (t) => setTags(tags.filter((x) => x !== t));
  const handleKey = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
  };
  return (
    <div className="form-input flex flex-wrap gap-1.5 min-h-10 items-center cursor-text"
      onClick={() => document.getElementById('edit-tag-input')?.focus()}>
      {tags.map((t) => (
        <span key={t} className="tag-pill flex items-center gap-1">
          {t}<button type="button" onClick={() => remove(t)} className="hover:text-red-500 font-bold">×</button>
        </span>
      ))}
      <input id="edit-tag-input" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey} onBlur={() => input && add(input)}
        className="flex-1 min-w-20 outline-none text-sm bg-transparent" style={{ color: 'var(--text-primary)' }} />
    </div>
  );
}

export default function EditQuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: '', body: '', tags: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    questionsAPI.get(id).then(({ data }) => {
      if (data.author?.id !== user?.id && !user?.is_admin) {
        navigate(`/questions/${id}`); return;
      }
      setForm({ title: data.title, body: data.body, tags: data.tags?.map((t) => t.name) || [] });
    }).catch(() => navigate('/questions')).finally(() => setLoading(false));
  }, [id, user, navigate]);

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 15) e.title = 'Title must be at least 15 characters';
    if (form.body.trim().length < 30)  e.body  = 'Body must be at least 30 characters';
    if (form.tags.length === 0)        e.tags  = 'Add at least one tag';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setServerError('');
    try {
      await questionsAPI.update(id, form);
      navigate(`/questions/${id}`);
    } catch (err) { setServerError(extractErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Layout><LoadingCenter /></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Edit Question</h1>
        {serverError && <div className="alert alert-error mb-4">{serverError}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-5">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={errors.title ? { borderColor: 'var(--danger)' } : {}} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>
          <div className="card p-5">
            <label className="form-label mb-2">Body</label>
            <MarkdownEditor value={form.body} onChange={(v) => setForm({ ...form, body: v })} error={errors.body} />
          </div>
          <div className="card p-5">
            <label className="form-label mb-2">Tags</label>
            <TagInput tags={form.tags} setTags={(t) => setForm({ ...form, tags: t })} />
            {errors.tags && <p className="form-error">{errors.tags}</p>}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Save edits'}
            </button>
            <button type="button" onClick={() => navigate(`/questions/${id}`)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
