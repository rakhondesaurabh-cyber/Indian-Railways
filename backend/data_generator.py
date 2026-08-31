import json
import random
from datetime import datetime, timedelta

def generate_network():
    nodes = [
        {"id": "NDLS", "name": "New Delhi", "code": "NDLS", "zone": "NR", "lat": 28.6139, "lng": 77.2090},
        {"id": "CNB", "name": "Kanpur Central", "code": "CNB", "zone": "NCR", "lat": 26.4537, "lng": 80.3507},
        {"id": "PNBE", "name": "Patna Junction", "code": "PNBE", "zone": "ECR", "lat": 25.6022, "lng": 85.1376},
        {"id": "HWH", "name": "Howrah (Kolkata)", "code": "HWH", "zone": "ER", "lat": 22.5839, "lng": 88.3433},
        {"id": "ADI", "name": "Ahmedabad Junction", "code": "ADI", "zone": "WR", "lat": 23.0225, "lng": 72.5714},
        {"id": "MMCT", "name": "Mumbai Central", "code": "MMCT", "zone": "WR", "lat": 18.9690, "lng": 72.8205},
        {"id": "BPL", "name": "Bhopal Junction", "code": "BPL", "zone": "WCR", "lat": 23.2599, "lng": 77.4126},
        {"id": "NGP", "name": "Nagpur Junction", "code": "NGP", "zone": "CR", "lat": 21.1458, "lng": 79.0882},
        {"id": "SC", "name": "Secunderabad", "code": "SC", "zone": "SCR", "lat": 17.4330, "lng": 78.5046},
        {"id": "SBC", "name": "KSR Bengaluru", "code": "SBC", "zone": "SWR", "lat": 12.9779, "lng": 77.5671},
        {"id": "MAS", "name": "Chennai Central", "code": "MAS", "zone": "SR", "lat": 13.0827, "lng": 80.2707},
        {"id": "AK", "name": "Akola Junction", "code": "AK", "zone": "CR", "lat": 20.7059, "lng": 77.0172},
    ]

    edges = [
        {"id": "NDLS-CNB", "source": "NDLS", "target": "CNB", "travel_time_mins": 300, "distance_km": 440},
        {"id": "CNB-PNBE", "source": "CNB", "target": "PNBE", "travel_time_mins": 360, "distance_km": 550},
        {"id": "PNBE-HWH", "source": "PNBE", "target": "HWH", "travel_time_mins": 420, "distance_km": 530},
        {"id": "NDLS-ADI", "source": "NDLS", "target": "ADI", "travel_time_mins": 650, "distance_km": 930},
        {"id": "ADI-MMCT", "source": "ADI", "target": "MMCT", "travel_time_mins": 350, "distance_km": 490},
        {"id": "NDLS-BPL", "source": "NDLS", "target": "BPL", "travel_time_mins": 480, "distance_km": 700},
        {"id": "BPL-NGP", "source": "BPL", "target": "NGP", "travel_time_mins": 300, "distance_km": 390},
        {"id": "NGP-SC", "source": "NGP", "target": "SC", "travel_time_mins": 380, "distance_km": 500},
        {"id": "SC-SBC", "source": "SC", "target": "SBC", "travel_time_mins": 450, "distance_km": 570},
        {"id": "SBC-MAS", "source": "SBC", "target": "MAS", "travel_time_mins": 280, "distance_km": 360},
        {"id": "MMCT-BPL", "source": "MMCT", "target": "BPL", "travel_time_mins": 600, "distance_km": 830},
        {"id": "MMCT-SC", "source": "MMCT", "target": "SC", "travel_time_mins": 540, "distance_km": 710},
        {"id": "NGP-HWH", "source": "NGP", "target": "HWH", "travel_time_mins": 780, "distance_km": 1100},
        {"id": "MAS-HWH", "source": "MAS", "target": "HWH", "travel_time_mins": 1200, "distance_km": 1660},
        {"id": "MAS-SC", "source": "MAS", "target": "SC", "travel_time_mins": 500, "distance_km": 700},
        {"id": "NGP-AK", "source": "NGP", "target": "AK", "travel_time_mins": 210, "distance_km": 253},
        {"id": "AK-MMCT", "source": "AK", "target": "MMCT", "travel_time_mins": 450, "distance_km": 580},
    ]
    return {"nodes": nodes, "edges": edges}

