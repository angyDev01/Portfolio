import React from 'react'

// Page détaillée d'un article spécifique du blog
export default function BlogPostPage({post}){
  if(!post){
    return (
      <main className="blog-page">
        <section className="blog hero-blog">
          <div className="container">
            <h1>Article introuvable</h1>
            <p>Le billet que vous cherchez n'existe pas ou a été déplacé.</p>
            <a className="btn outline" href="#/blog">Retour au blog</a>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="blog-page">
      <section className="blog hero-blog reveal visible">
        <div className="container">
          <div className="blog-hero">
            <div>
              <p className="section-tag">Blog</p>
              <h1>{post.title}</h1>
              <p className="post-date">{post.date}</p>
              <p className="section-subtitle">{post.excerpt}</p>
            </div>
            <a className="btn primary" href="#/blog">Retour au blog</a>
          </div>

          <article className="blog-detail">
            {post.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <div className="post-footer" style={{marginTop:'32px'}}>
              <div className="post-tags">
                {post.tags.map(tag => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
