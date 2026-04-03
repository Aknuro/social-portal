import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const load = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;

  const handleBellClick = async () => {
    setShowNotes(!showNotes);
    if (!showNotes && unread > 0) {
      try {
        await api.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">🌱 СоциоПортал</Link>

        <button className="burger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/projects" onClick={() => setMenuOpen(false)}>Проекты</Link>
          {user ? (
            <>
              <Link to="/create" onClick={() => setMenuOpen(false)}>+ Создать</Link>
              <Link to="/cabinet" onClick={() => setMenuOpen(false)}>Кабинет</Link>

              {/* Bell */}
              <div className="bell-wrap">
                <button className="bell-btn" onClick={handleBellClick}>
                  🔔
                  {unread > 0 && <span className="bell-badge">{unread}</span>}
                </button>
                {showNotes && (
                  <div className="notes-dropdown">
                    <div className="notes-header">Уведомления</div>
                    {notifications.length === 0 && <div className="notes-empty">Нет уведомлений</div>}
                    {notifications.map(n => (
                      <div key={n._id} className={`note-item ${n.read ? 'read' : 'unread'}`}
                        onClick={() => { setShowNotes(false); if (n.link) navigate(n.link); }}>
                        <p>{n.message}</p>
                        <span>{new Date(n.createdAt).toLocaleDateString('ru')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-logout" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Войти</Link>
              <Link to="/register" className="btn-nav-reg" onClick={() => setMenuOpen(false)}>Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
