import React from 'react'
import BlogPostCard from '../components/BlogPostCard'

// Page de liste des articles du blog
export default function BlogPage({posts}){
  return (
    <main className="blog-page">
      <section className="blog hero-blog reveal visible">
        <div className="container">
          <div className="blog-hero">
            <div>
              <p className="section-tag">Blog</p>
              <h1>Notes sur le développement front-end</h1>
              <p className="section-subtitle">Des idées, des conseils et des retours d'expérience pour construire des interfaces modernes et accessibles.</p>
            </div>
            <a className="btn primary" href="#/">Retour à l'accueil</a>
          </div>
          <div className="blog-grid">
            {posts.map(post => <BlogPostCard key={post.slug} {...post} />)}
          </div>
        </div>
      </section>
    </main>
  )
}
