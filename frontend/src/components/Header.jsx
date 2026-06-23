import React, {useEffect, useState} from 'react'

export default function Header(){
  // État du thème clair/sombre
  const [theme, setTheme] = useState(() => {
    try{
      return localStorage.getItem('theme') || 'dark'
    }catch{ return 'dark'}
  })
  // État du menu mobile burger
  const [menuOpen, setMenuOpen] = useState(false)

  // Applique le thème courant à la balise html et le conserve en localStorage
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme)
    try{ localStorage.setItem('theme', theme) }catch{}
  },[theme])

  function toggleTheme(){
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  function toggleMenu(){
    setMenuOpen(prev => !prev)
  }

  function closeMenu(){
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">
          <img src={theme === 'dark' ? '/assets/logo.svg' : '/assets/logo-light.svg'} alt="Angy.Dev logo" className="logo-img"/>
          <span className="name">Angoa Yao Jean</span>
        </div>

        {/* Bouton burger visible en mobile */}
        <button className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen}>
          <span />
          <span />
          <span />
        </button>

        {/* Navigation principale, s'ouvre en mobile si menuOpen est vrai */}
        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <a href="#about" onClick={closeMenu}>À propos</a>
          <a href="#skills" onClick={closeMenu}>Compétences</a>
          <a href="#projects" onClick={closeMenu}>Projets</a>
          <a href="#/blog" onClick={closeMenu}>Blog</a>
          <a href="#contact" className="btn small" onClick={closeMenu}>Contact</a>
        </nav>

        <div className="header-actions">
          <button className="btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Night'}
          </button>
        </div>
      </div>
    </header>
  )
}
