import type { ReactElement } from 'react'
import Hero from '../components/Hero'
import About from '../components/About'
import HomeProjectsMarquee from '../components/HomeProjectsMarquee'
import HomeSkillsPreview from '../components/HomeSkillsPreview'
import HomeContactBanner from '../components/HomeContactBanner'

export default function HomePage(): ReactElement {
  return (
    <>
      <Hero />
      <About />
      <HomeProjectsMarquee />
      <HomeSkillsPreview />
      <HomeContactBanner />
    </>
  )
}

