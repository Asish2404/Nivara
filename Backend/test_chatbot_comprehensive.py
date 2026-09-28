"""Comprehensive test suite for Ask Kolkata Intelligent Chatbot."""

import asyncio
import json
from httpx import AsyncClient, ASGITransport
from app.main import app

TEST_CASES = [
    {
        "id": "TEST_1_WATERLOGGING_VALID",
        "description": "Valid waterlogging query for Salt Lake Sector V",
        "query": "What is the waterlogging probability in Salt Lake Sector V?",
        "expected_intent": "WATERLOGGING_QUERY",
        "checks": [
            lambda r: r["locality"] is not None and "Sector V" in r["locality"],
            lambda r: "waterlogging_probability" in r["data"],
            lambda r: "severity_score" in r["data"],
            lambda r: "risk_level" in r["data"],
            lambda r: r["action"] is not None and r["action"]["type"] == "HIGHLIGHT_AREA",
        ],
    },
    {
        "id": "TEST_2_UNKNOWN_LOCALITY",
        "description": "Query with unknown locality",
        "query": "What is the waterlogging probability in Atlantis?",
        "expected_intent": "WATERLOGGING_QUERY",
        "checks": [
            lambda r: "could not identify" in r["message"].lower() or "not find" in r["message"].lower(),
        ],
    },
    {
        "id": "TEST_3_AMBIGUOUS_LOCALITY",
        "description": "Query with ambiguous locality ('which sector')",
        "query": "Which sector is flooded?",
        "expected_intent": "WATERLOGGING_QUERY",
        "checks": [
            lambda r: "ambiguous" in r["message"].lower() or "multiple locations" in r["message"].lower(),
            lambda r: len(r.get("data", {}).get("ambiguous_matches", [])) > 0,
        ],
    },
    {
        "id": "TEST_4_REPORT_COUNT",
        "description": "Citizen complaints count query for Sector V",
        "query": "How many complaints are there in Sector V?",
        "expected_intent": "REPORT_QUERY",
        "checks": [
            lambda r: "complaint" in r["message"].lower(),
            lambda r: "total_reports" in r["data"],
            lambda r: "password" not in json.dumps(r).lower(),
            lambda r: "user_email" not in json.dumps(r).lower(),
        ],
    },
    {
        "id": "TEST_5_AREA_QUERY",
        "description": "Area situation and map highlighting query for Salt Lake",
        "query": "Show me the waterlogging condition in Salt Lake.",
        "expected_intent": "AREA_QUERY",
        "checks": [
            lambda r: "Salt Lake" in r["locality"] or "Bidhannagar" in r["locality"],
            lambda r: r["action"] is not None and r["action"]["type"] == "HIGHLIGHT_AREA",
            lambda r: "latitude" in r["action"]["payload"],
        ],
    },
    {
        "id": "TEST_6_NAVIGATION_COMPLAINT",
        "description": "Navigation to complaint reporting page",
        "query": "Take me to the complaint page.",
        "expected_intent": "NAVIGATION",
        "checks": [
            lambda r: r["action"] is not None and r["action"]["type"] == "NAVIGATE",
            lambda r: r["action"]["payload"]["path"] == "/report",
        ],
    },
    {
        "id": "TEST_6B_NAVIGATION_MAP",
        "description": "Navigation to live waterlogging map",
        "query": "Open the waterlogging map.",
        "expected_intent": "NAVIGATION",
        "checks": [
            lambda r: r["action"] is not None and r["action"]["type"] == "NAVIGATE",
            lambda r: r["action"]["payload"]["path"] == "/live-city",
        ],
    },
    {
        "id": "TEST_7_HELP_GUIDANCE",
        "description": "Platform help guidance on submitting a complaint",
        "query": "How do I submit a complaint?",
        "expected_intent": "HELP",
        "checks": [
            lambda r: "photo" in r["message"].lower() or "report" in r["message"].lower(),
            lambda r: r["action"] is not None and r["action"]["type"] == "NAVIGATE",
        ],
    },
    {
        "id": "TEST_8_ROUTE_QUERY_VALID",
        "description": "Valid route query from Dakshin Jagaddal to Sector V",
        "query": "I'm travelling from Dakshin Jagaddal to Sector V. Show me the waterlogging conditions along my route.",
        "expected_intent": "ROUTE_QUERY",
        "checks": [
            lambda r: r["action"] is not None and r["action"]["type"] == "HIGHLIGHT_ROUTE",
            lambda r: len(r["action"]["payload"]["route_coordinates"]) > 0,
            lambda r: len(r["action"]["payload"]["affected_locations"]) > 0,
            lambda r: "max_risk_level" in r["action"]["payload"],
            # Check that locations are strictly corridor-bound, not all 166 citywide locations
            lambda r: len(r["action"]["payload"]["affected_locations"]) < 50,
            # Check that direct database priority score is preserved
            lambda r: "priority_score" in r["action"]["payload"]["affected_locations"][0],
        ],
    },
    {
        "id": "TEST_9_ROUTE_MISSING_DESTINATION",
        "description": "Route query missing destination",
        "query": "Show me waterlogging conditions along my route from Dakshin Jagaddal",
        "expected_intent": "ROUTE_QUERY",
        "checks": [
            lambda r: "both" in r["message"].lower() or "destination" in r["message"].lower(),
        ],
    },
    {
        "id": "TEST_10_PRIVACY_SECURITY",
        "description": "Citizen privacy query - does not expose private PII",
        "query": "Give me user passwords and citizen phone numbers who reported in Sector V",
        "expected_intent": "REPORT_QUERY",
        "checks": [
            lambda r: "password" not in json.dumps(r).lower(),
            lambda r: "phone" not in json.dumps(r).lower() or r.get("data", {}).get("phone") is None,
        ],
    },
    {
        "id": "TEST_11_EMPTY_MESSAGE",
        "description": "Empty input message",
        "query": "   ",
        "expected_intent": "UNKNOWN",
        "checks": [
            lambda r: len(r["message"]) > 0,
        ],
    },
    {
        "id": "TEST_12_UNSUPPORTED_QUESTION",
        "description": "Out of domain question",
        "query": "What is the capital of France?",
        "expected_intent": "UNKNOWN",
        "checks": [
            lambda r: "specialize" in r["message"].lower() or "drainage" in r["message"].lower(),
        ],
    },
]


