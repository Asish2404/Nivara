# Intent based Guide/Assistant --> Not Chatbot
import re
from typing import Dict, List, Optional, Tuple

# Supported Intent Constants
INTENT_WATERLOGGING_QUERY = "WATERLOGGING_QUERY"
INTENT_REPORT_QUERY = "REPORT_QUERY"
INTENT_AREA_QUERY = "AREA_QUERY"
INTENT_ROUTE_QUERY = "ROUTE_QUERY"
INTENT_NAVIGATION = "NAVIGATION"
INTENT_HELP = "HELP"
INTENT_GREETING = "GREETING"
INTENT_UNKNOWN = "UNKNOWN"

# Route patterns (high priority)
ROUTE_PATTERNS = [
    re.compile(r"\b(?:travell?ing|going|driving|commuting|walking|journey|route|trip|heading)\s+(?:from)\s+(.+?)\s+(?:to|towards)\s+(.+)", re.IGNORECASE),
    re.compile(r"\bfrom\s+(.+?)\s+to\s+(.+?)(?:\.|\?|$|\s+what|\s+show|\s+will)", re.IGNORECASE),
    re.compile(r"\b(?:between)\s+(.+?)\s+and\s+(.+)", re.IGNORECASE),
    re.compile(r"\b(?:along|on)\s+(?:my|the)\s+route\b", re.IGNORECASE),
    re.compile(r"\broute\s+(?:from|between|to)\b", re.IGNORECASE),
    re.compile(r"\bparts?\s+of\s+my\s+route\b", re.IGNORECASE),
    re.compile(r"\bwhich\s+parts?\s+(?:are|will\s+be)\s+waterlogged\b", re.IGNORECASE),
]

# Report patterns
REPORT_PATTERNS = [
    re.compile(r"\b(?:how\s+many|number\s+of|count\s+of|total)\s+(?:complaints?|reports?|grievances?|issues?)\b", re.IGNORECASE),
    re.compile(r"\b(?:any|are\s+there)\s+(?:citizen\s+)?(?:complaints?|reports?|grievances?)\b", re.IGNORECASE),
    re.compile(r"\b(?:complaint|report)\s+(?:count|status|history|list|details?)\b", re.IGNORECASE),
    re.compile(r"\bcheck\s+(?:reports?|complaints?)\b", re.IGNORECASE),
    re.compile(r"\b(?:who|citizens?|users?|people)\s+(?:who\s+)?reported\b", re.IGNORECASE),
    re.compile(r"\breported\s+in\b", re.IGNORECASE),
]

# Area query patterns (e.g. "show me the waterlogging condition in Salt Lake", "what's happening in...")
AREA_PATTERNS = [
    re.compile(r"\bshow\s+(?:me\s+)?(?:the\s+)?(?:waterlogg?ing\s+condition|situation|status|map|overview|risk)\s+(?:in|around|at|for)\b", re.IGNORECASE),
    re.compile(r"\bwhat(?:'s|\s+is)\s+happening\s+(?:in|around|at)\b", re.IGNORECASE),
    re.compile(r"\bshow\s+(?:the\s+)?(?:situation|condition|area)\s+around\b", re.IGNORECASE),
    re.compile(r"\bshow\s+(?:me\s+)?(?:the\s+)?waterlogg?ing\s+(?:situation|around)\b", re.IGNORECASE),
    re.compile(r"\bcondition\s+in\b", re.IGNORECASE),
    re.compile(r"\bhighlight\s+(?:the\s+)?(?:area|locality|zone)\b", re.IGNORECASE),
]

