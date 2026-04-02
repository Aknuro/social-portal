import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import './ProjectsPage.css';

const CATEGORIES = ['все', 'экология', 'образование', 'здоровье', 'культура', 'спорт', 'волонтёрство', 'другое'];

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const category = searchParams.get('category') || 'все';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: 9 };
        if (category !== 'все') params.category = category;
        if (search) params.search = search;
        const { data } = await api.get('/projects', { params });
        setProjects(data.projects);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        setError('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [category, search, page]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div className="projects-page">
      <div className="container">
        <div className="projects-header">
          <h1>Социальные проекты</h1>
          <p>Найди проект, в котором хочешь участвовать</p>
        </div>

        {/* Search */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍  Поиск проектов..."
            defaultValue={search}
            onKeyDown={e => e.key === 'Enter' && updateParam('search', e.target.value)}
            onChange={e => !e.target.value && updateParam('search', '')}
          />
        </div>

        {/* Category filter */}
        <div className="category-filter">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => updateParam('category', cat === 'все' ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results info */}
        {!loading && <p className="results-info">Найдено проектов: {total}</p>}

        {/* Content */}
        {loading ? (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <h3>Проекты не найдены</h3>
            <p>Попробуй изменить фильтры или поисковый запрос</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                className={`page-btn ${page === i+1 ? 'active' : ''}`}
                onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', i+1); setSearchParams(p); }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
