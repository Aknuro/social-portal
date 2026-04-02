import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <span>🌱 СоцПортал</span>
        <p>Платформа для участия в социальных проектах</p>
      </div>
      <nav className="footer-links">
        <Link to="/projects">Проекты</Link>
        <Link to="/register">Присоединиться</Link>
        <Link to="/create-project">Создать проект</Link>
      </nav>
    </div>
    <div className="footer-bottom">
      © {new Date().getFullYear()} СоцПортал. Курсовой проект.
    </div>
  </footer>
);

export default Footer;
