import React from 'react'
import { WPPost } from '../../services/api'
import { stripHtml, formatDate, getFeaturedImage, getCategoryName } from '../../utils/helpers'

type Props = {
  post: WPPost
  onClick?: (post: WPPost) => void
}

export const ArticleCard: React.FC<Props> = ({ post, onClick }) => {
  const thumb = getFeaturedImage(post)
  const category = getCategoryName(post)
  const excerpt = post.excerpt?.rendered
    ? stripHtml(post.excerpt.rendered).slice(0, 120) + '…'
    : null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault()
      onClick(post)
    }
  }

  return (
    <article className="carousel-card">
      {thumb ? (
        <img
          className="carousel-thumb-img"
          src={thumb}
          alt=""
          loading="lazy"
        />
      ) : (
        <div className="carousel-thumb" />
      )}
      <div className="carousel-body">
        <h3
          className="carousel-title"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        {excerpt && <p className="carousel-excerpt">{excerpt}</p>}
        <p className="carousel-meta">
          {formatDate(post.date)} • 4 min read
        </p>
        <a
          className="link"
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          Baca selengkapnya
        </a>
      </div>
    </article>
  )
}
