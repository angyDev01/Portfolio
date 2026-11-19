import type { ReactElement } from 'react'
import Hero from '../components/Hero'
import HomeProjectsMarquee from '../components/HomeProjectsMarquee'
import HomeSkillsPreview from '../components/HomeSkillsPreview'
import About from '../components/About'
import HomeContactBanner from '../components/HomeContactBanner'

export default function HomePage(): ReactElement {
  return (
    <>
      <Hero />
      <HomeProjectsMarquee />
      <HomeSkillsPreview />
      <About />
      <HomeContactBanner />
    </>
  )
}
