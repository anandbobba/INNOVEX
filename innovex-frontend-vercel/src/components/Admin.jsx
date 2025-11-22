// src/components/Admin.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function Admin({ user, onLogout }) {
  const [results, setResults] = useState([]);
  const [detailedScores, setDetailedScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedJudge, setSelectedJudge] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resultsRes, detailedRes, statsRes] = await Promise.all([
        API.get('/admin/results'),
        API.get('/admin/detailed-scores'),
        API.get('/admin/stats')
      ]);
      setResults(resultsRes.data || []);
      setDetailedScores(detailedRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error loading admin data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csv = 'INNOVEX 2025 - Final Results\n\n';
    csv += 'Rank,Team Name,College,Mentoring(40),Judging(50),Total(90),Mentoring Judges,Judging Judges\n';
    results.forEach((row, index) => {
      csv += `${index + 1},"${row.team_name}","${row.college || 'N/A'}",${row.mentoring_avg_score || 0},${row.judging_avg_score || 0},${row.total_score || 0},${row.mentoring_judge_count || 0},${row.judging_judge_count || 0}\n`;
    });

    csv += '\n\nDetailed Scores by Judge\n';
    csv += 'Judge Name,Expertise,Team Name,Session Type,Innovation,Creativity,Feasibility,Presentation,Design,User Experience,Score,Comments\n';
    detailedScores.forEach(score => {
      csv += `"${score.judge_name}","${score.expertise}","${score.team_name}","${score.session_type}",${score.innovation},${score.creativity},${score.feasibility},${score.presentation},${score.design || '-'},${score.user_experience || '-'},${score.final_score},"${score.comments || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INNOVEX_Results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const judges = [...new Set(detailedScores.map(s => s.judge_name).filter(Boolean))];
  const filteredScores = selectedJudge === 'all'
    ? detailedScores
    : detailedScores.filter(s => s.judge_name === selectedJudge);

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const topThree = results.slice(0, 3);
  const evaluationProgress = stats && stats.total_teams && stats.total_judges
    ? ((stats.total_evaluations / (stats.total_teams * stats.total_judges) * 100).toFixed(1))
    : 0;

  return (
    <div className='dashboard-container'>
      {/* Header (re-uses .dashboard-header) */}
      <div className='dashboard-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className='trophy-icon'>🏆</div>
          <div>
            <div className='dashboard-title'>INNOVEX 2025</div>
            <div className='dashboard-subtitle'>Advanced Analytics Dashboard</div>
          </div>
        </div>

        <div className='header-actions'>
          <button className='btn-secondary' onClick={loadData} title='Refresh'>🔄</button>
          <button className='btn-secondary' onClick={exportToCSV}>📥 Export Report</button>
          <button className='btn-logout' onClick={onLogout}>👤 Logout</button>
        </div>
      </div>

      {/* Stats grid (re-uses .stats-bar and .stat-item) */}
      <div className='stats-bar'>
        <div className='stat-item'>
          <div className='stat-value'>{stats?.total_teams || 0}</div>
          <div className='stat-label'>Total Teams</div>
          <div className='stat-sublabel'>Registered participants</div>
        </div>

        <div className='stat-item'>
          <div className='stat-value'>{stats?.total_judges || 0}</div>
          <div className='stat-label'>Active Judges</div>
          <div className='stat-sublabel'>Expert evaluators</div>
        </div>

        <div className='stat-item'>
          <div className='stat-value stat-success'>{stats?.total_evaluations || 0}</div>
          <div className='stat-label'>Evaluations</div>
          <div className='stat-sublabel'>Completed assessments</div>
        </div>

        <div className='stat-item'>
          <div className='stat-value'>{stats?.evaluated_teams || 0}</div>
          <div className='stat-label'>Teams Evaluated</div>
          <div className='stat-sublabel'>At least one score</div>
        </div>
      </div>

      {/* Winners Podium (simple layout using existing card styles) */}
      {topThree.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 className='section-title'><span className='title-icon'>🏆</span> Top Performers</h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {topThree.map((t, i) => (
              <div key={i} className='team-card' style={{ minWidth: 280, flex: '1 1 280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800 }}>{i === 0 ? '🥇 1st' : i === 1 ? '🥈 2nd' : '🥉 3rd'}</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>{t.total_score || 0}/90</div>
                </div>
                <h3 style={{ marginTop: 12 }}>{t.team_name}</h3>
                <div className='team-info'>{t.college || 'N/A'}</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ padding: '6px 12px', background: '#e8f5e9', borderRadius: 6, fontSize: 13 }}>
                    📚 Mentoring: <strong>{t.mentoring_avg_score || 0}/40</strong>
                  </div>
                  <div style={{ padding: '6px 12px', background: '#e3f2fd', borderRadius: 6, fontSize: 13 }}>
                    ⚖️ Judging: <strong>{t.judging_avg_score || 0}/50</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs (simple) */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className={`admin-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>📊 Complete Leaderboard</button>
        <button className={`admin-tab ${activeTab === 'detailed' ? 'active' : ''}`} onClick={() => setActiveTab('detailed')}>📋 Detailed Evaluations</button>
      </div>

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div style={{ marginTop: 16 }}>
          <div className='table-wrapper'>
            <table className='admin-table' style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th rowSpan="2">Rank</th>
                  <th rowSpan="2">Team</th>
                  <th rowSpan="2">Institution</th>
                  <th colSpan="4" style={{ background: '#e8f5e9', borderBottom: '1px solid #4CAF50' }}>Mentoring (40 marks)</th>
                  <th colSpan="6" style={{ background: '#e3f2fd', borderBottom: '1px solid #2196F3' }}>Judging (50 marks)</th>
                  <th rowSpan="2" style={{ background: '#fff3cd', fontWeight: 'bold' }}>Total (90)</th>
                </tr>
                <tr>
                  <th style={{ background: '#e8f5e9', fontSize: 11 }}>Innov</th>
                  <th style={{ background: '#e8f5e9', fontSize: 11 }}>Creat</th>
                  <th style={{ background: '#e8f5e9', fontSize: 11 }}>Feas</th>
                  <th style={{ background: '#e8f5e9', fontSize: 11 }}>Pres</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>Innov</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>Creat</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>Feas</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>Pres</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>Design</th>
                  <th style={{ background: '#e3f2fd', fontSize: 11 }}>UX</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={row.team_id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : index + 1}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{row.team_name}</td>
                    <td style={{ padding: '12px', fontSize: 13 }}>{row.college || 'Not specified'}</td>
                    <td style={{ padding: '8px', background: '#f9fdf9', fontSize: 13 }}>{row.mentoring_avg_innovation?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f9fdf9', fontSize: 13 }}>{row.mentoring_avg_creativity?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f9fdf9', fontSize: 13 }}>{row.mentoring_avg_feasibility?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f9fdf9', fontSize: 13 }}>{row.mentoring_avg_presentation?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_innovation?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_creativity?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_feasibility?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_presentation?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_design?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '8px', background: '#f3f9ff', fontSize: 13 }}>{row.judging_avg_user_experience?.toFixed(1) ?? '-'}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', fontSize: 15, background: '#fffef5' }}>
                      {row.total_score?.toFixed(2) ?? '-'}
                      <div style={{ fontSize: 10, color: '#666', fontWeight: 'normal' }}>
                        ({row.mentoring_avg_score?.toFixed(1) ?? '0'}+{row.judging_avg_score?.toFixed(1) ?? '0'})
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed */}
      {activeTab === 'detailed' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Individual judge assessments</h3>
            </div>
            <select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
              <option value='all'>All Judges</option>
              {judges.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className='table-wrapper' style={{ marginTop: 12 }}>
            <table className='admin-table admin-table-detailed' style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Judge</th>
                  <th>Expertise</th>
                  <th>Team</th>
                  <th>Session</th>
                  <th>Innov</th>
                  <th>Creat</th>
                  <th>Feas</th>
                  <th>Pres</th>
                  <th>Design</th>
                  <th>UX</th>
                  <th>Score</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((score, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: score.session_type === 'mentoring' ? '#f9fdf9' : '#f3f9ff'
                    }}
                  >
                    <td style={{ padding: 10 }}>{score.judge_name}</td>
                    <td style={{ padding: 10 }}>{score.expertise}</td>
                    <td style={{ padding: 10, fontWeight: 600 }}>{score.team_name}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: score.session_type === 'mentoring' ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        fontSize: 11
                      }}>
                        {score.session_type === 'mentoring' ? '📚 Mentoring' : '⚖️ Judging'}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>{score.innovation}</td>
                    <td style={{ padding: 10 }}>{score.creativity}</td>
                    <td style={{ padding: 10 }}>{score.feasibility}</td>
                    <td style={{ padding: 10 }}>{score.presentation}</td>
                    <td style={{ padding: 10 }}>{score.design ?? '-'}</td>
                    <td style={{ padding: 10 }}>{score.user_experience ?? '-'}</td>
                    <td style={{ padding: 10, fontWeight: 'bold' }}>
                      {score.final_score}
                      <span style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>
                        /{score.session_type === 'mentoring' ? 40 : 50}
                      </span>
                    </td>
                    <td style={{ padding: 10, maxWidth: 200, fontSize: 11 }}>{score.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
