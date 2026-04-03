import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

const categories = [
  { name: 'Экология',    icon: '🌿' },
  { name: 'Образование', icon: '📚' },
  { name: 'Помощь людям',icon: '🤝' },
  { name: 'Животные',    icon: '🐾' },
  { name: 'Культура',    icon: '🎨' },
  { name: 'Спорт',       icon: '⚽' },
];

export default function Home() {
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  useEffect(() => {
    api.get('/projects/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Меняй мир <span>вместе с нами</span></h1>
          <p>Присоединяйся к социальным проектам, находи единомышленников и делай своё сообщество лучше</p>
          <div className="hero-btns">
            <Link to="/projects" className="btn-primary">Смотреть проекты</Link>
            <Link to="/register" className="btn-outline">Стать участником</Link>
          </div>
        </div>
        <div className="hero-emoji">🌍</div>
      </section>

      {/* Live stats */}
      <section className="stats">
        <div className="stat"><span>{stats.total}</span><p>Проектов создано</p></div>
        <div className="stat"><span>{stats.active}</span><p>Активных сейчас</p></div>
        <div className="stat green"><span>{stats.completed}</span><p>Завершено успешно</p></div>
      </section>

      <section className="categories">
        <h2>Направления</h2>
        <div className="cat-grid">
          {categories.map(c => (
            <Link to={`/projects?category=${c.name}`} key={c.name} className="cat-card">
              <span className="cat-icon">{c.icon}</span>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Хочешь организовать свой проект?</h2>
        <p>Создай проект и найди волонтёров уже сегодня</p>
        <Link to="/create" className="btn-primary">Создать проект</Link>
      </section>
    </div>
  );
}
