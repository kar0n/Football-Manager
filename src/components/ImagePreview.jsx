/**
 * The "Save image" view displayed after finalization.
 * Renders the exact same JSX as App.jsx lines 722–741.
 */
export const ImagePreview = ({ savedImageUrl, onDone }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>📸 Team image generated!</p>
        <p><strong>Long-press</strong> the image below → <strong>Save to Photos</strong></p>
        <p>Then share it on WhatsApp from your gallery.</p>
      </div>
      <img
        src={savedImageUrl}
        alt="Finalized Teams"
        style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', border: '2px solid rgba(148, 163, 184, 0.2)' }}
      />
      <button
        className="action-btn secondary"
        onClick={onDone}
        style={{ width: 'fit-content', padding: '0.75rem 2rem', marginTop: '0.5rem' }}
      >
        ✓ Done
      </button>
    </div>
  );
};
