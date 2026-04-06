import { useState } from 'react'

const ARTIST_NAME = 'Sam Leavitt'

/** Edit this copy for your statement (add or remove <p> blocks as needed). */
const ARTIST_STATEMENT = (
  <>
    <p>
      I work across photography, digital media, and personal practice—treating
      the portfolio as both archive and experiment. Pieces here span coursework,
      independent projects, and ongoing curiosity.
    </p>
    <p>
      I am drawn to material that sits between clarity and ambiguity: images
      that ask for a second look, motion that refuses a single reading, and tools
      that feel honest about their limits.
    </p>
    <p>
      This site is a living document. New work replaces placeholders as the
      semester and studio practice evolve.
    </p>
  </>
)

const PHOTO_SRC = '/artist-photo.jpg'

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
