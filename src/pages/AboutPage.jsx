import { useState } from 'react'

const ARTIST_NAME = 'Sam Leavitt'

/** Edit this copy for your statement (add or remove <p> blocks as needed). */
const ARTIST_STATEMENT = (
  <>
    <p>
      Hey, I'm Sam. I'm a DMA student at San Jose State University. I've worked in 
      many different areas, including game development, design, 
      film, and fine art. I've always been drawn to the social aspect of art and design,
      how the artist tries to create an experience for the viewer, whether that be one 
      that challenges, soothes, or simply intrigues them.
    </p>
    <p>
      I am drawn to combined, multivariate material use. Over the course of my painting
      practice, I began to incorporate different paints and other materials into each piece,
      I apply the same concept to my digital work, seeking to include multiple layers
      of tools and functions in each project.
    </p>
    <p>
      This site is a living document. New work replaces old, the purifying fire of
      practice and refinement gives way to ever-improving work.
    </p>
  </>
)

const PHOTO_SRC = 'https://res.cloudinary.com/dixom6gnj/image/upload/v1775551921/portfolio/Leavitt_Assignment_1_-6681-2_gvt9tm.jpg'

export function AboutPage() {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div className="home">
      <div className="home__content">
        <header className="header home__narrow about-page__header">
          <p className="eyebrow">About the artist</p>
          <h1>{ARTIST_NAME}</h1>
        </header>

        <main className="home__main">
          <div className="home__narrow about-page">
            <div className="about-page__layout">
              <section
                className="about-page__photoSection"
                aria-label="Artist portrait"
              >
                <div className="about-page__photoFrame">
                  {photoOk ? (
                    <img
                      src={PHOTO_SRC}
                      alt={ARTIST_NAME}
                      className="about-page__photo"
                      onError={() => setPhotoOk(false)}
                    />
                  ) : (
                    <div className="about-page__photoPlaceholder" aria-hidden>
                      <span>Add your portrait</span>
                      <small>vite-portfolio/public/artist-photo.jpg</small>
                    </div>
                  )}
                </div>
              </section>

              <section
                className="about-page__statementSection"
                aria-labelledby="about-statement-heading"
              >
                <h2
                  id="about-statement-heading"
                  className="about-page__statementTitle"
                >
                  Artist statement
                </h2>
                <div className="about-page__statementBody">{ARTIST_STATEMENT}</div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
