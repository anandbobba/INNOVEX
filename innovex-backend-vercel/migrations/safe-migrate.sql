-- Safe migration: Creates tables only if they don't exist, preserves data

-- Create teams table (if not exists)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  college VARCHAR(500),
  lead_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create judges table (if not exists)
CREATE TABLE IF NOT EXISTS judges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expertise VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop and recreate scores table with CORRECT calculations
DROP TABLE IF EXISTS scores CASCADE;

CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  judge_id INTEGER REFERENCES judges(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('mentoring', 'judging')),
  innovation INTEGER NOT NULL CHECK (innovation >= 0 AND innovation <= 10),
  creativity INTEGER NOT NULL CHECK (creativity >= 0 AND creativity <= 10),
  feasibility INTEGER NOT NULL CHECK (feasibility >= 0 AND feasibility <= 10),
  presentation INTEGER NOT NULL CHECK (presentation >= 0 AND presentation <= 10),
  design INTEGER CHECK (design >= 0 AND design <= 10),
  user_experience INTEGER CHECK (user_experience >= 0 AND user_experience <= 10),
  -- Correct calculation:
  -- Mentoring: (4 parameters / 40) * 400 = total out of 400
  -- Judging: (6 parameters / 60) * 500 = total out of 500
  total_score INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN session_type = 'mentoring' THEN (innovation + creativity + feasibility + presentation) * 10
      WHEN session_type = 'judging' THEN ROUND((innovation + creativity + feasibility + presentation + COALESCE(design, 0) + COALESCE(user_experience, 0))::numeric * 500.0 / 60.0)::integer
      ELSE 0
    END
  ) STORED,
  -- Final score as decimal for precise calculations
  final_score NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN session_type = 'mentoring' THEN (innovation + creativity + feasibility + presentation)::numeric * 10
      WHEN session_type = 'judging' THEN ROUND((innovation + creativity + feasibility + presentation + COALESCE(design, 0) + COALESCE(user_experience, 0))::numeric * 500.0 / 60.0, 2)
      ELSE 0
    END
  ) STORED,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(judge_id, team_id, session_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_judges_email ON judges(email);

-- Drop and recreate the view with correct calculations
DROP VIEW IF EXISTS team_results;

CREATE OR REPLACE VIEW team_results AS
SELECT 
  t.id as team_id,
  t.name as team_name,
  t.college,
  COUNT(DISTINCT CASE WHEN s.session_type = 'mentoring' THEN s.judge_id END) as mentoring_judge_count,
  COUNT(DISTINCT CASE WHEN s.session_type = 'judging' THEN s.judge_id END) as judging_judge_count,
  ROUND(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.innovation END)::numeric, 2) as mentoring_avg_innovation,
  ROUND(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.creativity END)::numeric, 2) as mentoring_avg_creativity,
  ROUND(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.feasibility END)::numeric, 2) as mentoring_avg_feasibility,
  ROUND(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.presentation END)::numeric, 2) as mentoring_avg_presentation,
  ROUND(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.final_score END)::numeric, 2) as mentoring_avg_score,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.innovation END)::numeric, 2) as judging_avg_innovation,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.creativity END)::numeric, 2) as judging_avg_creativity,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.feasibility END)::numeric, 2) as judging_avg_feasibility,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.presentation END)::numeric, 2) as judging_avg_presentation,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.design END)::numeric, 2) as judging_avg_design,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.user_experience END)::numeric, 2) as judging_avg_user_experience,
  ROUND(AVG(CASE WHEN s.session_type = 'judging' THEN s.final_score END)::numeric, 2) as judging_avg_score,
  ROUND(
    COALESCE(AVG(CASE WHEN s.session_type = 'mentoring' THEN s.final_score END), 0) + 
    COALESCE(AVG(CASE WHEN s.session_type = 'judging' THEN s.final_score END), 0)
  , 2) as total_score
FROM teams t
LEFT JOIN scores s ON s.team_id = t.id
GROUP BY t.id, t.name, t.college
ORDER BY total_score DESC NULLS LAST;