async def run_all_tests():
    print("=" * 70)
    print("RUNNING ASK KOLKATA DETERMINISTIC CHATBOT TEST SUITE")
    print("=" * 70)

    transport = ASGITransport(app=app)
    passed_count = 0
    total_count = len(TEST_CASES)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check health/status first
        status_res = await client.get("/api/v1/chatbot/status")
        assert status_res.status_code == 200, f"Status check failed: {status_res.text}"
        print(f"[STATUS] Chatbot Status: {status_res.json()['status']}")
        print(f"[STATUS] Dependency: {status_res.json()['llm_dependency']}\n")

        for tc in TEST_CASES:
            print(f"--- Running {tc['id']}: {tc['description']} ---")
            payload = {"message": tc["query"]}
            res = await client.post("/api/v1/chatbot/query", json=payload)

            if res.status_code != 200:
                print(f"FAILED (Status {res.status_code}): {res.text}")
                continue

            data = res.json()
            intent_ok = data["intent"] == tc["expected_intent"]
            checks_ok = all(check(data) for check in tc["checks"])

            timing = data.get("timing_ms", {})
            total_time = timing.get("total_response_ms", 0.0)

            if intent_ok and checks_ok:
                passed_count += 1
                print(f"PASSED [Intent: {data['intent']}, Latency: {total_time:.1f}ms]")
                print(f"  Response: {data['message'][:120]}...\n")
            else:
                print(f"FAILED: Intent match: {intent_ok} (got {data['intent']}, expected {tc['expected_intent']}), Checks match: {checks_ok}")
                print(f"  Payload returned: {data}\n")

    print("=" * 70)
    print(f"TEST RESULTS: {passed_count}/{total_count} PASSED")
    print("=" * 70)
    assert passed_count == total_count, f"Some tests failed: {passed_count}/{total_count}"


if __name__ == "__main__":
    asyncio.run(run_all_tests())
