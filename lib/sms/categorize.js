import { defaultCategories } from "../../data/categories.js";

export const CATEGORY_IDS = new Set(defaultCategories.map((c) => c.id));

export function isValidCategory(id) {
  return typeof id === "string" && CATEGORY_IDS.has(id);
}

const EXPENSE_KEYWORDS = [
  ["swiggy", "food"], ["zomato", "food"], ["dominos", "food"], ["pizza hut", "food"],
  ["mcdonald", "food"], ["burger king", "food"], ["kfc", "food"], ["subway", "food"],
  ["starbucks", "food"], ["chaayos", "food"], ["chai point", "food"], ["dunkin", "food"],
  ["faasos", "food"], ["behrouz", "food"], ["ovenstory", "food"], ["box8", "food"],
  ["eatfit", "food"], ["barbeque nation", "food"], ["restaurant", "food"], ["cafe", "food"],
  ["bakery", "food"], ["biryani", "food"],

  ["blinkit", "groceries"], ["zepto", "groceries"], ["bigbasket", "groceries"],
  ["instamart", "groceries"], ["grofers", "groceries"], ["jiomart", "groceries"],
  ["dmart", "groceries"], ["d mart", "groceries"], ["reliance fresh", "groceries"],
  ["spencers", "groceries"], ["natures basket", "groceries"], ["licious", "groceries"],
  ["freshtohome", "groceries"], ["country delight", "groceries"], ["milkbasket", "groceries"],
  ["kirana", "groceries"], ["supermarket", "groceries"],

  ["ola", "transportation"], ["uber", "transportation"], ["rapido", "transportation"],
  ["blusmart", "transportation"], ["yulu", "transportation"], ["irctc", "transportation"],
  ["redbus", "transportation"], ["indian oil", "transportation"], ["indianoil", "transportation"],
  ["bharat petroleum", "transportation"], ["hindustan petroleum", "transportation"],
  ["hpcl", "transportation"], ["bpcl", "transportation"], ["iocl", "transportation"],
  ["petrol", "transportation"], ["fuel", "transportation"], ["fastag", "transportation"],
  ["netc", "transportation"], ["parking", "transportation"], ["metro", "transportation"],
  ["dmrc", "transportation"], ["bmtc", "transportation"], ["toll", "transportation"],

  ["jio", "utilities"], ["airtel", "utilities"], ["vodafone", "utilities"],
  ["bsnl", "utilities"], ["act fibernet", "utilities"], ["hathway", "utilities"],
  ["bescom", "utilities"], ["mseb", "utilities"], ["adani electricity", "utilities"],
  ["tata power", "utilities"], ["torrent power", "utilities"], ["electricity", "utilities"],
  ["mahanagar gas", "utilities"], ["indraprastha gas", "utilities"], ["water board", "utilities"],
  ["broadband", "utilities"], ["recharge", "utilities"],

  ["netflix", "entertainment"], ["spotify", "entertainment"], ["hotstar", "entertainment"],
  ["disney", "entertainment"], ["prime video", "entertainment"], ["primevideo", "entertainment"],
  ["sonyliv", "entertainment"], ["zee5", "entertainment"], ["jiocinema", "entertainment"],
  ["bookmyshow", "entertainment"], ["pvr", "entertainment"], ["inox", "entertainment"],
  ["cinepolis", "entertainment"], ["youtube premium", "entertainment"], ["gaana", "entertainment"],
  ["wynk", "entertainment"], ["audible", "entertainment"], ["steam games", "entertainment"],
  ["playstation", "entertainment"], ["xbox", "entertainment"], ["nintendo", "entertainment"],

  ["amazon pay", "shopping"], ["amazon", "shopping"], ["flipkart", "shopping"],
  ["myntra", "shopping"], ["ajio", "shopping"], ["meesho", "shopping"],
  ["nykaa", "shopping"], ["snapdeal", "shopping"], ["tatacliq", "shopping"],
  ["tata cliq", "shopping"], ["croma", "shopping"], ["reliance digital", "shopping"],
  ["vijay sales", "shopping"], ["decathlon", "shopping"], ["ikea", "shopping"],
  ["lenskart", "shopping"], ["firstcry", "shopping"], ["urbanic", "shopping"],

  ["apollo", "healthcare"], ["pharmeasy", "healthcare"], ["1mg", "healthcare"],
  ["netmeds", "healthcare"], ["medplus", "healthcare"], ["practo", "healthcare"],
  ["cultfit", "healthcare"], ["cult fit", "healthcare"], ["healthkart", "healthcare"],
  ["wellness forever", "healthcare"], ["thyrocare", "healthcare"], ["dr lal", "healthcare"],
  ["fortis", "healthcare"], ["manipal hospital", "healthcare"], ["medanta", "healthcare"],
  ["pharmacy", "healthcare"], ["hospital", "healthcare"], ["clinic", "healthcare"],
  ["diagnostic", "healthcare"],

  ["byju", "education"], ["unacademy", "education"], ["vedantu", "education"],
  ["coursera", "education"], ["udemy", "education"], ["upgrad", "education"],
  ["simplilearn", "education"], ["testbook", "education"], ["physicswallah", "education"],
  ["skillshare", "education"], ["tuition", "education"], ["college fee", "education"],

  ["makemytrip", "travel"], ["goibibo", "travel"], ["cleartrip", "travel"],
  ["yatra", "travel"], ["ixigo", "travel"], ["easemytrip", "travel"],
  ["airbnb", "travel"], ["oyo", "travel"], ["indigo", "travel"],
  ["air india", "travel"], ["vistara", "travel"], ["spicejet", "travel"],
  ["akasa", "travel"], ["agoda", "travel"], ["booking com", "travel"],

  ["urban company", "personal"], ["urbanclap", "personal"], ["lakme", "personal"],
  ["vlcc", "personal"], ["salon", "personal"], ["spa", "personal"],
  ["gym", "personal"], ["fitness", "personal"],

  ["policybazaar", "insurance"], ["hdfc life", "insurance"], ["icici pru", "insurance"],
  ["max life", "insurance"], ["bajaj allianz", "insurance"], ["star health", "insurance"],
  ["sbi life", "insurance"], ["tata aig", "insurance"], ["digit insurance", "insurance"],
  ["acko", "insurance"], ["premium payment", "insurance"], ["insurance", "insurance"],

  ["nobroker", "housing"], ["housing com", "housing"], ["magicbricks", "housing"],
  ["society maintenance", "housing"], ["maintenance", "housing"], ["rent", "housing"],

  ["donation", "gifts"], ["giveindia", "gifts"], ["ketto", "gifts"],
  ["milaap", "gifts"], ["charity", "gifts"], ["temple", "gifts"],

  ["credit card payment", "bills"], ["card payment", "bills"], ["bill payment", "bills"],
  ["billdesk", "bills"], ["bbps", "bills"], ["service charge", "bills"],
  ["late fee", "bills"], ["annual fee", "bills"], ["processing fee", "bills"],
];