# Waterlogging query patterns
WATERLOGGING_PATTERNS = [
    re.compile(r"\b(?:waterlogg?ing|flood|inundat\w*)\s+(?:probability|chance|risk|severity|condition|forecast|status|level)\b", re.IGNORECASE),
    re.compile(r"\b(?:what\s+is|what's|how\s+is)\s+the\s+(?:waterlogg?ing|water\s+depth|flood|risk|condition)\b", re.IGNORECASE),
    re.compile(r"\bhow\s+severe\s+(?:is|will\s+be)\s+(?:the\s+)?waterlogg?ing\b", re.IGNORECASE),
    re.compile(r"\b(?:will|is)\s+(.+?)\s+(?:be\s+)?(?:affected\s+by\s+waterlogg?ing|waterlogged|flooded)\b", re.IGNORECASE),
    re.compile(r"\bwaterlogg?ing\s+(?:probability|chance|percentage)\b", re.IGNORECASE),
    re.compile(r"\bwater\s+level\s+in\b", re.IGNORECASE),
    re.compile(r"\brisk\s+(?:level|score)\s+(?:of|in)\b", re.IGNORECASE),
    re.compile(r"\bwhich\s+(?:area|sector|ward|part|locality)\s+(?:is|will\s+be)\s+(?:flooded|waterlogged)\b", re.IGNORECASE),
    re.compile(r"\b(?:is|are)\s+(?:flooded|waterlogged)\b", re.IGNORECASE),
]

# Navigation patterns
NAVIGATION_PATTERNS = [
    re.compile(r"\b(?:take\s+me\s+to|open|go\s+to|navigate\s+to|launch|view|show)\s+(?:the\s+)?(complaint|report|reporting|waterlogg?ing\s+map|live\s+map|map|city\s+map|dashboard|admin\s+dashboard|my\s+reports?|action\s+center|respond|simulation|scenario|profile|alerts?|notifications?)\b", re.IGNORECASE),
    re.compile(r"\b(?:my\s+reports?|my\s+complaints?|track\s+(?:my\s+)?reports?|submitted\s+reports?)\b", re.IGNORECASE),
    re.compile(r"\bopen\s+(?:the\s+)?(waterlogg?ing\s+map|live\s+city|map|dashboard|action\s+center|complaint\s+page)\b", re.IGNORECASE),
]

# Help patterns
HELP_PATTERNS = [
    re.compile(r"\b(?:how\s+do\s+i|how\s+can\s+i|how\s+to)\s+(?:submit|file|lodge|register|report|make)\s+(?:a\s+)?(?:complaint|report|incident|grievance)\b", re.IGNORECASE),
    re.compile(r"\bi\s+don't\s+know\s+how\s+to\s+report\b", re.IGNORECASE),
    re.compile(r"\bwhat\s+can\s+you\s+do\b", re.IGNORECASE),
    re.compile(r"\bhow\s+does\s+(?:this|the)\s+system\s+work\b", re.IGNORECASE),
    re.compile(r"\b(?:what\s+are\s+your\s+capabilities|help|guide|instructions|what\s+can\s+i\s+ask)\b", re.IGNORECASE),
]

# Greeting patterns
GREETING_PATTERNS = [
    re.compile(r"^(?:hi|hello|hey|namaste|greetings|good\s+morning|good\s+afternoon|good\s+evening)\b", re.IGNORECASE),
]

# Weighted keywords for scoring fallback
KEYWORDS_MAP: Dict[str, Dict[str, float]] = {
    INTENT_ROUTE_QUERY: {
        "route": 3.0,
        "travelling": 3.0,
        "traveling": 3.0,
        "journey": 2.5,
        "from": 1.5,
        "to": 1.0,
        "facing": 1.5,
        "commute": 2.5,
        "along": 2.0,
        "destination": 2.5,
        "origin": 2.0,
    },
    INTENT_REPORT_QUERY: {
        "complaint": 3.0,
        "complaints": 3.5,
        "report": 2.5,
        "reports": 3.0,
        "grievance": 3.0,
        "grievances": 3.0,
        "citizen": 1.5,
        "lodged": 2.0,
        "registered": 2.0,
        "count": 2.0,
    },
    INTENT_WATERLOGGING_QUERY: {
        "waterlogging": 2.5,
        "waterlogged": 2.5,
        "probability": 3.5,
        "severity": 3.5,
        "score": 2.0,
        "chance": 2.5,
        "flood": 2.0,
        "depth": 2.5,
        "submerged": 2.5,
        "affected": 2.0,
        "risk": 2.0,
        "level": 1.5,
    },
    INTENT_AREA_QUERY: {
        "situation": 2.5,
        "condition": 2.0,
        "around": 2.0,
        "happening": 2.5,
        "area": 2.0,
        "locality": 2.0,
        "overview": 2.0,
        "inspect": 2.0,
        "show": 1.5,
    },
    INTENT_NAVIGATION: {
        "take": 1.5,
        "open": 2.5,
        "navigate": 3.0,
        "goto": 3.0,
        "dashboard": 3.0,
        "page": 2.0,
        "desk": 2.0,
        "screen": 2.0,
    },
    INTENT_HELP: {
        "how": 2.0,
        "help": 3.5,
        "guide": 3.0,
        "submit": 2.0,
        "file": 2.0,
        "lodge": 2.0,
        "capabilities": 3.0,
        "features": 2.5,
        "work": 1.5,
    },
    INTENT_GREETING: {
        "hi": 4.0,
        "hello": 4.0,
        "hey": 4.0,
        "namaste": 4.0,
    },
}


