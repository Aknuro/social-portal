import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Cabinet.css';

const TABS = ['Мои заявки', 'Мои проекты', 'Профиль'];

const statusLabel = {
  pending:  { text: '⏳ На рассмотрении', cls: 'status-pending' },
  approved: { text: '✅ Принята',          cls: 'status-approved' },
  rejected: { text: '❌ Отклонена',        cls: 'status-rejected' },
};

export default function Cabinet() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Мои заявки');
  const [applications, setApplications] = useState([]);
  const [myProjects, setMyProjects]     = useState([]);
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [editMode, setEditMode]         = useState(false);
  const [form, setForm]                 = useState({});
  const [skillInput, setSkillInput]     = useState('');
  const [saveMsg, setSaveMsg]           = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const [appsRes, projRes, meRes] = await Promise.all([
          api.get('/applications/my'),
          api.get('/projects/my'),
          api.get('/auth/me'),
        ]);
        setApplications(appsRes.data);
        setMyProjects(projRes.data);
        setProfile(meRes.data);
        setForm({
          name: meRes.data.name || '',
          bio: meRes.data.bio || '',
          city: meRes.data.city || '',
          phone: meRes.data.phone || '',
          experience: meRes.data.experience || '',
          skills: meRes.data.skills || [],
          completedProjects: (meRes.data.completedProjects || []).join('\n'),
          avatar: meRes.data.avatar || '',
        });
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user, navigate]);

  const cancelApp = async (id) => {
    if (!window.confirm('Отменить заявку?')) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch { alert('Ошибка'); }
  };

  const markComplete = async (id) => {
    try {
      await api.put(`/projects/${id}`, { status: 'completed' });
      setMyProjects(prev => prev.map(p => p._id === id ? { ...p, status: 'completed' } : p));
    } catch { alert('Ошибка'); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Удалить проект?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setMyProjects(prev => prev.filter(p => p._id !== id));
    } catch { alert('Ошибка'); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput('');
  };
  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter(x => x !== s) });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      const payload = {
        ...form,
        completedProjects: form.completedProjects.split('\n').map(s => s.trim()).filter(Boolean),
      };
      const { data } = await api.put('/auth/profile', payload);
      setProfile(data);
      setEditMode(false);
      setSaveMsg('✅ Профиль сохранён!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { alert('Ошибка сохранения'); }
  };

  if (!user) return null;
  if (loading) return <div className="cab-loading">⏳ Загрузка...</div>;

  return (
    <div className="cabinet-page">
      <div className="profile-card">
        <div className="avatar">
          {profile?.avatar
            ? <img src={profile.avatar} alt="avatar" />
            : (profile?.name || user.name)[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{profile?.name || user.name}</h2>
          <p>{user.email}</p>
          {profile?.city && <p className="profile-city">📍 {profile.city}</p>}
        </div>
        <div className="profile-header-btns">
          <Link to="/create" className="btn-new-project">+ Новый проект</Link>
          <button className="btn-logout-cab" onClick={() => { logout(); navigate('/'); }}>Выйти</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {t === 'Мои заявки'  && applications.length > 0 && <span className="badge">{applications.length}</span>}
            {t === 'Мои проекты' && myProjects.length > 0    && <span className="badge">{myProjects.length}</span>}
          </button>
        ))}
      </div>

      {/* TAB: Мои заявки */}
      {tab === 'Мои заявки' && (
        <div className="tab-content">
          {applications.length === 0 ? (
            <div className="empty-state"><span>📋</span><p>Заявок пока нет</p><Link to="/projects" className="btn-find">Найти проект</Link></div>
          ) : (
            <div className="apps-list">
              {applications.map(app => (
                <div className="app-card" key={app._id}>
                  <div className="app-info">
                    <Link to={`/projects/${app.project?._id}`} className="app-title">{app.project?.title || 'Проект удалён'}</Link>
                    <div className="app-meta">
                      {app.project?.category && <span>{app.project.category}</span>}
                      {app.project?.date     && <span>📅 {app.project.date}</span>}
                      {app.project?.location && <span>📍 {app.project.location}</span>}
                    </div>
                    {app.message && <p className="app-message">💬 {app.message}</p>}
                  </div>
                  <div className="app-right">
                    <span className={`status-badge ${statusLabel[app.status]?.cls}`}>{statusLabel[app.status]?.text}</span>
                    {app.status === 'pending' && <button className="btn-cancel" onClick={() => cancelApp(app._id)}>Отменить</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Мои проекты */}
      {tab === 'Мои проекты' && (
        <div className="tab-content">
          {myProjects.length === 0 ? (
            <div className="empty-state"><span>🚀</span><p>Вы ещё не создавали проектов</p><Link to="/create" className="btn-find">Создать проект</Link></div>
          ) : (
            <div className="my-projects-list">
              {myProjects.map(p => (
                <div className="my-project-card" key={p._id}>
                  <div className="mp-left">
                    <div className="mp-status-dot" style={{ background: p.status === 'completed' ? '#27ae60' : '#f39c12' }} />
                    <div>
                      <Link to={`/projects/${p._id}`} className="mp-title">{p.title}</Link>
                      <div className="mp-meta">
                        <span>{p.category}</span>
                        <span>📅 {p.date}</span>
                        <span>👥 {p.spots} мест</span>
                        <span className={p.status === 'completed' ? 'tag-done' : 'tag-active'}>
                          {p.status === 'completed' ? 'Завершён' : 'Активен'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mp-actions">
                    <Link to={`/projects/${p._id}/manage`} className="btn-manage">👥 Заявки</Link>
                    {p.status === 'active' && <button className="btn-complete" onClick={() => markComplete(p._id)}>✓ Завершить</button>}
                    <button className="btn-del" onClick={() => deleteProject(p._id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Профиль */}
      {tab === 'Профиль' && (
        <div className="tab-content">
          {saveMsg && <div className="save-msg">{saveMsg}</div>}
          {!editMode ? (
            <div className="profile-view">
              {profile?.avatar && (
                <div className="pv-avatar-big">
                  <img src={profile.avatar} alt="avatar" />
                </div>
              )}
              <div className="pv-section">
                <h3>👤 Основная информация</h3>
                <p><b>Имя:</b> {profile?.name}</p>
                {profile?.city  && <p><b>Город:</b> {profile.city}</p>}
                {profile?.phone && <p><b>Телефон:</b> {profile.phone}</p>}
                {profile?.bio   ? <p><b>О себе:</b> {profile.bio}</p> : <p className="empty-field">Расскажите о себе...</p>}
              </div>
              {profile?.skills?.length > 0 && (
                <div className="pv-section">
                  <h3>🛠 Навыки</h3>
                  <div className="skills-list">{profile.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                </div>
              )}
              {profile?.experience && (
                <div className="pv-section">
                  <h3>💼 Опыт</h3>
                  <p className="pre-wrap">{profile.experience}</p>
                </div>
              )}
              {profile?.completedProjects?.length > 0 && (
                <div className="pv-section">
                  <h3>🏆 Пройденные проекты</h3>
                  <ul className="cp-list">{profile.completedProjects.map((cp, i) => <li key={i}>✔ {cp}</li>)}</ul>
                </div>
              )}
              <button className="btn-edit-profile" onClick={() => setEditMode(true)}>✏️ Редактировать профиль</button>
            </div>
          ) : (
            <div className="profile-edit">
              <h3>Редактирование профиля</h3>

              {/* Avatar upload */}
              <div className="avatar-upload-section">
                <div className="avatar-preview">
                  {form.avatar ? <img src={form.avatar} alt="avatar" /> : <span>{(form.name || '?')[0].toUpperCase()}</span>}
                </div>
                <button type="button" className="btn-upload-avatar" onClick={() => fileRef.current.click()}>
                  📸 Загрузить фото
                </button>
                {form.avatar && <button type="button" className="btn-remove-avatar" onClick={() => setForm(f => ({...f, avatar: ''}))}>Удалить</button>}
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>

              <label>Имя</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <label>Город</label>
              <input placeholder="Алматы" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              <label>Телефон</label>
              <input placeholder="+7 700 000 00 00" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <label>О себе</label>
              <textarea rows={3} placeholder="Кратко о себе..." value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
              <label>Опыт волонтёрства</label>
              <textarea rows={4} placeholder="Опишите ваш опыт..." value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} />
              <label>Навыки</label>
              <div className="skill-input-row">
                <input placeholder="Например: Фотография" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                <button type="button" onClick={addSkill} className="btn-add-skill">+ Добавить</button>
              </div>
              <div className="skills-list">
                {form.skills.map(s => (
                  <span key={s} className="skill-tag removable" onClick={() => removeSkill(s)}>{s} ✕</span>
                ))}
              </div>
              <label>Пройденные проекты (каждый с новой строки)</label>
              <textarea rows={4} placeholder={"Уборка парка, 2024\nПомощь приюту, 2023"}
                value={form.completedProjects} onChange={e => setForm({...form, completedProjects: e.target.value})} />
              <div className="edit-actions">
                <button className="btn-save" onClick={saveProfile}>💾 Сохранить</button>
                <button className="btn-cancel-edit" onClick={() => setEditMode(false)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
