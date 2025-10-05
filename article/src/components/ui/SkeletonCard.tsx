import React from 'react'

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumb"></div>
      <div className="skeleton-body">
        <div className="skeleton-badge"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-title-short"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-meta"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  )
}

type SkeletonGridProps = {
  count: number
  columns: number
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count, columns }) => {
  return (
    <div className="carousel-container">
      <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <style>{`
        .carousel-container {
          position: relative;
          margin: 16px 0;
        }

        .skeleton-grid {
          display: grid;
          gap: 16px;
        }

        .skeleton-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .skeleton-thumb {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 200px;
        }

        .skeleton-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-badge {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 20px;
          width: 80px;
          border-radius: 6px;
        }

        .skeleton-title {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 20px;
          width: 100%;
          border-radius: 4px;
        }

        .skeleton-title-short {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 20px;
          width: 70%;
          border-radius: 4px;
        }

        .skeleton-excerpt {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 16px;
          width: 100%;
          border-radius: 4px;
        }

        .skeleton-meta {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 14px;
          width: 60%;
          border-radius: 4px;
        }

        .skeleton-button {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          height: 40px;
          width: 100%;
          border-radius: 999px;
          margin-top: 8px;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (max-width: 900px) {
          .skeleton-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .skeleton-thumb {
            height: 160px;
          }
        }

        @media (max-width: 600px) {
          .skeleton-grid {
            grid-template-columns: 1fr !important;
          }
          .skeleton-thumb {
            height: 200px;
          }
        }
      `}</style>
    </div>
  )
}