def generate_trains():
    authentic_train_catalog = [
        {"number": "22436", "name": "Vande Bharat Express", "type": "Vande Bharat", "priority": "High", "route": ["NDLS", "CNB", "PNBE", "HWH"], "start_offset_hrs": 6.0},
        {"number": "22416", "name": "Vande Bharat Express", "type": "Vande Bharat", "priority": "High", "route": ["HWH", "PNBE", "CNB", "NDLS"], "start_offset_hrs": 15.0},
        {"number": "20608", "name": "Mysuru - Chennai Vande Bharat", "type": "Vande Bharat", "priority": "High", "route": ["SBC", "MAS"], "start_offset_hrs": 5.75},
        {"number": "20607", "name": "Chennai - Mysuru Vande Bharat", "type": "Vande Bharat", "priority": "High", "route": ["MAS", "SBC"], "start_offset_hrs": 13.5},
        {"number": "12951", "name": "Mumbai Tejas Rajdhani Express", "type": "Rajdhani", "priority": "High", "route": ["MMCT", "ADI", "NDLS"], "start_offset_hrs": 17.0},
        {"number": "12952", "name": "New Delhi - Mumbai Rajdhani", "type": "Rajdhani", "priority": "High", "route": ["NDLS", "ADI", "MMCT"], "start_offset_hrs": 16.5},
        {"number": "12301", "name": "Howrah Rajdhani Express", "type": "Rajdhani", "priority": "High", "route": ["HWH", "PNBE", "CNB", "NDLS"], "start_offset_hrs": 16.8},
        {"number": "12302", "name": "New Delhi - Howrah Rajdhani", "type": "Rajdhani", "priority": "High", "route": ["NDLS", "CNB", "PNBE", "HWH"], "start_offset_hrs": 16.9},
        {"number": "22691", "name": "Bengaluru Rajdhani Express", "type": "Rajdhani", "priority": "High", "route": ["SBC", "SC", "NGP", "BPL", "NDLS"], "start_offset_hrs": 20.0},
        {"number": "22692", "name": "Hazrat Nizamuddin - SBC Rajdhani", "type": "Rajdhani", "priority": "High", "route": ["NDLS", "BPL", "NGP", "SC", "SBC"], "start_offset_hrs": 20.5},
        {"number": "12002", "name": "Bhopal Shatabdi Express", "type": "Shatabdi", "priority": "High", "route": ["NDLS", "BPL"], "start_offset_hrs": 6.0},
        {"number": "12004", "name": "Lucknow Swarna Shatabdi", "type": "Shatabdi", "priority": "High", "route": ["NDLS", "CNB"], "start_offset_hrs": 6.2},
        {"number": "12245", "name": "Howrah - SMVT Duronto Express", "type": "Duronto", "priority": "High", "route": ["HWH", "MAS", "SBC"], "start_offset_hrs": 10.8},
        {"number": "12213", "name": "Yesvantpur - Delhi AC Duronto", "type": "Duronto", "priority": "High", "route": ["SBC", "SC", "NGP", "BPL", "NDLS"], "start_offset_hrs": 23.6},
        {"number": "12626", "name": "Kerala Superfast Express", "type": "Superfast", "priority": "Medium", "route": ["NDLS", "BPL", "NGP", "SC", "SBC"], "start_offset_hrs": 11.2},
        {"number": "12137", "name": "Punjab Mail", "type": "Mail/Express", "priority": "Medium", "route": ["MMCT", "BPL", "NDLS"], "start_offset_hrs": 19.5},
        {"number": "12839", "name": "Howrah - Chennai Central Mail", "type": "Mail/Express", "priority": "Medium", "route": ["HWH", "MAS"], "start_offset_hrs": 23.9},
        {"number": "12723", "name": "Telangana Express", "type": "Superfast", "priority": "Medium", "route": ["SC", "NGP", "BPL", "NDLS"], "start_offset_hrs": 6.5},
        {"number": "12801", "name": "Purushottam Express", "type": "Superfast", "priority": "Medium", "route": ["PNBE", "CNB", "NDLS"], "start_offset_hrs": 13.8},
        {"number": "12779", "name": "Goa Express", "type": "Superfast", "priority": "Medium", "route": ["MMCT", "SC", "MAS"], "start_offset_hrs": 15.2},
        {"number": "70041", "name": "Coal Freight Express #70041", "type": "Freight", "priority": "Low", "route": ["HWH", "NGP", "BPL", "MMCT"], "start_offset_hrs": 2.0},
        {"number": "81092", "name": "Container Rake Freight #81092", "type": "Freight", "priority": "Low", "route": ["NDLS", "ADI", "MMCT"], "start_offset_hrs": 3.5},
        {"number": "90031", "name": "Automobile Special Freight #90031", "type": "Freight", "priority": "Low", "route": ["MAS", "SC", "MMCT"], "start_offset_hrs": 4.2},
        {"number": "62004", "name": "Petroleum Tanker Freight #62004", "type": "Freight", "priority": "Low", "route": ["ADI", "NDLS"], "start_offset_hrs": 1.0},
        {"number": "41080", "name": "Cement Cargo Freight #41080", "type": "Freight", "priority": "Low", "route": ["CNB", "PNBE", "HWH"], "start_offset_hrs": 8.5},
    ]

    base_time = datetime.strptime("2026-09-01 00:00:00", "%Y-%m-%d %H:%M:%S")
    trains = []

    for item in authentic_train_catalog:
        start_time = base_time + timedelta(hours=item["start_offset_hrs"])
        clean_name = item["name"].replace(f" #{item['number']}", "")
        trains.append({
            "id": f"TRN-{item['number']}",
            "train_number": item["number"],
            "train_name": clean_name,
            "name": f"{clean_name} #{item['number']}",
            "type": item["type"],
            "priority": item["priority"],
            "route": item["route"],
            "origin": item["route"][0],
            "destination": item["route"][-1],
            "start_time": start_time.isoformat(),
            "status": "On-Time"
        })
    return trains

