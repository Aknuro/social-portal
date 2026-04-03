import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import './Projects.css';

const CATEGORIES = ['Все', 'Экология', 'Образование', 'Помощь людям', 'Животные', 'Культура', 'Спорт'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Все';

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true); setError('');
      try {
        const params = {};
        if (activeCategory !== 'Все') params.category = activeCategory;
        if (search.trim()) params.search = search.trim();
        const { data } = await api.get('/projects', { params });
        setProjects(data);
      } catch { setError('Не удалось загрузить проекты'); }
      finally { setLoading(false); }
    };
    fetchProjects();
  }, [activeCategory, search]);

  const setCategory = (cat) => {
    if (cat === 'Все') setSearchParams({});
    else setSearchParams({ category: cat });
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Социальные проекты</h1>
        <p>Найди проект по душе и присоединяйся</p>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* Category filters */}
      <div className="filters">
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {loading && <div className="status-msg">⏳ Загрузка...</div>}
      {error   && <div className="status-msg error">❌ {error}</div>}
      {!loading && !error && projects.length === 0 && (
        <div className="status-msg">Проектов не найдено</div>
      )}

      <div className="projects-grid">
        {projects.map(p => <ProjectCard key={p._id} project={p} />)}
      </div>
    </div>
  );
}
