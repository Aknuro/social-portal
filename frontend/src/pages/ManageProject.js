import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ManageProject.css';

const statusLabel = {
  pending:  { text: '⏳ На рассмотрении', cls: 'status-pending' },
  approved: { text: '✅ Принята',          cls: 'status-approved' },
  rejected: { text: '❌ Отклонена',        cls: 'status-rejected' },
};

export default function ManageProject() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject]   = useState(null);
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null); // expanded applicant card id

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const [projRes, appsRes] = await Promise.all([
          axios.get(`/api/projects/${id}`),
          axios.get(`/api/applications/project/${id}`),
        ]);
        setProject(projRes.data);
        setApps(appsRes.data);
      } catch (err) {
        if (err.response?.status === 403) navigate('/cabinet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  const changeStatus = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
    } catch { alert('Ошибка'); }
  };

  if (loading) return <div className="manage-loading">⏳ Загрузка...</div>;
  if (!project) return <div className="manage-loading">Проект не найден</div>;

  const counts = {
    all:      apps.length,
    pending:  apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="manage-page">
      <Link to="/cabinet" className="back-link">← Назад в кабинет</Link>

      <div className="manage-header">
        <h1>👥 Управление заявками</h1>
        <p className="manage-project-title">Проект: <b>{project.title}</b></p>
      </div>

      {/* Stats */}
      <div className="manage-stats">
        <div className="mstat"><span>{counts.all}</span><p>Всего</p></div>
        <div className="mstat"><span>{counts.pending}</span><p>На рассмотрении</p></div>
        <div className="mstat accepted"><span>{counts.approved}</span><p>Принято</p></div>
        <div className="mstat rejected"><span>{counts.rejected}</span><p>Отклонено</p></div>
      </div>

      {apps.length === 0 ? (
        <div className="no-apps">
          <span>📭</span>
          <p>Заявок пока нет</p>
          <Link to={`/projects/${id}`} className="btn-view-project">Посмотреть проект</Link>
        </div>
      ) : (
        <div className="apps-list">
          {apps.map(app => (
            <div className="applicant-card" key={app._id}>
              {/* Header row */}
              <div className="ac-header">
                <div className="ac-avatar">{app.user?.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="ac-info">
                  <h3>{app.user?.name || 'Аноним'}</h3>
                  {app.user?.city && <span className="ac-city">📍 {app.user.city}</span>}
                  <div className="ac-date">Подана: {new Date(app.createdAt).toLocaleDateString('ru')}</div>
                </div>
                <div className="ac-right">
                  <span className={`status-badge ${statusLabel[app.status]?.cls}`}>
                    {statusLabel[app.status]?.text}
                  </span>
                  <button
                    className="btn-toggle-profile"
                    onClick={() => setExpanded(expanded === app._id ? null : app._id)}
                  >
                    {expanded === app._id ? 'Скрыть резюме ▲' : 'Смотреть резюме ▼'}
                  </button>
                </div>
              </div>

              {/* Motivation message */}
              {app.message && (
                <div className="ac-message">
                  <b>Сопроводительное письмо:</b>
                  <p>{app.message}</p>
                </div>
              )}

              {/* Expanded profile/resume */}
              {expanded === app._id && (
                <div className="ac-resume">
                  {app.user?.bio && (
                    <div className="resume-section">
                      <h4>👤 О себе</h4>
                      <p>{app.user.bio}</p>
                    </div>
                  )}
                  {app.user?.skills?.length > 0 && (
                    <div className="resume-section">
                      <h4>🛠 Навыки</h4>
                      <div className="skills-list">
                        {app.user.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {app.user?.experience && (
                    <div className="resume-section">
                      <h4>💼 Опыт</h4>
                      <p className="pre-wrap">{app.user.experience}</p>
                    </div>
                  )}
                  {app.user?.completedProjects?.length > 0 && (
                    <div className="resume-section">
                      <h4>🏆 Пройденные проекты</h4>
                      <ul className="cp-list">
                        {app.user.completedProjects.map((cp, i) => <li key={i}>✔ {cp}</li>)}
                      </ul>
                    </div>
                  )}
                  {!app.user?.bio && !app.user?.experience && !app.user?.skills?.length && (
                    <p className="no-resume">Пользователь не заполнил профиль</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {app.status === 'pending' && (
                <div className="ac-actions">
                  <button className="btn-approve" onClick={() => changeStatus(app._id, 'approved')}>
                    ✅ Принять
                  </button>
                  <button className="btn-reject" onClick={() => changeStatus(app._id, 'rejected')}>
                    ❌ Отклонить
                  </button>
                </div>
              )}
              {app.status !== 'pending' && (
                <div className="ac-actions">
                  <button className="btn-reset" onClick={() => changeStatus(app._id, 'pending')}>
                    ↩ Вернуть на рассмотрение
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