const INCOME_KEYWORDS = [
  ["salary", "salary"], ["payroll", "salary"], ["wages", "salary"], ["stipend", "salary"],
  ["zerodha", "investments"], ["groww", "investments"], ["upstox", "investments"],
  ["angel one", "investments"], ["angelone", "investments"], ["kuvera", "investments"],
  ["mutual fund", "investments"], ["dividend", "investments"], ["interest", "investments"],
  ["redemption", "investments"],
  ["upwork", "freelance"], ["fiverr", "freelance"], ["freelance", "freelance"],
  ["rent received", "rental"], ["rental income", "rental"],
];

function prepare(pairs) {
  return pairs
    .filter(([, id]) => isValidCategory(id))
    .sort((a, b) => b[0].length - a[0].length);
}

export function invalidKeywordEntries() {
  return [...EXPENSE_KEYWORDS, ...INCOME_KEYWORDS].filter(
    ([, id]) => !isValidCategory(id)
  );
}

const PREPARED_EXPENSE = prepare(EXPENSE_KEYWORDS);
const PREPARED_INCOME = prepare(INCOME_KEYWORDS);

{
  const bad = invalidKeywordEntries();
  if (bad.length > 0) {
    console.warn(
      `[sms/categorize] ignoring ${bad.length} keyword entries with unknown category ids:`,
      bad.map(([kw, id]) => `${kw} -> ${id}`).join(", ")
    );
  }
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CONFIDENCE = {
  KEYWORD: 0.9,
  INCOME_HEURISTIC: 0.75,
  AI: 0.6,
  FALLBACK: 0.3,
};

function fallbackCategory(type) {
  return type === "INCOME" ? "other-income" : "other-expense";
}

export async function categorizeWithAI({ merchant, description, type }) {
  if (!process.env.GEMINI_API_KEY) return null;

  const allowed = defaultCategories
    .filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE"))
    .map((c) => c.id);

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = [
      "Classify this Indian bank transaction into exactly one category.",
      `Merchant: ${merchant || "unknown"}`,
      `Details: ${description || "none"}`,
      `Direction: ${type}`,
      `Allowed categories: ${allowed.join(", ")}`,
      "Reply with the category id only, no punctuation or explanation.",
    ].join("\n");

    const result = await model.generateContent(prompt);
    const guess = result.response.text().trim().toLowerCase().replace(/[^a-z-]/g, "");
    return allowed.includes(guess) ? guess : null;
  } catch (error) {
    console.error("[sms/categorize] AI tier failed:", error.message);
    return null;
  }
}

export async function categorizeTransaction({
  merchant,
  description = "",
  type,
  useAI = false,
}) {
  const direction = type === "INCOME" ? "INCOME" : "EXPENSE";
  const haystack = normalize(`${merchant || ""} ${description}`);

  if (haystack) {
    const table = direction === "INCOME" ? PREPARED_INCOME : PREPARED_EXPENSE;
    for (const [keyword, category] of table) {
      if (haystack.includes(keyword)) {
        return { category, confidence: CONFIDENCE.KEYWORD, tier: "keyword" };
      }
    }
  }

  if (direction === "INCOME") {
    return {
      category: "other-income",
      confidence: CONFIDENCE.INCOME_HEURISTIC,
      tier: "income-heuristic",
    };
  }

  if (useAI) {
    const aiCategory = await categorizeWithAI({ merchant, description, type: direction });
    if (aiCategory) {
      return { category: aiCategory, confidence: CONFIDENCE.AI, tier: "ai" };
    }
  }

  return {
    category: fallbackCategory(direction),
    confidence: CONFIDENCE.FALLBACK,
    tier: "fallback",
  };
}
