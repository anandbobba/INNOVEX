import React from 'react';

export default function TeamList({ teams, onSelect, selected, scoredTeamIds }) {
  return (
    <div className='card team-list-card'>
      <h3>Teams ({teams.length})</h3>
      <div className='team-list'>
        {teams.map(t => (
          <div
            key={t.id}
            className={`team-item ${selected?.id === t.id ? 'selected' : ''} ${scoredTeamIds.has(t.id) ? 'scored' : ''}`}
            onClick={() => onSelect(t)}
          >
            <div className='team-info'>
              <div className='team-name'>
                {t.name}
                {scoredTeamIds.has(t.id) && <span className='scored-badge'>✓</span>}
              </div>
              {t.college && <div className='team-college'>{t.college}</div>}
              {t.lead_name && <div className='team-lead'>Lead: {t.lead_name}</div>}
            </div>
            <button className='button small'>
              {scoredTeamIds.has(t.id) ? 'Edit' : 'Score'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}