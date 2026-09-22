import React, { useEffect, useState } from 'react';
import robotBodyImg from '../assets/ai_robot_body_base.png';
import robotArmImg from '../assets/ai_robot_arm_waving.png';
import './AIRobotAssistant.css';

export default function AIRobotAssistant({
  robotState = 'idle', // 'idle' | 'waking' | 'moving' | 'thinking' | 'processing' | 'returning' | 'answering' | 'success' | 'error'
  targetCoords = { x: 0, y: 0 },
  customMessage = '',
}) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);
  const [isInteractiveGreeting, setIsInteractiveGreeting] = useState(false);

  useEffect(() => {
    const safeTarget = targetCoords || { x: 0, y: 0 };
    if (['waking', 'moving', 'thinking', 'processing'].includes(robotState)) {
      setCoords(safeTarget);
      setTilt((safeTarget.x || 0) < 0 ? -6 : 6);
    } else {
      setCoords({ x: 0, y: 0 });
      setTilt(0);
    }
  }, [robotState, targetCoords]);

  // Voice synthesis & interactive hand wave trigger when clicking robot
  const handleRobotClick = () => {
    setIsInteractiveGreeting(true);
    
    // Web Speech API Voice Greeting
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Hi! I'm RideX AI, ready to analyze your fleet operations!");
        utterance.pitch = 1.25;
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis unavailable:', e);
      }
    }

    setTimeout(() => {
      setIsInteractiveGreeting(false);
    }, 2800);
  };

  const getSpeechBubbleText = () => {
    if (isInteractiveGreeting) return "Hi there! Ready to assist you! 👋";
    if (customMessage) return customMessage;
    switch (robotState) {
      case 'waking':
      case 'moving':
      case 'thinking':
        return "Analyzing your question... 🔍";
      case 'processing':
        return "Checking RideX operational telemetry... ⚡";
      case 'returning':
      case 'answering':
        return "Here's what I found for you! 🤖";
      case 'success':
        return "Analysis complete! ✓";
      case 'error':
        return "I couldn't complete the analysis. Please try again. ⚠️";
      case 'idle':
      default:
        return "Hi! I'm RideX AI 🤖";
    }
  };

  const currentArmState = isInteractiveGreeting ? 'greeting' : robotState;

  const safeCoords = coords || { x: 0, y: 0 };

  return (
    <div className="ai-robot-wrapper">
      <div
        className={`ai-robot-flight-target state-${robotState} ${isInteractiveGreeting ? 'is-greeting' : ''}`}
        style={{
          transform: `translate3d(${safeCoords.x || 0}px, ${safeCoords.y || 0}px, 0) rotate(${tilt}deg)`,
        }}
        onClick={handleRobotClick}
        title="Click to greet RideX AI!"
      >
        {/* ── ANTI-GRAVITY FLOATING CONTAINER (3s ease-in-out continuous float) ── */}
        <div className="ai-robot-float-container">
          {/* ── SPEECH BUBBLE ── */}
          <div className={`robot-speech-bubble bubble-${currentArmState}`}>
            <div className="bubble-content">
              <span className="bubble-text">{getSpeechBubbleText()}</span>
            </div>
            <div className="bubble-tail"></div>
          </div>

          {/* ── ATMOSPHERIC RIM & BACKLIGHT AURA ── */}
          <div className="robot-aura-glow"></div>

          {/* ── ACCURATE 3D AI ROBOT AVATAR WITH ISOLATED WAVING HAND ── */}
          <div className="robot-body-wrapper">
            <img
              src={robotBodyImg}
              alt="RideX AI Robot Assistant Body"
              className="robot-3d-body"
            />
            {/* Isolated Hand Wave Layer (1.5s rotate-based wave animation) */}
            <div className="robot-hand-wave-layer">
              <img
                src={robotArmImg}
                alt="RideX AI Waving Arm"
                className={`robot-3d-arm-waving arm-state-${currentArmState}`}
              />
            </div>
            {/* Dynamic Eye Glow Overlay */}
            <div className="eye-glow-overlay"></div>
            {/* Thruster Flame Light Pulse Overlay */}
            <div className="thruster-glow-overlay"></div>
          </div>
        </div>

        {/* ── HOVER DROP SHADOW (Synced 3s scale & opacity animation) ── */}
        <div className="robot-shadow-ellipse"></div>
      </div>
    </div>
  );
}
