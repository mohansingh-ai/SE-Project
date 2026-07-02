/**
 * Gemini API helpers for:
 * 1. Resume Parsing  - extracting structured data from resume text
 * 2. AI Job Matching - semantic comparison of candidate vs job requirements
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,  // Increased to handle long skill lists
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Robustly extract a JSON object from a string that may be truncated.
 * 1. Try normal JSON.parse first.
 * 2. Strip markdown code fences.
 * 3. Extract the first {...} block and attempt to repair truncated arrays/strings.
 */
function extractJSON(raw) {
  // Step 1: strip markdown fences
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Step 2: try direct parse
  try { return JSON.parse(cleaned); } catch {}

  // Step 3: find first complete JSON object using brace counting
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response.');
  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }

  if (end !== -1) {
    // Found a complete JSON block
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }

  // Step 4: Response was truncated — attempt to auto-repair the JSON
  // Take everything from { to end of string and close all open structures
  let partial = cleaned.slice(start);

  // Remove trailing incomplete string/array element (e.g. `"LangChain", "`)
  partial = partial.replace(/,\s*"[^"]*$/, '');        // remove trailing incomplete string
  partial = partial.replace(/,\s*$/, '');               // remove trailing comma

  // Close any unclosed arrays
  const openBrackets = (partial.match(/\[/g) || []).length;
  const closeBrackets = (partial.match(/\]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) partial += ']';

  // Close any unclosed objects
  const openBraces = (partial.match(/\{/g) || []).length;
  const closeBraces = (partial.match(/\}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) partial += '}';

  try { return JSON.parse(partial); } catch (e) {
    throw new Error('Failed to parse JSON from Gemini response. Raw output: ' + raw.slice(0, 300));
  }
}


/**
 * RESUME PARSING ENGINE
 * ─────────────────────
 * Sends raw resume text to Gemini with a strict structured-output prompt.
 * The prompt instructs Gemini to return ONLY valid JSON so we can parse it
 * directly — no additional text or markdown code fences.
 *
 * Fields extracted:
 *   - name, email, phone
 *   - skills[]          (flat list of technical/soft skills)
 *   - education[]       (degree, institution, year)
 *   - workExperience[]  (title, company, duration, description)
 *   - summary           (brief professional summary)
 */
export async function parseResume(resumeText) {
  const prompt = `
You are an expert resume parser. Extract structured information from the resume text below.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

Required JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "summary": "Brief professional summary in 2-3 sentences",
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    { "degree": "B.Sc Computer Science", "institution": "University Name", "year": "2020" }
  ],
  "workExperience": [
    { "title": "Job Title", "company": "Company Name", "duration": "2021 - 2023", "description": "Key responsibilities" }
  ]
}

Resume Text:
${resumeText}
`;

  const raw = await callGemini(prompt);
  return extractJSON(raw);
}

/**
 * AI MATCHING ENGINE
 * ──────────────────
 * Computes a semantic match score between a candidate's parsed resume
 * and a job posting's requirements.
 *
 * Scoring Logic (as instructed to Gemini):
 *   - Skills Match (40%): Does the candidate have the required skills?
 *     Uses semantic understanding: "ReactJS" == "React.js", "ML" == "Machine Learning"
 *   - Experience Relevance (35%): Is the candidate's work history relevant to the role?
 *     Considers job titles, industry, and described responsibilities.
 *   - Education Fit (25%): Does the candidate's educational background align?
 *     e.g., CS degree for a software role is a strong signal.
 *
 * Returns:
 *   - score         (0–100 integer)
 *   - matchedSkills (skills from requirements found in resume)
 *   - missingSkills (skills from requirements NOT found in resume)
 *   - explanation   (human-readable summary of the match)
 */
export async function computeMatchScore(parsedResume, job) {
  const prompt = `
You are an expert AI recruitment assistant. Evaluate how well a candidate matches a job posting.

SCORING RUBRIC (total = 100 points):
1. Skills Match        (40 pts): Does the candidate have the required skills?
   - Use semantic matching: "React.js" = "ReactJS", "ML" = "Machine Learning", "Node" = "Node.js"
   - Partial credit for adjacent/related skills
2. Experience Relevance (35 pts): Is their work history relevant to this role?
   - Consider job titles, companies, and described responsibilities
   - More years of relevant experience = higher score
3. Education Fit        (25 pts): Does their education align with the role?
   - Relevant degree field = full points
   - Bootcamp/self-taught with strong skills = partial credit

Return ONLY valid JSON — no markdown, no explanation:
{
  "score": <integer 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "explanation": "2-3 sentence explanation of the match score"
}

JOB POSTING:
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.requiredSkills?.join(', ')}
Experience Level: ${job.experienceLevel}

CANDIDATE PROFILE:
Name: ${parsedResume.name}
Skills: ${parsedResume.skills?.join(', ')}
Education: ${parsedResume.education?.map(e => `${e.degree} from ${e.institution} (${e.year})`).join('; ')}
Work Experience: ${parsedResume.workExperience?.map(w => `${w.title} at ${w.company} (${w.duration}): ${w.description}`).join(' | ')}
Summary: ${parsedResume.summary}
`;

  const raw = await callGemini(prompt);
  return extractJSON(raw);
}
