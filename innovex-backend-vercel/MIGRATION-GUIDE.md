# Database Migration Guide

## Issues Fixed

### 1. **Database Reset Problem** ✅
**Problem**: Running `node migrate.js` was dropping all tables (DROP TABLE IF EXISTS), which cleared all teams, judges, and scores data.

**Solution**: Created a new safe migration file (`safe-migrate.sql`) that:
- Uses `CREATE TABLE IF NOT EXISTS` for teams and judges
- Only drops and recreates the `scores` table with corrected calculations
- Preserves all existing team and judge data

### 2. **Score Calculation Errors** ✅
**Problem**: The calculation formulas were incorrect:
- Old formula for judging: `(sum * 10 / 6 * 5)` = incorrect order of operations
- This was calculating: `(sum * 10) / 6 * 5` instead of proper scaling

**Solution**: Fixed calculations:
- **Mentoring**: 4 parameters out of 10 each = max 40 points → average to 40 points
  - Formula: `(innovation + creativity + feasibility + presentation) / 4`
  - Max score: 40
  
- **Judging**: 6 parameters out of 10 each = max 60 points → scaled to 50 points
  - Formula: `(sum of 6 parameters) × 50 / 60`
  - Max score: 50

- **Total Score**: Mentoring (40) + Judging (50) = Maximum 90 points

### 3. **Marks Not Updating** ✅
**Problem**: Generated columns (`total_score` and `final_score`) might not recalculate properly with the old incorrect formulas.

**Solution**: 
- Corrected the generated column formulas
- These will automatically recalculate when scores are inserted or updated
- Using `STORED` keyword ensures values are computed and saved

## How to Use

### For Safe Migration (Preserves Data) - **RECOMMENDED**
If you already have teams, judges, and scores data:

```bash
node migrate.js --safe
```

This will:
- Keep all your teams data
- Keep all your judges data
- Drop and recreate only the scores table with correct calculations
- Re-seed any missing teams or judges

### For Fresh Installation (Clears Everything)
If you want to start completely fresh:

```bash
node migrate.js
```

⚠️ **WARNING**: This will delete ALL data including teams, judges, and scores!

## Scoring System Explanation

### Mentoring Phase
- **Parameters**: Innovation, Creativity, Feasibility, Presentation (4 total)
- **Range**: Each 0-10
- **Calculation**: Average of 4 parameters = (Sum / 4)
- **Max Score**: (40 / 4) = **40 points**

### Judging Phase
- **Parameters**: Innovation, Creativity, Feasibility, Presentation, Design, User Experience (6 total)
- **Range**: Each 0-10
- **Calculation**: (Sum of 6 parameters × 50) / 60
- **Max Score**: (60 × 50) / 60 = **50 points**

### Final Total Score
- Mentoring Average + Judging Average
- **Maximum Possible**: 40 + 50 = **90 points**

## Example Calculations

### Example 1: Perfect Scores
**Mentoring**: Innovation=10, Creativity=10, Feasibility=10, Presentation=10
- Score: (10+10+10+10) / 4 = **40 points**

**Judging**: All 6 parameters = 10
- Score: (60 × 50) / 60 = **50 points**

**Total**: 40 + 50 = **90 points**

### Example 2: Mixed Scores
**Mentoring**: Innovation=8, Creativity=7, Feasibility=9, Presentation=8
- Score: (8+7+9+8) / 4 = **32 points**

**Judging**: Innovation=9, Creativity=8, Feasibility=8, Presentation=9, Design=7, UX=8
- Score: (49 × 50) / 60 = **40.83 points**

**Total**: 32 + 40.83 = **72.83 points**

## Verifying the Migration

After running the migration, you can verify the calculations:

```sql
-- Check a sample score calculation
SELECT 
  session_type,
  innovation, creativity, feasibility, presentation, design, user_experience,
  total_score,
  final_score
FROM scores
LIMIT 5;

-- Check team results
SELECT 
  team_name,
  mentoring_avg_score,
  judging_avg_score,
  total_score
FROM team_results
ORDER BY total_score DESC
LIMIT 10;
```

## Notes

- The `scores` table uses generated columns that automatically calculate scores
- No manual calculation needed in the application code
- The view `team_results` aggregates and averages all judges' scores per team
- All calculations preserve precision using NUMERIC type and ROUND to 2 decimal places
