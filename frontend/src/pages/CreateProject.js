import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CreateProject.css';

const CATEGORIES = ['Экология', 'Образование', 'Помощь людям', 'Животные', 'Культура', 'Спорт'];

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '', date: '', spots: '', image: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="create-page">
        <div className="auth-required">
          <span>🔒</span>
          <p>Нужно войти чтобы создать проект</p>
          <button onClick={() => navigate('/login')} className="btn-go">Войти</button>
        </div>
      </div>
    );
  }

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const { title, description, category, location, date, spots } = form;
    if (!title || !description || !category || !location || !date || !spots) {
      setError('Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/projects', { ...form, spots: Number(form.spots) });
      navigate(`/projects/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <div className="create-card">
        <h1>Создать проект</h1>
        <p className="create-sub">Расскажите о вашем социальном проекте</p>

        {error && <div className="create-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название *</label>
            <input name="title" placeholder="Например: Уборка парка Победы"
              value={form.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Описание *</label>
            <textarea name="description" rows={4} placeholder="Опишите суть проекта..."
              value={form.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Категория *</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="">Выберите...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Мест *</label>
              <input name="spots" type="number" min="1" placeholder="10"
                value={form.spots} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Место *</label>
              <input name="location" placeholder="Город, адрес"
                value={form.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Дата *</label>
              <input name="date" type="date"
                value={form.date} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Фото (URL)</label>
            <input name="image" placeholder="https://..."
              value={form.image} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Создание...' : '🚀 Создать проект'}
          </button>
        </form>
      </div>
    </div>
  );
}
