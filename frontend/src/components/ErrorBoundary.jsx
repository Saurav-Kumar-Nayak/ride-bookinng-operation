import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RideX UI Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #090a10 0%, #161b2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
          color: '#f8fafc',
          padding: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 360, marginBottom: 16, lineHeight: 1.5 }}>
            The map or screen had a temporary glitch. Tap below to reload seamlessly.
          </p>

          {this.state.error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: 12,
              fontFamily: 'monospace',
              maxWidth: 420,
              marginBottom: 24,
              wordBreak: 'break-word',
              textAlign: 'left'
            }}>
              ⚠️ {this.state.error.toString()}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleTryAgain}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: 16,
                color: '#0f172a',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 237, 255, 0.4)'
              }}
            >
              ⚡ Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '14px 24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 16,
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
