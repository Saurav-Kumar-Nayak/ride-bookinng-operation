import { useState, useEffect, useRef } from 'react';
import API_BASE from '../../config';
import AIRobotAssistant from '../../components/AIRobotAssistant';
import './AdminAICopilot.css';

export default function AdminAICopilot() {
  const [queryInput, setQueryInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('cancellations');
  const [isLoading, setIsLoading] = useState(false);
  const [insightResult, setInsightResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── ROBOT ASSISTANT STATE MACHINE ──
  const [robotState, setRobotState] = useState('idle');
  const [targetCoords, setTargetCoords] = useState({ x: 0, y: 0 });

  const robotWrapperRef = useRef(null);
  const presetRefs = useRef({});
  const searchFormRef = useRef(null);

  const quickActions = [
    { id: 'cancellations', label: 'Why are cancellations increasing?', icon: '❌' },
    { id: 'driver_shortage', label: 'Which area has driver shortage?', icon: '🚨' },
    { id: 'demand', label: 'Where is demand increasing?', icon: '📈' },
    { id: 'revenue', label: 'What is today\'s revenue trend?', icon: '💰' },
    { id: 'health', label: 'What are today\'s major operational risks?', icon: '⚠️' }
  ];

  // Helper to calculate smooth relative translation vector for robot flight
  const calcTargetCoords = (targetElement) => {
    if (!targetElement || !robotWrapperRef.current) {
      return { x: -220, y: -160 };
    }
    try {
      const targetRect = targetElement.getBoundingClientRect();
      const robotRect = robotWrapperRef.current.getBoundingClientRect();

      const x = (targetRect.left + targetRect.width / 2) - (robotRect.left + robotRect.width / 2);
      const y = (targetRect.top + targetRect.height / 2) - (robotRect.top + robotRect.height / 2);

      // Clamp coordinates to keep flight trajectory within safe bounds
      const clampedX = Math.max(-550, Math.min(100, x));
      const clampedY = Math.max(-400, Math.min(100, y));
      return { x: clampedX, y: clampedY };
    } catch {
      return { x: -220, y: -160 };
    }
  };

  // ── CORE ROBOT + API EXECUTION FLOW ──
  const fetchCopilotInsightWithRobot = async (presetKey, customQuestion = '', targetElement = null) => {
    if (isLoading) return; // Prevent duplicate concurrent requests

    // 1. Wake & Calculate Flight Vector
    const coords = calcTargetCoords(targetElement);
    setTargetCoords(coords);
    setRobotState('waking');

    await new Promise(r => setTimeout(r, 200));
    setRobotState('moving');

    await new Promise(r => setTimeout(r, 450));
    setRobotState(customQuestion ? 'processing' : 'thinking');

    // 2. Execute Existing AI Analysis Logic
    setIsLoading(true);
    setErrorMsg('');
    let isSuccess = false;

    try {
      const res = await fetch(`${API_BASE}/api/admin/intelligence/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryPreset: presetKey,
          question: customQuestion || queryInput
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInsightResult({
          dataType: data.dataType,
          ...data.insight
        });
        isSuccess = true;
      } else {
        setErrorMsg(data.message || 'Failed to fetch copilot intelligence.');
      }
    } catch (err) {
      console.error('AICopilot fetch error:', err);
      setErrorMsg('Network error connecting to AI Operations Copilot backend.');
    } finally {
      setIsLoading(false);
    }

    // 3. Return Flight & Answering Gestures
    setRobotState('returning');
    await new Promise(r => setTimeout(r, 550));

    if (isSuccess) {
      setRobotState('answering');
      await new Promise(r => setTimeout(r, 1000));
      setRobotState('success');
      await new Promise(r => setTimeout(r, 1400));
      setRobotState('idle');
    } else {
      setRobotState('error');
      await new Promise(r => setTimeout(r, 2200));
      setRobotState('idle');
    }
  };

  // Initial load
  useEffect(() => {
    // Fetch initial dataset cleanly on mount
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/intelligence/copilot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryPreset: 'cancellations', question: '' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setInsightResult({ dataType: data.dataType, ...data.insight });
        }
      } catch (e) {
        console.error('Initial fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleActionClick = (presetId) => {
    setSelectedPreset(presetId);
    setQueryInput('');
    const btnElem = presetRefs.current[presetId];
    fetchCopilotInsightWithRobot(presetId, '', btnElem);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setSelectedPreset('custom');
    fetchCopilotInsightWithRobot('custom', queryInput.trim(), searchFormRef.current);
  };

  return (
    <div className="admin-copilot-container">
      {/* ── HEADER ── */}
      <div className="copilot-header">
        <div className="copilot-header-info">
          <div className="copilot-badge-icon">🧠</div>
          <div>
            <h2 className="copilot-title">RideX AI Operations Copilot</h2>
            <p className="copilot-subtitle">
              Explainable real-time operational insights powered by MongoDB fleet & ride telemetry
            </p>
          </div>
        </div>

        <div className="copilot-data-pill">
          {insightResult?.dataType === 'INSUFFICIENT REAL DATA' ? (
            <span className="pill-badge warning">⚠️ INSUFFICIENT REAL DATA</span>
          ) : (
            <span className="pill-badge success">
              <span className="live-dot-green"></span>
              REAL DATA INTEGRATED
            </span>
          )}
        </div>
      </div>

      {/* ── QUICK ACTION PRESETS ── */}
      <div className="copilot-quick-actions">
        <span className="quick-actions-label">⚡ Operational Diagnostics Presets:</span>
        <div className="quick-buttons-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              ref={(el) => (presetRefs.current[action.id] = el)}
              onClick={() => handleActionClick(action.id)}
              disabled={isLoading || robotState !== 'idle'}
              className={`copilot-action-btn ${selectedPreset === action.id ? 'active' : ''}`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CUSTOM QUESTION INPUT FORM ── */}
      <form ref={searchFormRef} onSubmit={handleCustomSubmit} className="copilot-search-box">
        <input
          type="text"
          placeholder="Ask AI Copilot (e.g., How many drivers are needed during peak hours?)"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          disabled={isLoading || robotState !== 'idle'}
          className="copilot-input"
        />
        <button
          type="submit"
          disabled={isLoading || robotState !== 'idle'}
          className="copilot-submit-btn"
        >
          {isLoading ? '⌛ Analyzing...' : '🚀 Analyze & Generate Insight'}
        </button>
      </form>

      {/* ── INSIGHT OUTPUT SECTION WITH INTEGRATED ROBOT ── */}
      {errorMsg && (
        <div className="copilot-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="copilot-main-section">
        {/* LEFT COLUMN: EXISTING INSIGHT DISPLAY CARD */}
        <div className="copilot-insight-column">
          {isLoading && !insightResult ? (
            <div className="copilot-loading-card">
              <div className="copilot-spinner"></div>
              <div>Querying operational database telemetry & calculating confidence metrics...</div>
            </div>
          ) : insightResult ? (
            <div className="copilot-insight-card">
              <div className="card-top-bar">
                <div className="card-category-tag">
                  🧠 AI INSIGHT ANALYSIS
                </div>
                <div className="card-confidence-badge">
                  Confidence: <strong>{insightResult.confidence}</strong>
                </div>
              </div>

              {insightResult.dataType === 'INSUFFICIENT REAL DATA' ? (
                <div className="insufficient-data-box">
                  <div className="insufficient-icon">⚠️</div>
                  <div className="insufficient-title">INSUFFICIENT OPERATIONAL DATA AVAILABLE</div>
                  <p>{insightResult.finding || 'Insufficient historical ride records found in database to synthesize a high-confidence operational conclusion.'}</p>
                </div>
              ) : (
                <div className="insight-body">
                  {/* Finding Section */}
                  <div className="insight-section">
                    <div className="section-label">📌 Finding</div>
                    <div className="section-content finding-text">{insightResult.finding}</div>
                  </div>

                  {/* Evidence Section */}
                  <div className="insight-section">
                    <div className="section-label">📊 Evidence (Real Telemetry Metrics)</div>
                    <div className="section-content evidence-box">{insightResult.evidence}</div>
                  </div>

                  {/* Impact Section */}
                  <div className="insight-section">
                    <div className="section-label">⚡ Operational Impact</div>
                    <div className="section-content impact-text">{insightResult.impact}</div>
                  </div>

                  {/* Recommended Action Section */}
                  <div className="insight-section highlight">
                    <div className="section-label">💡 Recommended Action</div>
                    <div className="section-content action-text">{insightResult.recommendedAction}</div>
                  </div>

                  <div className="card-footer-pill">
                    DATA TYPE: <strong>{insightResult.dataType}</strong> · SOURCE: RIDEX MONGODB OPERATIONAL ENGINE
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN: AI ROBOT ASSISTANT */}
        <div className="copilot-robot-column" ref={robotWrapperRef}>
          <AIRobotAssistant
            robotState={robotState}
            targetCoords={targetCoords}
          />
        </div>
      </div>
    </div>
  );
}
