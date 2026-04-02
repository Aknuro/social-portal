import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        setProject(data.project);
        setApplicantCount(data.applicantCount);
      } catch (err) {
        if (err.response?.status === 404) navigate('/404');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (user) {
      api.get('/applications/my').then(({ data }) => {
        setHasApplied(data.applications.some(a => a.project?._id === id || a.project === id));
      }).catch(() => {});
    }
  }, [id, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!message.trim()) return showToast('Напишите сообщение', 'error');
    setApplyLoading(true);
    try {
      await api.post('/applications', { projectId: id, message });
      setHasApplied(true);
      setShowModal(false);
      setMessage('');
      showToast('Заявка успешно подана!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка при подаче заявки', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить проект?')) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast('Проект удалён', 'info');
      navigate('/projects');
    } catch {
      showToast('Ошибка при удалении', 'error');
    }
  };

  if (loading) return <div className="detail-loading"><div className="loader dark" /></div>;
  if (!project) return null;

  const isOrganizer = user && project.organizer?._id === user._id;
  const date = new Date(project.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="detail-page">
      <div className="container">
        <Link to="/projects" className="back-link">← Все проекты</Link>

        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-header">
              <span className="detail-category">{project.category}</span>
              <h1>{project.title}</h1>
              <div className="detail-meta">
                <span>📅 Начало: {date}</span>
                <span>📍 {project.location}</span>
                <span>👥 {applicantCount} участников</span>
                {project.maxParticipants > 0 && <span>🎯 Мест: {project.maxParticipants}</span>}
              </div>
            </div>

            <div className="detail-body">
              <h2>Описание проекта</h2>
              <p>{project.description}</p>

              {project.tags && project.tags.length > 0 && (
                <div className="detail-tags">
                  {project.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="detail-sidebar">
            {/* Organizer */}
            <div className="sidebar-card">
              <h3>Организатор</h3>
              <div className="organizer-info">
                <div className="org-avatar-lg">{project.organizer?.name?.charAt(0)}</div>
                <div>
                  <p className="org-name">{project.organizer?.name}</p>
                  {project.organizer?.bio && <p className="org-bio">{project.organizer.bio}</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sidebar-card">
              {isOrganizer ? (
                <div className="organizer-actions">
                  <p className="your-project">Это ваш проект</p>
                  <button className="btn-delete" onClick={handleDelete}>Удалить проект</button>
                </div>
              ) : user ? (
                hasApplied ? (
                  <div className="applied-badge">✅ Вы уже подали заявку</div>
                ) : (
                  <button className="btn-apply" onClick={() => setShowModal(true)}>
                    Подать заявку
                  </button>
                )
              ) : (
                <Link to="/login" className="btn-apply">Войдите чтобы участвовать</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <h2>Подача заявки</h2>
            <p className="modal-project">Проект: <strong>{project.title}</strong></p>
            <form onSubmit={handleApply}>
              <label>Расскажите о себе и почему хотите участвовать</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Минимум 10 символов..."
                rows={5}
                maxLength={1000}
              />
              <span className="char-count">{message.length}/1000</span>
              <button type="submit" className="btn-primary" disabled={applyLoading}>
                {applyLoading ? <span className="loader" /> : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
