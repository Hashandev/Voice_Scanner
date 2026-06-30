import React, { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onTransactionAdded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setTranscription('');
      setExtractedData(null);
      setErrorMessage('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        
        // Stop all tracks on the stream to release the mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      setErrorMessage('Microphone access denied or not supported. Check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleAudioUpload = async (audioBlob) => {
    setLoading(true);
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    formData.append('language', 'en');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process audio');
      }

      setTranscription(data.rawTranscription);
      setExtractedData(data.transaction);
      onTransactionAdded(); // refresh summary and list
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Error converting audio to text. Try speaking clearly.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="recorder-container glass-panel">
      <h2>Speak Transaction</h2>
      <p className="recorder-instruction">
        Try saying: <strong>"Credit 2000 rupees salary"</strong> or <strong>"Spent 500 on dinner"</strong>
      </p>

      <div className="mic-wrapper">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`mic-button ${isRecording ? 'recording' : ''} ${loading ? 'loading' : ''}`}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : isRecording ? (
            <div className="recording-square"></div>
          ) : (
            <span className="mic-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor"/>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </span>
          )}
        </button>
        {isRecording && <div className="pulse-ring"></div>}
      </div>

      {isRecording && (
        <div className="timer-display">
          <span className="live-dot"></span>
          <span>Recording: {formatTimer(timer)}</span>
        </div>
      )}

      {loading && <div className="loading-text">Processing...</div>}

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {/* Extracted Transaction Detail Display */}
      {extractedData && (
        <div className="result-card animate-fade-in">
          <div className="result-header">
            <h4>Extracted Transaction</h4>
            <span className={`type-badge ${extractedData.type}`}>
              {extractedData.type.toUpperCase()}
            </span>
          </div>
          <div className="result-body">
            <div className="result-row">
              <span className="result-label">Amount:</span>
              <span className="result-value amount">{formatCurrency(extractedData.amount)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Description:</span>
              <span className="result-value">{extractedData.description}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Category:</span>
              <span className="result-value category">{extractedData.category}</span>
            </div>
          </div>
          {transcription && (
            <div className="raw-transcription">
              <strong>Speech heard:</strong> "{transcription}"
            </div>
          )}
        </div>
      )}

      <style>{`
        .recorder-container {
          max-width: 600px;
          margin: 0 auto 2rem auto;
          padding: 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .recorder-container h2 {
          margin-bottom: 0.5rem;
          font-size: 1.6rem;
        }
        .recorder-instruction {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        .recorder-instruction strong {
          color: var(--secondary);
        }
        .mic-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mic-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: var(--gradient-primary);
          color: white;
          font-size: 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 0 20px var(--primary-glow);
          transition: var(--transition-smooth);
        }
        .mic-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 30px var(--primary-glow);
        }
        .mic-button.recording {
          background: var(--danger);
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
        }
        .mic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .mic-icon {
          display: inline-block;
          margin-top: -2px;
        }
        .recording-square {
          width: 24px;
          height: 24px;
          background-color: white;
          border-radius: 4px;
        }
        .pulse-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px solid var(--primary);
          border-radius: 50%;
          animation: pulseGlow 1.5s infinite;
          z-index: 1;
        }
        .timer-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 1rem;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background-color: var(--danger);
          border-radius: 50%;
          display: inline-block;
          animation: blink 1s infinite alternate;
        }
        .loading-text {
          font-size: 0.9rem;
          color: var(--secondary);
          margin-top: 1rem;
          animation: blink 1.2s infinite alternate;
        }
        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        .error-banner {
          background: var(--danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--danger);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-top: 1rem;
          max-width: 100%;
        }
        .result-card {
          margin-top: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 1.25rem;
          width: 100%;
          text-align: left;
        }
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.5rem;
        }
        .result-header h4 {
          font-size: 1rem;
          font-weight: 600;
        }
        .type-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }
        .type-badge.credit {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .type-badge.debit {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .result-body {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .result-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .result-label {
          color: var(--text-muted);
        }
        .result-value {
          font-weight: 500;
        }
        .result-value.amount {
          font-family: var(--font-title);
          font-weight: 700;
          font-size: 1.1rem;
        }
        .result-value.category {
          background: rgba(255, 255, 255, 0.07);
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .raw-transcription {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          background: rgba(0,0,0,0.2);
          padding: 0.5rem;
          border-radius: 6px;
          border-left: 3px solid var(--primary);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
