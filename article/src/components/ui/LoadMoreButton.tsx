import React from 'react'

type Props = {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
}

export const LoadMoreButton: React.FC<Props> = ({
  onClick,
  isLoading,
  disabled = false,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="load-more-btn"
      >
        {isLoading ? 'Memuat...' : 'Muat Lebih Banyak'}
      </button>

      <style>{`
        .load-more-btn {
          background: #1A2080;
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(26, 32, 128, 0.2);
        }

        .load-more-btn:hover:not(:disabled) {
          background: #151a66;
          box-shadow: 0 4px 12px rgba(26, 32, 128, 0.3);
          transform: translateY(-1px);
        }

        .load-more-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .load-more-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
