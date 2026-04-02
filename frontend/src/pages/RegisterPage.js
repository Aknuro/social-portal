import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import './AuthPages.css';

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Имя должно содержать минимум 2 символа';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Введите корректный email';
    if (!form.password || form.password.length < 6) e.password = 'Пароль — минимум 6 символов';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      showToast('Добро пожаловать!', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.message, 'error');
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm({...form, [field]: e.target.value})
  });

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">🌱</div>
        <h1>Регистрация</h1>
        <p className="auth-subtitle">Создай аккаунт и начни участвовать</p>

        <form onSubmit={handleSubmit} noValidate>
          {[
            { field: 'name', label: 'Имя', type: 'text', placeholder: 'Иван Иванов' },
            { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { field: 'password', label: 'Пароль', type: 'password', placeholder: 'Минимум 6 символов' },
            { field: 'confirm', label: 'Повтор пароля', type: 'password', placeholder: 'Повторите пароль' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field} className={`form-group ${errors[field] ? 'has-error' : ''}`}>
              <label>{label}</label>
              <input type={type} placeholder={placeholder} {...f(field)} />
              {errors[field] && <span className="error-msg">{errors[field]}</span>}
            </div>
          ))}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="loader" /> : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
