import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const FEATURES = [
  { icon: '🔍', title: 'Найди проект', desc: 'Более 100 активных социальных проектов в разных категориях' },
  { icon: '📝', title: 'Подай заявку', desc: 'Заполни короткую форму и жди подтверждения организатора' },
  { icon: '🤝', title: 'Участвуй', desc: 'Внеси вклад в развитие общества и получи полезный опыт' },
  { icon: '✨', title: 'Создай проект', desc: 'Стань организатором и найди волонтёров для своей идеи' },
];

const CATEGORIES = ['экология', 'образование', 'здоровье', 'культура', 'спорт', 'волонтёрство'];

const HomePage = () => (
  <div className="home">
    {/* Hero */}
    <section className="hero">
      <div className="hero-content fade-in">
        <span className="hero-badge">🌍 Социальная платформа</span>
        <h1>Меняй мир вместе с нами</h1>
        <p>Находи социальные проекты рядом с тобой, присоединяйся к командам и создавай собственные инициативы</p>
        <div className="hero-actions">
          <Link to="/projects" className="btn-primary">Смотреть проекты</Link>
          <Link to="/register" className="btn-outline">Присоединиться</Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-card">🌱<br/>Экология</div>
        <div className="hero-card">📚<br/>Образование</div>
        <div className="hero-card">❤️<br/>Здоровье</div>
        <div className="hero-card">🎭<br/>Культура</div>
      </div>
    </section>

    {/* Stats */}
    <section className="stats">
      <div className="stats-grid">
        <div className="stat-item"><span>100+</span><p>Активных проектов</p></div>
        <div className="stat-item"><span>500+</span><p>Участников</p></div>
        <div className="stat-item"><span>6</span><p>Категорий</p></div>
        <div className="stat-item"><span>50+</span><p>Городов</p></div>
      </div>
    </section>

    {/* Features */}
    <section className="features">
      <div className="container">
        <h2 className="section-title">Как это работает</h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Categories */}
    <section className="categories-section">
      <div className="container">
        <h2 className="section-title">Категории проектов</h2>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/projects?category=${cat}`} className="category-pill">
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="cta">
      <div className="container">
        <h2>Готов сделать мир лучше?</h2>
        <p>Зарегистрируйся и начни участвовать в социальных проектах прямо сейчас</p>
        <Link to="/register" className="btn-primary btn-large">Начать сейчас</Link>
      </div>
    </section>
  </div>
);

export default HomePage;
