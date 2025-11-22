import React, { useEffect, useState } from 'react';
import API from '../api';

export default function Dashboard({ user, onLogout }) {
  const [teams, setTeams] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingTeamId, setSubmittingTeamId] = useState(null);
  const [scores, setScores] = useState({});
  const [openTeamId, setOpenTeamId] = useState(null);        // which card is expanded
  const [editingTeamId, setEditingTeamId] = useState(null);  // which team is in edit mode
  const [editingOriginalScores, setEditingOriginalScores] = useState(null); // snapshot for cancel
  const [sessionType, setSessionType] = useState('mentoring'); // 'mentoring' or 'judging'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsRes, scoresRes] = await Promise.all([
        API.get('/scores/teams'),
        API.get('/scores/my-scores')
      ]);
      setTeams(teamsRes.data || []);
      setMyScores(scoresRes.data || []);

      // Initialize scores from existing submissions (grouped by team and session type)
      const initialScores = {};
      (scoresRes.data || []).forEach(score => {
        const key = `${score.team_id}_${score.session_type}`;
        initialScores[key] = {
          innovation: score.innovation,
          creativity: score.creativity,
          feasibility: score.feasibility,
          presentation: score.presentation,
          design: score.design,
          user_experience: score.user_experience,
          total_score: score.total_score,
          final_score: score.final_score,
          comments: score.comments || '',
          session_type: score.session_type
        };
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (teamId, field, value, currentSessionType) => {
    // parse value to int safely and clamp 0..10
    const parsed = parseInt(value, 10);
    const numValue = Number.isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed));
    const key = `${teamId}_${currentSessionType}`;
    setScores(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: numValue
      }
    }));
  };

  const handleSubmitScore = async (teamId, currentSessionType) => {
    const key = `${teamId}_${currentSessionType}`;
    const teamScores = scores[key] || {};
    
    if (teamScores.innovation === undefined || teamScores.creativity === undefined || teamScores.feasibility === undefined || teamScores.presentation === undefined) 
      {
      alert('Please enter all scores (Innovation, Creativity, Feasibility, Presentation) before submitting.');
      return;
    }

    // Additional validation for judging session
    if (currentSessionType === 'judging') {
      if (teamScores.design === undefined || teamScores.user_experience === undefined) {
        alert('Please enter Design and User Experience scores for judging session.');
        return;
      }
    }

    setSubmittingTeamId(teamId);
    
    try {
      await API.post('/scores/submit', {
        team_id: teamId,
        session_type: currentSessionType,
        innovation: teamScores.innovation,
        creativity: teamScores.creativity,
        feasibility: teamScores.feasibility,
        presentation: teamScores.presentation,
        design: currentSessionType === 'judging' ? teamScores.design : undefined,
        user_experience: currentSessionType === 'judging' ? teamScores.user_experience : undefined,
        comments: teamScores.comments || ''
      });
      
      await loadData();
      // exit editing mode and close the card
      setEditingTeamId(null);
      setEditingOriginalScores(null);
      setOpenTeamId(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit score');
    } finally {
      setSubmittingTeamId(null);
    }
  };

  // toggle open/close card
  const toggleOpen = (teamId) => {
    setOpenTeamId(prev => (prev === teamId ? null : teamId));
    // if closing card while editing, cancel edit too
    if (openTeamId === teamId && editingTeamId === teamId) {
      cancelEdit(teamId);
    }
  };

  // begin editing an evaluated team (or a non-evaluated team too)
  const startEdit = (teamId, currentSessionType) => {
    const key = `${teamId}_${currentSessionType}`;
    const existing = scores[key] || { 
      innovation: 0, 
      creativity: 0, 
      feasibility: 0, 
      presentation: 0, 
      design: 0, 
      user_experience: 0, 
      comments: '' 
    };
    setEditingOriginalScores({ key, data: { ...existing } });
    setEditingTeamId(teamId);
    // expand the card for editing
    setOpenTeamId(teamId);
  };

  // cancel edit and restore snapshot
  const cancelEdit = (teamId) => {
    if (editingOriginalScores && editingTeamId === teamId) {
      setScores(prev => ({
        ...prev,
        [editingOriginalScores.key]: { ...editingOriginalScores.data }
      }));
    }
    setEditingTeamId(null);
    setEditingOriginalScores(null);
    // keep the card open or close? we keep it open but not editable; you can change behavior below:
    // setOpenTeamId(null);
  };

  // Group scores by team and session type
  const getScoredTeams = () => {
    const mentoringScored = new Set();
    const judgingScored = new Set();
    myScores.forEach(s => {
      if (s.session_type === 'mentoring') mentoringScored.add(s.team_id);
      if (s.session_type === 'judging') judgingScored.add(s.team_id);
    });
    return { mentoringScored, judgingScored };
  };
  
  const { mentoringScored, judgingScored } = getScoredTeams();
  
  const filteredTeams = teams.filter(team => {
    const searchLower = searchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      (team.college && team.college.toLowerCase().includes(searchLower)) ||
      (team.lead_name && team.lead_name.toLowerCase().includes(searchLower))
    );
  });

  const mentoringEvaluatedCount = mentoringScored.size;
  const judgingEvaluatedCount = judgingScored.size;
  const totalCount = teams.length;
  const totalPossibleEvaluations = totalCount * 2; // both mentoring and judging
  const totalCompletedEvaluations = mentoringEvaluatedCount + judgingEvaluatedCount;
  const progressPercent = totalPossibleEvaluations > 0 ? ((totalCompletedEvaluations / totalPossibleEvaluations) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      <div className='dashboard-header'>
        <div className='header-left'>
          <h1 className='dashboard-title'>🏆 INNOVEX 2025</h1>
          <p className='dashboard-subtitle'>{user.name} - {user.expertise}</p>
        </div>
        <div className='header-actions'>
          {user.is_admin && (
            <button className='btn-secondary' onClick={() => window.location.href = '/admin'}>
              📊 Admin Dashboard
            </button>
          )}
          <button className='btn-logout' onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className='stats-bar'>
        <div className='stat-item'>
          <span className='stat-value'>{totalCount}</span>
          <span className='stat-label'>Total Teams</span>
        </div>
        <div className='stat-item'>
          <span className='stat-value stat-success'>{mentoringEvaluatedCount}</span>
          <span className='stat-label'>Mentoring Done</span>
        </div>
        <div className='stat-item'>
          <span className='stat-value stat-success'>{judgingEvaluatedCount}</span>
          <span className='stat-label'>Judging Done</span>
        </div>
        <div className='stat-item stat-progress'>
          <span className='stat-label'>Overall Progress</span>
          <div className='progress-bar'>
            <div className='progress-fill' style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className='progress-text'>{progressPercent}%</span>
        </div>
      </div>

      <div className='search-container'>
        <div className='search-box'>
          <input
            type='text'
            className='search-input'
            placeholder='🔍 Search teams by name, college, or lead...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className='search-clear' onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
          <button
            className={`btn-secondary ${sessionType === 'mentoring' ? 'active' : ''}`}
            onClick={() => setSessionType('mentoring')}
            style={{
              background: sessionType === 'mentoring' ? '#4CAF50' : '#f5f5f5',
              color: sessionType === 'mentoring' ? 'white' : '#333',
              fontWeight: sessionType === 'mentoring' ? 'bold' : 'normal'
            }}
          >
            📚 Mentoring Session (40 marks)
          </button>
          <button
            className={`btn-secondary ${sessionType === 'judging' ? 'active' : ''}`}
            onClick={() => setSessionType('judging')}
            style={{
              background: sessionType === 'judging' ? '#2196F3' : '#f5f5f5',
              color: sessionType === 'judging' ? 'white' : '#333',
              fontWeight: sessionType === 'judging' ? 'bold' : 'normal'
            }}
          >
            ⚖️ Judging Session (50 marks)
          </button>
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className='no-results'>
          <div className='no-results-icon'>🔍</div>
          <h3>No teams found</h3>
          <p>Try adjusting your search term</p>
        </div>
      ) : (
        <div className='team-grid'>
          {filteredTeams.map(team => {
            const isMentoringEvaluated = mentoringScored.has(team.id);
            const isJudgingEvaluated = judgingScored.has(team.id);
            const isCurrentSessionEvaluated = sessionType === 'mentoring' ? isMentoringEvaluated : isJudgingEvaluated;
            
            const key = `${team.id}_${sessionType}`;
            const teamScores = scores[key] || { 
              innovation: '', 
              creativity: '', 
              feasibility: '', 
              presentation: '', 
              design: '', 
              user_experience: '', 
              comments: '' 
            };
            
            let total = 0;
            let finalScore = 0;
            if (sessionType === 'mentoring') {
              total = (teamScores.innovation || 0) + (teamScores.creativity || 0) + (teamScores.feasibility || 0) + (teamScores.presentation || 0);
              finalScore = total * 10; // 40 marks max
            } else {
              total = (teamScores.innovation || 0) + (teamScores.creativity || 0) + (teamScores.feasibility || 0) + (teamScores.presentation || 0) + (teamScores.design || 0) + (teamScores.user_experience || 0);
              finalScore = (total * 10 / 6 * 5).toFixed(2); // 50 marks max
            }
            
            const isOpen = openTeamId === team.id;
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={`${team.id}_${sessionType}`}
                className={`team-card ${isCurrentSessionEvaluated ? 'evaluated' : ''} ${isOpen ? 'open' : 'closed'}`}
                onClick={() => toggleOpen(team.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') toggleOpen(team.id); }}
                aria-expanded={isOpen}
              >
                <div className='team-header'>
                  <div className='team-header-content'>
                    <div className='team-name'>{team.name}</div>
                    <div className='team-info'>
                      <span>🏫</span>
                      <span>{team.college || 'Not Specified'}</span>
                    </div>
                    <div className='team-info'>
                      <span>👤</span>
                      <span>{team.lead_name || 'N/A'}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      {sessionType === 'mentoring' ? '📚 Mentoring' : '⚖️ Judging'} • 
                      {sessionType === 'mentoring' ? ' Max: 40 marks' : ' Max: 50 marks'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Status badges for both sessions */}
                    <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className={`status-badge ${isMentoringEvaluated ? 'completed' : 'pending'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        📚 {isMentoringEvaluated ? '✓' : '○'}
                      </span>
                      <span className={`status-badge ${isJudgingEvaluated ? 'completed' : 'pending'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        ⚖️ {isJudgingEvaluated ? '✓' : '○'}
                      </span>
                    </div>
                    
                    {/* Show Edit button for evaluated teams (or always, if you prefer) */}
                    {isCurrentSessionEvaluated && !isEditing && (
                      <button
                        className='btn-outline'
                        onClick={(e) => { e.stopPropagation(); startEdit(team.id, sessionType); }}
                        type='button'
                        title='Edit submitted score'
                      >
                        Edit
                      </button>
                    )}

                    {/* Show Cancel while editing */}
                    {isEditing && (
                      <button
                        className='btn-outline'
                        onClick={(e) => { e.stopPropagation(); cancelEdit(team.id); }}
                        type='button'
                        title='Cancel edit'
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* only show score-section when card is open */}
                {isOpen && (
                  <div className='score-section' onClick={(e) => e.stopPropagation()}>
                    <div className='score-row'>
                      <span className='score-label'>💡 Innovation</span>
                      <input
                        type='number'
                        className='score-input'
                        min='0'
                        max='10'
                        placeholder='0-10'
                        value={teamScores.innovation || ''}
                        onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'innovation', e.target.value, sessionType); }}
                        disabled={isCurrentSessionEvaluated && !isEditing}
                      />
                    </div>
                    <div className='score-row'>
                      <span className='score-label'>🎨 Creativity</span>
                      <input
                        type='number'
                        className='score-input'
                        min='0'
                        max='10'
                        placeholder='0-10'
                        value={teamScores.creativity || ''}
                        onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'creativity', e.target.value, sessionType); }}
                        disabled={isCurrentSessionEvaluated && !isEditing}
                      />
                    </div>
                    <div className='score-row'>
                      <span className='score-label'>⚙️ Feasibility</span>
                      <input
                        type='number'
                        className='score-input'
                        min='0'
                        max='10'
                        placeholder='0-10'
                        value={teamScores.feasibility || ''}
                        onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'feasibility', e.target.value, sessionType); }}
                        disabled={isCurrentSessionEvaluated && !isEditing}
                      />
                    </div>
                    <div className='score-row'>
                      <span className='score-label'>📢 Presentation</span>
                      <input
                        type='number'
                        className='score-input'
                        min='0'
                        max='10'
                        placeholder='0-10'
                        value={teamScores.presentation || ''}
                        onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'presentation', e.target.value, sessionType); }}
                        disabled={isCurrentSessionEvaluated && !isEditing}
                      />
                    </div>
                    
                    {/* Judging-specific fields */}
                    {sessionType === 'judging' && (
                      <>
                        <div className='score-row'>
                          <span className='score-label'>🎨 Design</span>
                          <input
                            type='number'
                            className='score-input'
                            min='0'
                            max='10'
                            placeholder='0-10'
                            value={teamScores.design || ''}
                            onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'design', e.target.value, sessionType); }}
                            disabled={isCurrentSessionEvaluated && !isEditing}
                          />
                        </div>
                        <div className='score-row'>
                          <span className='score-label'>👤 User Experience</span>
                          <input
                            type='number'
                            className='score-input'
                            min='0'
                            max='10'
                            placeholder='0-10'
                            value={teamScores.user_experience || ''}
                            onChange={e => { e.stopPropagation(); handleScoreChange(team.id, 'user_experience', e.target.value, sessionType); }}
                            disabled={isCurrentSessionEvaluated && !isEditing}
                          />
                        </div>
                      </>
                    )}

                    {/* Total Score Display */}
                    <div className={`total-score ${isCurrentSessionEvaluated ? 'evaluated' : ''}`}>
                      <div className='total-label'>
                        {sessionType === 'mentoring' ? 'Mentoring Score (40 marks)' : 'Judging Score (50 marks)'}
                      </div>

                      <div className='total-value'>
                        {finalScore} <span className='total-max'>/ {sessionType === 'mentoring' ? 40 : 50}</span>
                      </div>

                      {total > 0 && (
                        <div className='final-score'>
                          Raw Total: <strong>{total}/{sessionType === 'mentoring' ? 4 : 6} × 10</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <button
                        className={`submit-button ${isCurrentSessionEvaluated ? 'evaluated' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSubmitScore(team.id, sessionType); }}
                        disabled={ (isCurrentSessionEvaluated && !isEditing) || submittingTeamId === team.id }
                      >
                        {submittingTeamId === team.id ? '⏳ Submitting...' :
                         isCurrentSessionEvaluated && !isEditing ? '✓ Already Submitted' :
                         isCurrentSessionEvaluated && isEditing ? 'Save Changes' :
                         '✓ Submit Score'}
                      </button>

                      {/* Show a Cancel Edit or Close button */}
                      {isEditing ? (
                        <button
                          type='button'
                          className='submit-button'
                          style={{ background: '#f2f2f2', color: '#333', boxShadow: 'none' }}
                          onClick={(e) => { e.stopPropagation(); cancelEdit(team.id); }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type='button'
                          className='submit-button'
                          style={{ background: '#fff', color: '#333', border: '1px solid #eee', boxShadow: 'none' }}
                          onClick={(e) => { e.stopPropagation(); setOpenTeamId(null); }}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
