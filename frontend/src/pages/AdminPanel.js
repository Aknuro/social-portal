import { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject, getProjectApplications, updateApplicationStatus } from '../services/api';

const CATEGORIES = ['экология', 'образование', 'здоровье', 'спорт', 'культура', 'помощь', 'другое'];
const INITIAL_FORM = { title: '', description: '', category: 'экология', location: '', maxParticipants: '', startDate: '', endDate: '', image: '', status: 'active' };

export default function AdminPanel() {
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [selectedProject, setSelectedProject] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    getProjects({ limit: 100 })
      .then(({ data }) => setProjects(data.projects))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { setFeedback({ type: 'error', text: 'Заполните название и описание' }); return; }
    try {
      setSaving(true);
      setFeedback({ type: '', text: '' });
      const { data } = await createProject(form);
      setProjects((prev) => [data, ...prev]);
      setForm(INITIAL_FORM);
      setFeedback({ type: 'success', text: 'Проект создан!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Ошибка' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить проект?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const loadApplications = async (project) => {
    setSelectedProject(project);
    setTab('applications');
    try {
      const { data } = await getProjectApplications(project._id);
      setApplications(data);
    } catch (err) {
      setApplications([]);
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => a._id === appId ? { ...a, status } : a));
    } catch (err) {
      alert('Ошибка');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Панель управления</h1>
      </div>
      <div className="cabinet-tabs">
        <button className={'tab-btn' + (tab === 'projects' ? ' active' : '')} onClick={() => setTab('projects')}>Проекты</button>
        <button className={'tab-btn' + (tab === 'create' ? ' active' : '')} onClick={() => setTab('create')}>Создать проект</button>
        {selectedProject && (
          <button className={'tab-btn' + (tab === 'applications' ? ' active' : '')} onClick={() => setTab('applications')}>
            Заявки: {selectedProject.title}
          </button>
        )}
      </div>

      {tab === 'create' && (
        <div className="card" style={{ padding: 28, maxWidth: 640 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 20 }}>Новый проект</h2>
          {feedback.text && <div className={'alert alert-' + feedback.type}>{feedback.text}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Название *</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Название проекта" />
            </div>
            <div className="form-group">
              <label className="form-label">Описание *</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Подробное описание..." style={{ minHeight: 120 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Категория</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Активный</option>
                  <option value="draft">Черновик</option>
                  <option value="completed">Завершён</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Место проведения</label>
              <input className="form-control" name="location" value={form.location} onChange={handleChange} placeholder="Город, адрес" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Дата начала</label>
                <input className="form-control" type="date" name="startDate" value={form.startDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Макс. участников</label>
                <input className="form-control" type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} placeholder="0 = без ограничений" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ссылка на изображение</label>
              <input className="form-control" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Создание...' : 'Создать проект'}</button>
          </form>
        </div>
      )}

      {tab === 'projects' && (
        <div>
          {loading ? <div className="loader-full"><div className="spinner" /></div> : (
            projects.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Проектов пока нет</p></div>
            ) : (
              projects.map((p) => (
                <div key={p._id} className="app-item">
                  <div className="app-item-info">
                    <div className="app-item-title">{p.title}</div>
                    <div className="app-item-meta">{p.category} · {p.status} · {new Date(p.createdAt).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => loadApplications(p)}>Заявки</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Удалить</button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {tab === 'applications' && selectedProject && (
        <div>
          <h2 style={{ fontWeight: 600, marginBottom: 20 }}>Заявки на: {selectedProject.title}</h2>
          {applications.length === 0 ? (
            <div className="empty-state"><p className="empty-state-text">Заявок пока нет</p></div>
          ) : (
            applications.map((app) => (
              <div key={app._id} className="app-item">
                <div className="app-item-info">
                  <div className="app-item-title">{app.user?.name} — {app.user?.email}</div>
                  <div className="app-item-meta">
                    {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                    {app.message && ` · «${app.message}»`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '6px 10px' }}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  >
                    <option value="pending">На рассмотрении</option>
                    <option value="approved">Принять</option>
                    <option value="rejected">Отклонить</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
