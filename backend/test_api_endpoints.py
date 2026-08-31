import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all():
    print("Testing / ...")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    print("Root response:", r.json()["dataset"])

    print("\nTesting /api/network?mode=major ...")
    r = client.get("/api/network?mode=major")
    assert r.status_code == 200
    net_major = r.json()
    print(f"Major network: {len(net_major['nodes'])} nodes, {len(net_major['edges'])} edges")
    assert len(net_major['nodes']) > 0, "Major network nodes should not be empty"

    print("\nTesting /api/network?mode=hdn ...")
    r = client.get("/api/network?mode=hdn")
    assert r.status_code == 200
    net_hdn = r.json()
    print(f"HDN network: {len(net_hdn['nodes'])} nodes, {len(net_hdn['edges'])} edges")

    print("\nTesting /api/network?mode=full ...")
    r = client.get("/api/network?mode=full")
    assert r.status_code == 200
    net_full = r.json()
    print(f"Full network: {len(net_full['nodes'])} nodes, {len(net_full['edges'])} edges")

    print("\nTesting /api/network/stations/search?q=NDLS ...")
    r = client.get("/api/network/stations/search?q=NDLS")
    assert r.status_code == 200
    search_res = r.json()
    print(f"Search results for NDLS: {search_res}")

    print("\nTesting /api/trains?limit=5 ...")
    r = client.get("/api/trains?limit=5")
    assert r.status_code == 200
    trains = r.json()
    print(f"Loaded {len(trains)} sample trains: {[t['name'] for t in trains]}")

    print("\nTesting /api/predict_ml ...")
    r = client.post("/api/predict_ml", json={
        "edge_id": "NDLS-CNB",
        "hour": 14,
        "duration_mins": 240,
        "traffic_density": 6,
        "is_weekend": 0
    })
    assert r.status_code == 200
    ml_res = r.json()
    print(f"ML Delay Prediction: {ml_res['predicted_delay_mins']} mins ({ml_res['risk_level']}, Confidence: {ml_res['confidence_pct']}%)")

    print("\nTesting /api/optimize ...")
    r = client.post("/api/optimize", json={"weight_delay": 0.35, "weight_affected_trains": 0.25})
    assert r.status_code == 200
    opt_res = r.json()
    print(f"AI Optimization: Recommended Plan = {opt_res['recommended_plan_id']}")
    print(f"Plans returned: {[p['name'] for p in opt_res['candidate_plans']]}")
    print(f"Metrics: Before={opt_res['metrics']['before']}, After={opt_res['metrics']['after']}")

    print("\nTesting /api/emergency ...")
    r = client.post("/api/emergency", json={
        "asset_id": "NDLS-CNB",
        "duration_mins": 180,
        "type": "Track Failure",
        "priority": "Critical"
    })
    assert r.status_code == 200
    emg_res = r.json()
    print(f"Emergency injection success: {emg_res['message']}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! [SUCCESS]")

if __name__ == "__main__":
    test_all()
