import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectCard.css';

const categoryColors = {
  'Экология': '#27ae60',
  'Образование': '#2980b9',
  'Помощь людям': '#e74c3c',
  'Животные': '#f39c12',
  'Культура': '#8e44ad',
  'Спорт': '#16a085',
};

export default function ProjectCard({ project }) {
  const color = categoryColors[project.category] || '#2ecc71';

  return (
    <Link to={`/projects/${project._id}`} className="project-card">
      <div className="card-category" style={{ backgroundColor: color + '20', color }}>
        {project.category}
      </div>
      <h3 className="card-title">{project.title}</h3>
      <p className="card-desc">{project.description.slice(0, 100)}...</p>
      <div className="card-footer">
        <span>📍 {project.location}</span>
        <span>📅 {project.date}</span>
        <span>👥 {project.spots} мест</span>
      </div>
    </Link>
  );
}
