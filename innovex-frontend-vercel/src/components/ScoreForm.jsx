// src/components/ScoreForm.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';

export default function ScoreForm({
  team,
  onScoreSubmitted = () => {},
  existingScore = null,
  onClose = () => {}
}) {
  const [sessionType, setSessionType] = useState('mentoring');
  const [innovation, setInnovation] = useState(0);
  const [creativity, setCreativity] = useState(0);
  const [feasibility, setFeasibility] = useState(0);
  const [presentation, setPresentation] = useState(0);
  const [design, setDesign] = useState(0);
  const [userExperience, setUserExperience] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingScore) {
      setSessionType(existingScore.session_type || 'mentoring');
      setInnovation(existingScore.innovation || 0);
      setCreativity(existingScore.creativity || 0);
      setFeasibility(existingScore.feasibility || 0);
      setPresentation(existingScore.presentation || 0);
      setDesign(existingScore.design || 0);
      setUserExperience(existingScore.user_experience || 0);
      setComments(existingScore.comments || '');
    }
    setMessage('');
  }, [team, existingScore]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        team_id: team.id,
        session_type: sessionType,
        innovation: Number(innovation),
        creativity: Number(creativity),
        feasibility: Number(feasibility),
        presentation: Number(presentation),
        comments: comments.trim(),
      };
      
      if (sessionType === 'judging') {
        payload.design = Number(design);
        payload.user_experience = Number(userExperience);
      }
      
      await API.post('/scores/submit', payload);

      setMessage('✓ Score saved');

      setTimeout(() => {
        onScoreSubmitted();
        onClose();
      }, 800);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const total = sessionType === 'mentoring'
    ? innovation + creativity + feasibility + presentation
    : innovation + creativity + feasibility + presentation + design + userExperience;
  
  const maxScore = sessionType === 'mentoring' ? 40 : 50;
  const score = sessionType === 'mentoring'
    ? (total / 4).toFixed(2)
    : ((total / 6) * 50 / 10).toFixed(2);

  return (
    <form className="score-form-card" onSubmit={submit}>
      <h3 className="score-title">{team.name}</h3>
      <p className="muted small">{team.college}</p>

      {/* Session Type Selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Session Type</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className={sessionType === 'mentoring' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setSessionType('mentoring')}
            style={{ flex: 1 }}
          >
            📚 Mentoring (40 marks)
          </button>
          <button
            type="button"
            className={sessionType === 'judging' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setSessionType('judging')}
            style={{ flex: 1 }}
          >
            ⚖️ Judging (50 marks)
          </button>
        </div>
      </div>

      <div className="manual-input-grid">
        <div className="manual-field">
          <label>💡 Innovation (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={innovation}
            onChange={(e) => setInnovation(Math.min(10, Math.max(0, Number(e.target.value))))}
          />
        </div>

        <div className="manual-field">
          <label>🎨 Creativity (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={creativity}
            onChange={(e) => setCreativity(Math.min(10, Math.max(0, Number(e.target.value))))}
          />
        </div>

        <div className="manual-field">
          <label>⚙️ Feasibility (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={feasibility}
            onChange={(e) => setFeasibility(Math.min(10, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <div className="manual-field">
          <label>🗣️ Presentation (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={presentation}
            onChange={(e) => setPresentation(Math.min(10, Math.max(0, Number(e.target.value))))}
          />
        </div>

        {sessionType === 'judging' && (
          <>
            <div className="manual-field">
              <label>🎨 Design (0–10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={design}
                onChange={(e) => setDesign(Math.min(10, Math.max(0, Number(e.target.value))))}
              />
            </div>
            <div className="manual-field">
              <label>👤 User Experience (0–10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={userExperience}
                onChange={(e) => setUserExperience(Math.min(10, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </>
        )}
      </div>

      <div className="result-box">
        <div>Score: <b>{score}/{maxScore}</b></div>
        <div>Total: <b>{total}/{sessionType === 'mentoring' ? 40 : 60}</b></div>
      </div>

      <textarea
        className="comments-box"
        placeholder="Comments (optional)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <div className="score-actions">
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : existingScore ? "Update" : "Submit Score"}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
      </div>

      {message && (
        <div className={`compact-message ${message.includes("✓") ? "ok" : "err"}`}>
          {message}
        </div>
      )}
    </form>
  );
}
