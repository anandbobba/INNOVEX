// migrate.js — Run migrations + seed
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./api/db");

async function migrate() {
  // Check for --safe flag to use safe migration (preserves data)
  const useSafeMigration = process.argv.includes('--safe');
  
  console.log(`🚀 Running ${useSafeMigration ? 'SAFE' : 'FRESH'} migrations...`);
  
  if (useSafeMigration) {
    console.log("⚠️  Using safe migration - preserving existing teams and judges data");
  } else {
    console.log("⚠️  WARNING: This will DROP all tables and data! Use --safe flag to preserve data");
  }

  const sqlFile = useSafeMigration ? "safe-migrate.sql" : "init.sql";
  const sqlPath = path.join(__dirname, "migrations", sqlFile);
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);

  console.log("✨ Migrated.");

  console.log("🚀 Seeding database...");

  const teams = [
    { name: 'Team Prime', college: 'Canara Engineering College', lead: 'acharpramod441@gm...' },
    { name: 'AI Alchemists', college: '', lead: 'Aashna Mathias' },
    { name: 'Tech Titans', college: 'Canara Engineering College', lead: 'Parineeta G' },
    { name: 'Kurukshetra Conquerors', college: 'Moodlakatte Institute of Technology Kundapura', lead: 'Apoorva' },
    { name: 'Echobit', college: 'Siddaganga Institute of Technology', lead: 'Diksha Lamle' },
    { name: 'QWERTY', college: 'NMAM Institute of Technology, Nitte', lead: 'Calvin Dsouza' },
    { name: 'Innov8r', college: 'Siddaganga Institute of Technology', lead: 'Aryan Kumar S Gupta' },
    { name: 'TEAM NEON', college: 'Srinivas Institute of Technology', lead: 'Muhammad Nazeem' },
    { name: 'Asthra', college: 'APS College of Engineering', lead: 'Prerana Madhusudhan' },
    { name: 'Team FarmX', college: 'Mangalore Institute of Technology and Engineering', lead: 'Abhishek Mendon' },
    { name: 'DIVYANTRA', college: 'NMAM Institute of Technology, Nitte', lead: 'Trishal Hegde' },
    { name: 'CodexT12', college: 'Mangalore Institute of Technology and Engineering', lead: 'Likith' },
    { name: 'DOMIN8', college: 'NMAM Institute of Technology, Nitte', lead: 'Shreya P J' },
    { name: 'CodeXT14', college: 'Canara Engineering College', lead: 'Jnanesh m' },
    { name: 'BlockHarvest', college: 'NMAM Institute of Technology', lead: 'Vineeth Bhatta' },
    { name: 'QUADRUPLE', college: 'NMAM INSTITUTE OF TECHNOLOGY', lead: 'Shrishti Kundur' },
    { name: 'The Coders', college: 'Alvas Institute of Engineering & Technology', lead: 'Nivedita R Kagale' },
    { name: 'Charvish', college: 'PESITM Shimoga', lead: 'Chaithanya K' },
    { name: 'Traffiq', college: 'Sahyadri College of Engineering and Management', lead: 'C Vikas Raju' },
    { name: 'AVYARAX', college: 'Moodlakatte Institute of Technology Kundapura', lead: 'Preetish Ambig' },
    { name: 'CodeCatalystX', college: 'Canara College of Engineering', lead: 'K Sriganesh Kamath' },
    { name: 'Gradients', college: 'Siddaganga Institute of Technology', lead: 'Prasuri' },
    { name: 'INFINITYV369', college: 'GM University', lead: 'Pranav S Chakrapani' },
    { name: 'Dataforge', college: 'Canara College of Engineering', lead: 'Shreya P' },
    { name: 'Prism', college: 'Yenopoya Institute of Technology', lead: 'Teja Raghavendra Shar' },
    { name: 'Nexora', college: 'VCET, Puttur', lead: 'Anusha Shivraj Kharvi' },
    { name: 'TANTRAVID', college: 'Shree Devi Institute of Technology', lead: 'Sooraj Bangera' },
    { name: 'Evara', college: 'NMAMIT', lead: 'Brahma rai m' },
    { name: 'Potato', college: 'Karnataka Govt Polytechnic College Mangalore', lead: 'Muhammad Ansar B' },
    { name: 'Velora', college: 'Jain College of Engineering, Belagavi', lead: 'Nanditha N' },
    { name: 'BYTE BHARAT', college: 'NMAM Institute of Technology, Nitte', lead: 'Ayush C S' },
    { name: 'THE SUMMIT', college: 'A J Institute of Engineering and Technology', lead: 'Aboobakkar Twaha' },
    { name: 'SakhiSuraksha', college: 'Maharaja Institute of Technology Thandavapura, M', lead: 'Rakshitha K M' },
    { name: 'Elite Coders', college: 'Canara Engineering College', lead: 'Sonika' },
    { name: 'SEMICOLONS', college: 'Siddaganga Institute of Technology, Tumkur', lead: 'Debadatta Ray' },
    { name: 'Logic Circle', college: 'Mangalore Institute of Technology and Engineering', lead: 'Harshitha' },
    { name: 'ByteBenders', college: 'KLE Technological University', lead: 'Amit Kulkarni' },
    { name: 'CODE VIPERS', college: 'AITM BHATKAL', lead: 'Anas Ahamed' },
    { name: 'Safe road innovators', college: 'Smvitm Bantakal', lead: 'Sujal s kumar' },
    { name: 'The APIcalypse', college: 'SMVITM Bantakal', lead: 'Abhinandana Bhatta' },
    { name: 'XENIN', college: '', lead: '' },
    { name: 'VAJRAYUDHA', college: 'Nmamit', lead: 'Sampanna' },
    { name: 'Kanyaraasi', college: 'Alvas Institute of Engineering and Technology', lead: 'UNNATH' },
    { name: 'Smartsync', college: 'Yenopoya Institute of Engineering', lead: 'Surekha Hanumaiah gd' },
    { name: 'Andromeda', college: 'Siddaganga Institute of Technology, Tumkur', lead: 'Kartik Kumar Singh' },
    { name: 'VisionTech', college: 'KLE Technological University', lead: 'Neha Jambanagoud' },
    { name: 'Heritage hackers', college: 'SDM Institute of Technology', lead: 'Moulya C R' },
    { name: 'Fusion Matrix', college: 'JNN COLLEGE OF ENGINEERING', lead: 'Anusha N Shet' }
  ];

  for (const t of teams) {
    await pool.query(
      'INSERT INTO teams(name, college, lead_name) VALUES($1,$2,$3) ON CONFLICT(name) DO NOTHING',
      [t.name, t.college, t.lead]
    );
  }

  const judges = [
    { name: 'Sujith Kumar', email: 'sujith.kumar@niveus.in', password: 'judge123', expertise: 'Solution Architecture', is_admin: false },
    { name: 'Prashanth B Shetty', email: 'prashanth@a1logiics.com', password: 'judge123', expertise: 'Business Operations', is_admin: false },
    { name: 'Krishna Prasad N Rao', email: 'krishna@niveus.in', password: 'judge123', expertise: 'Technology Compliance', is_admin: false },
    { name: 'Nagaraj Pandith', email: 'nagaraj@wipfli.in', password: 'judge123', expertise: 'Software Engineering', is_admin: false },
    { name: 'Swasthik Shetty', email: 'swasthik@redbus.in', password: 'judge123', expertise: 'Software Engineering', is_admin: false },
    { name: 'Praveen Castelino', email: 'praveen@codecraft.tech', password: 'judge123', expertise: 'CTO & Co-Founder', is_admin: false },
    { name: 'Darshan Bhandary', email: 'darshan@kyndryl.com', password: 'judge123', expertise: 'Infrastructure', is_admin: false },
    { name: 'Deveesh Shetty', email: 'deveesh@levels.fyi', password: 'judge123', expertise: 'Software Engineering', is_admin: false },
    { name: 'Bhargavi Nayak', email: 'bhargavi@agiliad.com', password: 'judge123', expertise: 'Sr. Software Engineer', is_admin: false },
    { name: 'Admin', email: 'admin@innovex.nmamit.in', password: 'admin123', expertise: 'Administrator', is_admin: true }
  ];

  for (const j of judges) {
    const exists = await pool.query('SELECT id FROM judges WHERE email=$1', [j.email]);
    if (!exists.rowCount) {
      const hash = await bcrypt.hash(j.password, 10);
      await pool.query(
        'INSERT INTO judges(name,email,password_hash,expertise,is_admin) VALUES($1,$2,$3,$4,$5)',
        [j.name, j.email, hash, j.expertise, j.is_admin]
      );
    }
  }
  
  console.log("✅ Done seeding.");
}

migrate()
  .then(() => {
    console.log("✅ Migration complete.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });