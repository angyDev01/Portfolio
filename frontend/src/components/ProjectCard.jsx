import React from 'react'

// Carte de projet avec option d'image de fond et style featured
export default function ProjectCard({title, desc, tech, featured = false, image}){
  const cardClass = `project-card reveal${featured ? ' featured' : ''}${image ? ' has-image' : ''}`
  const style = image ? {
    backgroundImage: `linear-gradient(180deg, rgba(3,10,24,0.18), rgba(3,10,24,0.82)), url(${image})`
  } : undefined

  return (
    <article className={cardClass} style={style}>
      <div className="project-card-overlay">
        <div className="card-content">
          <h3>{title}</h3>
          <p>{desc}</p>
          <p className="meta">Tech : {tech}</p>
        </div>
        <div className="card-actions">
          <a className="btn outline" href="#">Voir</a>
          <a className="btn" href="#">Code</a>
        </div>
      </div>
    </article>
  )
}
