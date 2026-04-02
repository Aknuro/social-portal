import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound-emoji">🌿</div>
      <h1>404</h1>
      <p>Страница не найдена</p>
      <Link to="/" className="btn-home">На главную</Link>
    </div>
  );
}
