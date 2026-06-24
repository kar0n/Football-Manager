import { useEffect, useRef } from 'react';

/**
 * The "Save image" view displayed after finalization.
 * Auto-scrolls into view on mount so the user never misses it.
 */
export const ImagePreview = ({ savedImageUrl, onDone }) => {
  const containerRef = useRef(null);

  // Scroll this view into the viewport as soon as it mounts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <img
        src={savedImageUrl}
        alt="Finalized Teams"
        style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', border: '2px solid rgba(148, 163, 184, 0.2)' }}
      />
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>📸 Team image generated!</p>
        <p><strong>Long-press</strong> the image above → <strong>Save to Photos</strong></p>
        <p>Then share it on WhatsApp from your gallery.</p>
      </div>
      <button
        className="action-btn"
        onClick={onDone}
        style={{
          width: 'fit-content',
          padding: '0.75rem 2rem',
          marginTop: '0.5rem',
          background: 'var(--success)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
        }}
      >
        ✓ Done
      </button>
    </div>
  );
};
