import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const STARS = [1, 2, 3, 4, 5];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [message, setMessage]       = useState('');
  const [applying, setApplying]     = useState(false);
  const [applyMsg, setApplyMsg]     = useState('');
  const [applyError, setApplyError] = useState('');
  const [appStatus, setAppStatus]   = useState(null);
  const [spotsFull, setSpotsFull]   = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [reviews, setReviews]       = useState([]);
  const [myRating, setMyRating]     = useState(0);
  const [myComment, setMyComment]   = useState('');
  const [reviewMsg, setReviewMsg]   = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, revRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/reviews/project/${id}`),
        ]);
        setProject(projRes.data);
        setReviews(revRes.data);

        if (user) {
          const checkRes = await api.get(`/applications/check/${id}`);
          setAppStatus(checkRes.data.applied ? checkRes.data.status : null);
          setSpotsFull(checkRes.data.spotsFull);
          setApprovedCount(checkRes.data.approvedCount || 0);
        } else {
          // Even non-logged users should see spots status
          const checkRes = await api.get(`/applications/check/${id}`).catch(() => ({ data: {} }));
          setSpotsFull(checkRes.data.spotsFull || false);
          setApprovedCount(checkRes.data.approvedCount || 0);
        }
      } catch { setError('Проект не найден'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    setApplying(true); setApplyMsg(''); setApplyError('');
    try {
      await api.post('/applications', { projectId: id, message });
      setApplyMsg('✅ Заявка успешно подана!');
      setAppStatus('pending');
      setMessage('');
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Ошибка при подаче заявки');
    } finally { setApplying(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить проект?')) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); }
    catch { alert('Ошибка при удалении'); }
  };

  const handleReview = async () => {
    if (!myRating) { setReviewError('Выберите оценку'); return; }
    setReviewError('');
    try {
      const { data } = await api.post('/reviews', { projectId: id, rating: myRating, comment: myComment });
      setReviews(prev => [data, ...prev]);
      setReviewMsg('✅ Отзыв оставлен, спасибо!');
      setMyRating(0); setMyComment('');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Ошибка');
    }
  };

  if (loading) return <div className="detail-status">⏳ Загрузка...</div>;
  if (error)   return <div className="detail-status error">{error}</div>;

  const isOwner     = user && project.author?._id === user.id;
  const isCompleted = project.status === 'completed';
  const canReview   = appStatus === 'approved' && isCompleted;
  const hasReviewed = reviews.some(r => r.author?._id === user?.id);

  return (
    <div className="detail-page">
      <Link to="/projects" className="back-link">← Назад к проектам</Link>

      <div className="detail-card">
        {isCompleted && <div className="completed-banner">🏁 Проект завершён</div>}

        <div className="detail-top">
          <div className="detail-category">{project.category}</div>
          {project.avgRating && (
            <div className="detail-rating">
              ⭐ {project.avgRating} <span>({project.reviewCount} отз.)</span>
            </div>
          )}
        </div>

        <h1>{project.title}</h1>

        <div className="detail-meta">
          <span>📍 {project.location}</span>
          <span>📅 {project.date}</span>
          <span>👤 {project.author?.name}</span>
        </div>

        {/* Spots progress bar */}
        <div className="spots-block">
          <div className="spots-label">
            <span>👥 Участники</span>
            <span className={spotsFull ? 'spots-full-text' : ''}>
              {approvedCount} / {project.spots} мест заполнено
            </span>
          </div>
          <div className="spots-bar">
            <div
              className="spots-fill"
              style={{
                width: `${Math.min((approvedCount / project.spots) * 100, 100)}%`,
                background: spotsFull ? '#e74c3c' : '#2ecc71'
              }}
            />
          </div>
          {spotsFull && !isCompleted && (
            <div className="spots-full-badge">🔒 Все места заняты</div>
          )}
        </div>

        <p className="detail-desc">{project.description}</p>

        {/* Owner actions */}
        {isOwner && (
          <div className="owner-btns">
            <Link to={`/projects/${id}/manage`} className="btn-manage-link">👥 Управлять заявками</Link>
            <button className="btn-delete" onClick={handleDelete}>🗑 Удалить</button>
          </div>
        )}

        {/* Apply section */}
        {!isOwner && !isCompleted && (
          <div className="apply-section">
            <h3>Хочешь участвовать?</h3>

            {appStatus === 'pending'  && <div className="apply-info pending">⏳ Ваша заявка на рассмотрении</div>}
            {appStatus === 'approved' && <div className="apply-info approved">✅ Вы участник этого проекта!</div>}
            {appStatus === 'rejected' && <div className="apply-info rejected">❌ Ваша заявка отклонена</div>}

            {!appStatus && spotsFull && (
              <div className="apply-info rejected">🔒 Все места уже заняты, подача заявок закрыта</div>
            )}

            {!appStatus && !spotsFull && (
              <>
                <textarea
                  placeholder="Почему хотите участвовать? (необязательно)"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                />
                {applyMsg   && <div className="success-msg">{applyMsg}</div>}
                {applyError && <div className="error-msg">{applyError}</div>}
                <button className="btn-apply" onClick={handleApply} disabled={applying}>
                  {applying ? 'Отправка...' : '🙋 Подать заявку'}
                </button>
                {!user && <p className="hint">Нужно <Link to="/login">войти</Link> для подачи заявки</p>}
              </>
            )}
          </div>
        )}

        {!isOwner && isCompleted && !appStatus && (
          <div className="completed-note">Проект завершён. Подача заявок недоступна.</div>
        )}
      </div>

      {/* Reviews */}
      <div className="reviews-section">
        <h2>Отзывы участников {reviews.length > 0 && `(${reviews.length})`}</h2>

        {/* How reviews work hint */}
        {!isCompleted && (
          <div className="reviews-hint">
            💡 Отзывы можно оставить после завершения проекта. Только принятые участники могут писать отзывы.
          </div>
        )}

        {/* Leave review form */}
        {canReview && !hasReviewed && (
          <div className="review-form">
            <h3>⭐ Оставить отзыв</h3>
            <p className="review-form-hint">Вы участвовали в этом проекте — поделитесь впечатлениями!</p>
            <div className="stars-input">
              {STARS.map(s => (
                <button key={s}
                  className={`star-btn ${myRating >= s ? 'active' : ''}`}
                  onClick={() => setMyRating(s)}
                  title={['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'][s]}
                >★</button>
              ))}
              {myRating > 0 && (
                <span className="rating-label">
                  {['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично!'][myRating]}
                </span>
              )}
            </div>
            <textarea
              placeholder="Расскажите как прошёл проект, что понравилось..."
              rows={3}
              value={myComment}
              onChange={e => setMyComment(e.target.value)}
            />
            {reviewError && <div className="error-msg">{reviewError}</div>}
            {reviewMsg   && <div className="success-msg">{reviewMsg}</div>}
            <button className="btn-review" onClick={handleReview}>Отправить отзыв</button>
          </div>
        )}

        {canReview && hasReviewed && (
          <div className="already-reviewed">✅ Вы уже оставили отзыв на этот проект</div>
        )}

        {appStatus === 'approved' && !isCompleted && (
          <div className="review-pending-note">
            🕐 Вы сможете оставить отзыв после завершения проекта
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="no-reviews">Отзывов пока нет</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(r => (
              <div className="review-card" key={r._id}>
                <div className="rv-header">
                  <div className="rv-avatar">
                    {r.author?.avatar
                      ? <img src={r.author.avatar} alt="avatar" />
                      : <span>{r.author?.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <b>{r.author?.name}</b>
                    <div className="rv-stars">{'★'.repeat(r.rating)}<span className="rv-empty-stars">{'★'.repeat(5 - r.rating)}</span></div>
                  </div>
                  <span className="rv-date">{new Date(r.createdAt).toLocaleDateString('ru')}</span>
                </div>
                {r.comment && <p className="rv-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
