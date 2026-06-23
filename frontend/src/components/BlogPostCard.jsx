import React from 'react'

// Composant carte pour afficher un résumé d'article de blog
export default function BlogPostCard({title, date, excerpt, tags, link}){
  return (
    <article className="blog-post-card reveal">
      <div className="post-header">
        <p className="post-date">{date}</p>
        <h3>{title}</h3>
      </div>
      <p className="post-excerpt">{excerpt}</p>
      <div className="post-footer">
        <div className="post-tags">
          {tags.map(tag => <span key={tag}>{tag}</span>)}
        </div>
        {/* Bouton lire renvoie vers la page complète de l'article */}
        <a className="btn outline" href={link}>Lire</a>
      </div>
    </article>
  )
}
