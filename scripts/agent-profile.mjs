/**
 * Agentic profile data: uses OpenAI or Anthropic when API keys are set,
 * otherwise returns deterministic mock data for TG10X (Telangana startup context).
 */

const FALLBACK = {
  fullName: "Aarav Sharma",
  headline: "Founder & product builder | HR tech & talent networks",
  bio: "Building tools to connect job seekers with Hyderabad's fastest-growing startups. Interested in mentorship, partnerships, and seed-stage conversations.",
  linkedIn: "https://www.linkedin.com/in/example-aarav-sharma",
  website: "https://example-startup.io",
  phone: "9876543210",
  address1: "HITEC City, Phase 2",
  area: "Madhapur",
  city: "Hyderabad",
  pincode: "500081",
  country: "India",
  designation: "Co-Founder & CEO",
  companyContactEmail: "contact@hyderabadjobs-demo.example",
  lookingForTags: ["Mentorship", "Partnerships", "Funding"],
  companyTagline: "Your Gateway to Opportunities in Hyderabad.",
  companyDescription:
    "We help employers and talent discover each other across Telangana with verified listings and smart matching.",
  teamSize: 12,
  foundedYear: 2018,
  totalFundingInr: 0,
  fy2025RevenueInr: 0,
  fy2026RevenueInr: 0,
  businessModel: "SAAS",
  pitchDeckUrl: "",
};

const SCHEMA_HINT = `Return a single JSON object with these string/number fields (all required unless noted):
fullName, headline (max 200 chars), bio (max 600 chars), linkedIn (https URL), website (https URL),
phone (10-digit Indian mobile, digits only),
address1, area, city, pincode (6 digits), country,
designation (startup role title),
companyContactEmail (valid-looking startup email),
lookingForTags (array of 3-5 short strings like "Mentorship", "Hiring", "Partnerships"),
companyTagline (max 120 chars), companyDescription (2-3 sentences),
teamSize (integer 5-40), foundedYear (integer 2015-2023),
totalFundingInr, fy2025RevenueInr, fy2026RevenueInr (non-negative integers, use 0 if unknown),
businessModel (one of: B2B, B2C, SAAS, Marketplace, D2C),
pitchDeckUrl (empty string or https URL placeholder).
Context: founder building in Telangana / Hyderabad startup ecosystem, realistic but anonymized.`;

async function openaiProfile() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You output only valid JSON for a startup founder profile. No markdown.",
        },
        { role: "user", content: `${SCHEMA_HINT}\n\n${JSON.stringify(FALLBACK)}` },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI: empty response");
  return JSON.parse(text);
}

async function anthropicProfile() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Output only a JSON object, no prose.\n\n${SCHEMA_HINT}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Anthropic: empty response");
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

function merge(base, patch) {
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (patch[k] !== undefined && patch[k] !== null) out[k] = patch[k];
  }
  if (Array.isArray(patch.lookingForTags) && patch.lookingForTags.length)
    out.lookingForTags = patch.lookingForTags;
  return out;
}

/**
 * @returns {Promise<typeof FALLBACK>}
 */
export async function getProfileData() {
  try {
    if (process.env.OPENAI_API_KEY) {
      console.log("Agent: generating profile with OpenAI…");
      const gen = await openaiProfile();
      return merge(FALLBACK, gen);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      console.log("Agent: generating profile with Anthropic…");
      const gen = await anthropicProfile();
      return merge(FALLBACK, gen);
    }
  } catch (e) {
    console.warn("Agent LLM failed, using fallback mock:", e.message);
  }
  console.log("Agent: using built-in mock profile (set OPENAI_API_KEY or ANTHROPIC_API_KEY for LLM).");
  return { ...FALLBACK };
}
