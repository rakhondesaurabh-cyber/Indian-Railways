import json
import time
from datetime import datetime, timedelta
from optimizer import run_optimization

print("Loading network full and trains registry...")
t0 = time.time()
with open("railway_network_full.json", "r", encoding="utf-8") as f:
    net = json.load(f)
with open("trains_registry_full.json", "r", encoding="utf-8") as f:
    trains = json.load(f)
print(f"Loaded {len(net['edges'])} edges and {len(trains)} trains in {time.time() - t0:.2f}s")

maintenance_requests = [
    {
        "id": "MNT-4001",
        "asset_id": "NDLS-CNB",
        "type": "Track Renewal",
        "duration_mins": 240,
        "priority": "Critical"
    },
    {
        "id": "MNT-4002",
        "asset_id": "MMCT-ADI",
        "type": "Signal & Interlocking",
        "duration_mins": 180,
        "priority": "High"
    }
]

t1 = time.time()
res = run_optimization(net, trains, maintenance_requests)
t2 = time.time()
print(f"Optimization completed in {(t2 - t1)*1000:.1f}ms!")
print(f"Recommended Plan: {res['recommended_plan_id']}")
for plan in res["candidate_plans"]:
    print(f" - {plan['name']}: {plan['metrics']['trains_affected']} trains affected, {plan['metrics']['delay_mins']} delay mins, ML: {plan['metrics'].get('ml_risk_score')}")