def generate_maintenance_requests(edges, num_requests=0):
    requests = []
    maintenance_types = [
        "Track Renewal",
        "Signal & Interlocking",
        "OHE Line Maintenance",
        "Bridge Inspection",
        "Point Machine Overhaul",
        "Ballast Cleaning"
    ]
    priorities = ["Critical", "High", "Medium", "Low"]
    base_deadline = datetime.strptime("2026-09-02 18:00:00", "%Y-%m-%d %H:%M:%S")

    for i in range(num_requests):
        edge = random.choice(edges)
        duration_hrs = random.choice([2, 3, 4, 6])
        requests.append({
            "id": f"MNT-{4000 + i}",
            "asset_id": edge["id"],
            "type": random.choice(maintenance_types),
            "duration_mins": duration_hrs * 60,
            "priority": random.choice(priorities),
            "deadline": base_deadline.isoformat(),
            "status": "Pending"
        })
    return requests

import os

DB_PATH = os.path.join(os.path.dirname(__file__), "mock_db.json")

def main():
    network = generate_network()
    trains = generate_trains()
    maintenance_requests = []

    data = {
        "network": network,
        "trains": trains,
        "maintenance_requests": maintenance_requests
    }

    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Mock data generated: {len(network['nodes'])} stations, {len(network['edges'])} tracks, {len(trains)} trains, {len(maintenance_requests)} maintenance requests.")

if __name__ == "__main__":
    main()
