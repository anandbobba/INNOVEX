// src/components/ScoreForm.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';

export default function ScoreForm({
  team,
  onScoreSubmitted = () => {},
  existingScore = null,
  onClose = () => {}
}) {
  const [innovation, setInnovation] = useState(0);
  const [creativity, setCreativity] = useState(0);
  const [feasibility, setFeasibility] = useState(0);
  const [presentation, setPresentation] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingScore) {
      setInnovation(existingScore.innovation || 0);
      setCreativity(existingScore.creativity || 0);
      setFeasibility(existingScore.feasibility || 0);
      setPresentation(existingScore.presentation || 0);
      setComments(existingScore.comments || '');
    }
    setMessage('');
  }, [team, existingScore]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/scores/submit', {
        team_id: team.id,
        innovation: Number(innovation),
        creativity: Number(creativity),
        feasibility: Number(feasibility),
        presentation: Number(presentation),
        comments: comments.trim(),
      });

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

  const total = innovation + creativity + feasibility + presentation;
  const avg = (total / 4).toFixed(1);

  return (
    <form className="score-form-card" onSubmit={submit}>
      <h3 className="score-title">{team.name}</h3>
      <p className="muted small">{team.college}</p>

      <div className="manual-input-grid">
        <div className="manual-field">
          <label>💡 Innovation (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={innovation}
            onChange={(e) => setInnovation(Math.min(100, Math.max(0, Number(e.target.value))))}
          />
        </div>

        <div className="manual-field">
          <label>🎨 Creativity (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={creativity}
            onChange={(e) => setCreativity(Math.min(100, Math.max(0, Number(e.target.value))))}
          />
        </div>

        <div className="manual-field">
          <label>⚙️ Feasibility (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={feasibility}
            onChange={(e) => setFeasibility(Math.min(100, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <div className="manual-field">
          <label>🗣️ Presentation (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={presentation}
            onChange={(e) => setPresentation(Math.min(100, Math.max(0, Number(e.target.value))))}
          />
        </div>
      </div>

      <div className="result-box">
        <div>Total: <b>{total}/400</b></div>
        <div>Avg: <b>{avg}/10</b></div>
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