class IntentDetector:
    """Fast, explainable intent classification engine."""

    @staticmethod
    def normalize_text(text: str) -> str:
        """Strip extraneous punctuation, whitespace, and convert to lowercase."""
        if not text:
            return ""
        # Remove multiple whitespaces, strip leading/trailing
        cleaned = re.sub(r"[\r\n\t]+", " ", text).strip().lower()
        # Collapse multiple spaces
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned

    @classmethod
    def detect_intent(cls, raw_text: str) -> Tuple[str, float, Dict[str, float]]:
        """Classify raw input text into one of the controlled intents.

        Returns:
            (intent_name, confidence_score, all_scores_dict)
        """
        text = cls.normalize_text(raw_text)
        if not text:
            return INTENT_UNKNOWN, 0.0, {}

        # 1. Check strong Regex Rules in priority sequence

        # Priority 1: Route query (has distinct syntax like "from X to Y" or "travelling from")
        for pat in ROUTE_PATTERNS:
            if pat.search(text):
                return INTENT_ROUTE_QUERY, 0.95, {INTENT_ROUTE_QUERY: 0.95}

        # Priority 2: Navigation commands ("take me to", "open the map")
        for pat in NAVIGATION_PATTERNS:
            if pat.search(text):
                return INTENT_NAVIGATION, 0.95, {INTENT_NAVIGATION: 0.95}

        # Priority 3: Citizen report queries ("how many complaints", "number of reports")
        for pat in REPORT_PATTERNS:
            if pat.search(text):
                return INTENT_REPORT_QUERY, 0.92, {INTENT_REPORT_QUERY: 0.92}

        # Priority 4: Platform guidance / Help ("how do i submit", "what can you do")
        for pat in HELP_PATTERNS:
            if pat.search(text):
                return INTENT_HELP, 0.92, {INTENT_HELP: 0.92}

        # Priority 5: Area overview questions ("show condition in Salt Lake", "show me the waterlogging condition in Salt Lake")
        for pat in AREA_PATTERNS:
            if pat.search(text):
                return INTENT_AREA_QUERY, 0.90, {INTENT_AREA_QUERY: 0.90}

        # Priority 6: Specific waterlogging prediction questions ("waterlogging probability in Sector V")
        for pat in WATERLOGGING_PATTERNS:
            if pat.search(text):
                return INTENT_WATERLOGGING_QUERY, 0.88, {INTENT_WATERLOGGING_QUERY: 0.88}

        # Priority 7: Greetings
        for pat in GREETING_PATTERNS:
            if pat.search(text):
                return INTENT_GREETING, 0.95, {INTENT_GREETING: 0.95}

        # 2. Weighted Keyword Scoring if no direct regex rule caught it
        words = set(re.findall(r"\b\w+\b", text))
        scores: Dict[str, float] = {}

        for intent, kw_weights in KEYWORDS_MAP.items():
            score = 0.0
            for word, weight in kw_weights.items():
                if word in words:
                    score += weight
            scores[intent] = score

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        # Normalized confidence
        if best_score >= 2.0:
            confidence = min(0.85, 0.40 + (best_score * 0.10))
            return best_intent, confidence, scores

        # Fallback heuristic: If waterlogging keywords are present with a locality mention
        if any(w in words for w in ["waterlog", "waterlogging", "waterlogged", "drainage", "water", "flood", "rain"]):
            return INTENT_WATERLOGGING_QUERY, 0.60, scores

        return INTENT_UNKNOWN, 0.0, scores
