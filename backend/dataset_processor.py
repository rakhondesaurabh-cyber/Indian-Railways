import json
import os
import random
import pandas as pd
import numpy as np
import glob
from datetime import datetime, timedelta
from station_coordinates import MAJOR_STATIONS, get_station_coords, interpolate_station_coords

CSV_DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "isl_wise_train_details.csv")
JSON_DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "EXP-TRAINS.json")
ML_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "dataset", "ml_training_data.csv")
NETWORK_FULL_PATH = os.path.join(os.path.dirname(__file__), "railway_network_full.json")
NETWORK_HDN_PATH = os.path.join(os.path.dirname(__file__), "railway_network_hdn.json")
TRAINS_REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "trains_registry_full.json")
STATION_SEARCH_INDEX_PATH = os.path.join(os.path.dirname(__file__), "station_search_index.json")

def parse_time_str(time_str):
    if not time_str or pd.isna(time_str):
        return None
    time_str = str(time_str).strip().strip("'")
    if time_str in ["Source", "Destination", "", "None", "nan"]:
        return None
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return None

def load_json_datasets():
    json_files = glob.glob(os.path.join(os.path.dirname(__file__), "dataset", "Train Schedule", "*.json"))
    if os.path.exists(JSON_DATASET_PATH) and JSON_DATASET_PATH not in json_files:
        json_files.append(JSON_DATASET_PATH)
    rows = []
    for jf in json_files:
        with open(jf, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for train in data:
                t_no = train.get('trainNumber', '')
                t_name = train.get('trainName', '')
                train_route = train.get('trainRoute', [])
                if not train_route:
                    continue
                
                # get source/dest from first/last
                first_stn = train_route[0].get('stationName', ' - ')
                last_stn = train_route[-1].get('stationName', ' - ')
                src_name, src_code = first_stn.rsplit(' - ', 1) if ' - ' in first_stn else (first_stn, first_stn)
                dest_name, dest_code = last_stn.rsplit(' - ', 1) if ' - ' in last_stn else (last_stn, last_stn)
                
                for halt in train_route:
                    sno = halt.get('sno', '1')
                    stn_raw = halt.get('stationName', ' - ')
                    stn_name, stn_code = stn_raw.rsplit(' - ', 1) if ' - ' in stn_raw else (stn_raw, stn_raw)
                    dist_raw = halt.get('distance', '0 kms')
                    dist = ''.join([c for c in str(dist_raw) if c.isdigit()])
                    arr = halt.get('arrives', 'Source')
                    dep = halt.get('departs', 'Destination')
                    
                    rows.append({
                        'Train No.': t_no,
                        'train Name': t_name,
                        'station Code': stn_code.strip(),
                        'Station Name': stn_name.strip(),
                        'Source Station Code': src_code.strip(),
                        'source Station Name': src_name.strip(),
                        'Destination station Code': dest_code.strip(),
                        'Destination Station Name': dest_name.strip(),
                        'islno': sno,
                        'Distance': dist if dist else '0',
                        'Arrival time': arr,
                        'Departure time': dep
                    })
    return pd.DataFrame(rows)

def process_complete_dataset():
    print(f"Loading full CSV dataset from {CSV_DATASET_PATH}...")
    df = pd.read_csv(CSV_DATASET_PATH)
    print(f"Loaded {len(df)} halt records for {df['Train No.'].nunique()} unique trains.")

    # Load JSON and combine
    print("Loading new JSON datasets...")
    try:
        json_df = load_json_datasets()
        if not json_df.empty:
            print(f"Loaded {len(json_df)} halt records from JSON for {json_df['Train No.'].nunique()} unique trains.")
            df = pd.concat([df, json_df], ignore_index=True)
            # drop duplicates just in case
            df = df.drop_duplicates(subset=['Train No.', 'islno'])
            print(f"Combined dataset has {len(df)} halt records for {df['Train No.'].nunique()} unique trains.")
    except Exception as e:
        print(f"Failed to load JSON datasets: {e}")

    # Clean string columns
    df['Train No.'] = df['Train No.'].astype(str).str.strip().str.strip("'")
    df['train Name'] = df['train Name'].astype(str).str.strip()
    df['station Code'] = df['station Code'].astype(str).str.strip().str.upper()
    df['Station Name'] = df['Station Name'].astype(str).str.strip()
    df['Source Station Code'] = df['Source Station Code'].astype(str).str.strip().str.upper()
    df['Destination station Code'] = df['Destination station Code'].astype(str).str.strip().str.upper()

    # Sort halts by train and islno
    df = df.sort_values(by=['Train No.', 'islno'])

    # Build unique stations registry & track connections
    station_meta = {}
    edges_map = {}
    hourly_traffic = {} # edge_id -> [24 hours]

    grouped = df.groupby('Train No.')
    all_train_objects = []

    print("Building full network graph and sequential tracks...")
    for train_no, train_group in grouped:
        halts = []
        route_codes = []
        source_code = train_group.iloc[0]['Source Station Code']
        source_name = train_group.iloc[0]['source Station Name']
        dest_code = train_group.iloc[-1]['Destination station Code']
        dest_name = train_group.iloc[-1]['Destination Station Name']
        train_name = train_group.iloc[0]['train Name']

        # Determine train priority & type
        t_name_upper = train_name.upper()
        if "VANDE BHARAT" in t_name_upper or "RAJDHANI" in t_name_upper or "SHATABDI" in t_name_upper:
            priority = "High"
            t_type = "Premier Express"
            p_weight = 2.5
        elif "DURONTO" in t_name_upper or "GARIB RATH" in t_name_upper or "SF" in t_name_upper or "SUPERFAST" in t_name_upper:
            priority = "High"
            t_type = "Superfast Express"
            p_weight = 1.8
        elif "MAIL" in t_name_upper or "EXP" in t_name_upper or "EXPRESS" in t_name_upper:
            priority = "Medium"
            t_type = "Mail / Express"
            p_weight = 1.0
        elif "PASSENGER" in t_name_upper or "MEMU" in t_name_upper or "DEMU" in t_name_upper:
            priority = "Low"
            t_type = "Passenger"
            p_weight = 0.6
        elif "FREIGHT" in t_name_upper or "SPL" in t_name_upper:
            priority = "Low"
            t_type = "Special / Freight"
            p_weight = 0.5
        else:
            priority = "Medium"
            t_type = "Express"
            p_weight = 1.0

        prev_row = None
        for _, row in train_group.iterrows():
            stn_code = row['station Code']
            stn_name = row['Station Name']
            dist = int(row['Distance']) if pd.notna(row['Distance']) and str(row['Distance']).isdigit() else 0
            arr_mins = parse_time_str(row['Arrival time'])
            dep_mins = parse_time_str(row['Departure time'])

            if stn_code not in station_meta:
                station_meta[stn_code] = {
                    "id": stn_code,
                    "code": stn_code,
                    "name": stn_name,
                    "degree": 0,
                    "train_count": 0
                }
            station_meta[stn_code]["train_count"] += 1
            route_codes.append(stn_code)

            halt_entry = {
                "sequence": int(row['islno']),
                "stationCode": stn_code,
                "stationName": stn_name,
                "arrivalTime": str(row['Arrival time']).strip(),
                "departureTime": str(row['Departure time']).strip(),
                "arr_mins": arr_mins,
                "dep_mins": dep_mins,
                "distance": dist
            }
            halts.append(halt_entry)

            # Build edge with previous station
            if prev_row is not None:
                u = prev_row['station Code']
                v = stn_code
                if u != v:
                    edge_id = f"{u}-{v}"
                    edge_rev = f"{v}-{u}"
                    primary_id = edge_id if u < v else edge_rev

                    station_meta[u]["degree"] += 1
                    station_meta[v]["degree"] += 1

                    u_dist = int(prev_row['Distance']) if str(prev_row['Distance']).isdigit() else 0
                    v_dist = dist
                    seg_dist = max(1, abs(v_dist - u_dist))

                    # Calculate travel time
                    prev_dep = parse_time_str(prev_row['Departure time'])
                    curr_arr = arr_mins
                    if prev_dep is not None and curr_arr is not None:
                        t_time = curr_arr - prev_dep
                        if t_time <= 0:
                            t_time += 1440 # cross midnight
                    else:
                        t_time = max(5, int(seg_dist * 1.2)) # ~50 km/h baseline

                    if primary_id not in edges_map:
                        edges_map[primary_id] = {
                            "id": primary_id,
                            "source": u if u < v else v,
                            "target": v if u < v else u,
                            "distance_km": seg_dist,
                            "travel_time_mins": t_time,
                            "daily_trains": 0
                        }
                    edges_map[primary_id]["daily_trains"] += 1

                    # Hourly traffic density
                    if primary_id not in hourly_traffic:
                        hourly_traffic[primary_id] = [0] * 24
                    hour_slot = (prev_dep // 60) % 24 if prev_dep is not None else 12
                    hourly_traffic[primary_id][hour_slot] += 1

            prev_row = row

        first_dep = halts[0]["dep_mins"] if halts and halts[0]["dep_mins"] is not None else 360 # 6:00 AM default
        start_time_iso = (datetime(2026, 9, 1, 0, 0, 0) + timedelta(minutes=first_dep)).isoformat()

        all_train_objects.append({
            "id": f"TRN-{train_no}",
            "train_number": train_no,
            "train_name": train_name,
            "name": f"{train_name} #{train_no}",
            "type": t_type,
            "priority": priority,
            "priority_weight": p_weight,
            "origin": source_code,
            "origin_name": source_name,
            "destination": dest_code,
            "destination_name": dest_name,
            "start_time": start_time_iso,
            "route": route_codes,
            "halts": halts,
            "total_distance": halts[-1]["distance"] if halts else 0,
            "halts_count": len(halts),
            "status": "On-Time"
        })

    print(f"Computed {len(station_meta)} stations and {len(edges_map)} track corridors.")

    # Assign Coordinates: Known Major Stations + Interpolation for intermediate stations
    print("Assigning GPS coordinates & identifying key junctions...")
    resolved_stations = {}
    
    # Pass 1: Major Stations
    for code, meta in station_meta.items():
        known = get_station_coords(code)
        if known:
            resolved_stations[code] = {
                "id": code,
                "code": code,
                "name": known.get("name", meta["name"]),
                "lat": known["lat"],
                "lng": known["lng"],
                "zone": known.get("zone", "IR"),
                "degree": meta["degree"],
                "is_junction": True if meta["degree"] >= 4 or known.get("is_junction") else False,
                "train_count": meta["train_count"]
            }

    # Pass 2: Interpolate intermediate stations along train routes between known anchors
    for train in all_train_objects:
        route = train["route"]
        anchors = [(i, code) for i, code in enumerate(route) if code in resolved_stations]
        
        for k in range(len(anchors) - 1):
            idx1, code1 = anchors[k]
            idx2, code2 = anchors[k+1]
            if idx2 - idx1 > 1:
                coords1 = resolved_stations[code1]
                coords2 = resolved_stations[code2]
                total_steps = idx2 - idx1
                for step in range(1, total_steps):
                    mid_idx = idx1 + step
                    mid_code = route[mid_idx]
                    if mid_code not in resolved_stations:
                        frac = step / total_steps
                        interp = interpolate_station_coords(mid_code, coords1, coords2, frac)
                        resolved_stations[mid_code] = {
                            "id": mid_code,
                            "code": mid_code,
                            "name": station_meta[mid_code]["name"],
                            "lat": interp["lat"],
                            "lng": interp["lng"],
                            "zone": coords1.get("zone", "IR"),
                            "degree": station_meta[mid_code]["degree"],
                            "is_junction": True if station_meta[mid_code]["degree"] >= 4 else False,
                            "train_count": station_meta[mid_code]["train_count"]
                        }

    # Fallback for remaining unanchored stations: deterministic pseudo-location
    for code, meta in station_meta.items():
        if code not in resolved_stations:
            h = abs(hash(code))
            lat = 18.0 + (h % 1200) / 100.0
            lng = 73.0 + ((h // 1200) % 1400) / 100.0
            resolved_stations[code] = {
                "id": code,
                "code": code,
                "name": meta["name"],
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "zone": "IR",
                "degree": meta["degree"],
                "is_junction": True if meta["degree"] >= 4 else False,
                "train_count": meta["train_count"]
            }

    # Filter valid edges that connect resolved stations
    valid_nodes = list(resolved_stations.values())
    valid_edges = []
    for edge_id, edge in edges_map.items():
        if edge["source"] in resolved_stations and edge["target"] in resolved_stations:
            valid_edges.append(edge)

    # Build Curated Major Hubs Network (Ultra-lightweight ~50 premier junctions for ultra-fast overview)
    PRIMARY_HUB_CODES = [
        "NDLS", "DLI", "NZM", "CNB", "LKO", "BSB", "DDU", "GKP", "MB", "ASR", "LDH", "UMB", "JAT",
        "PNBE", "GAYA", "DHN", "ASN", "HWH", "SDAH", "KGP", "TATA", "RNC", "BBS", "PURI", "VSKP", "R", "BSP", "GHY", "NJP",
        "MMCT", "CSMT", "KYN", "BSL", "NGP", "PUNE", "DD", "SUR", "ST", "BRC", "ADI", "RTM", "KOTA", "JP", "BPL", "ET", "JBP",
        "MAS", "TPJ", "MDU", "CBE", "ED", "TVC", "ERS", "SC", "BZA", "GTL", "SBC", "UBL", "MAO"
    ]
    major_hub_set = set(c for c in PRIMARY_HUB_CODES if c in resolved_stations)
    major_nodes = [resolved_stations[c] for c in major_hub_set]
    major_edges = [e for e in valid_edges if e["source"] in major_hub_set and e["target"] in major_hub_set]

    NETWORK_MAJOR_PATH = os.path.join(os.path.dirname(__file__), "railway_network_major.json")
    network_major_data = {
        "nodes": major_nodes,
        "edges": major_edges,
        "total_stations": len(major_nodes),
        "total_edges": len(major_edges),
        "total_trains": len(all_train_objects),
        "mode": "major"
    }

    with open(NETWORK_MAJOR_PATH, 'w', encoding='utf-8') as f:
        json.dump(network_major_data, f)
    print(f"Saved Major Hubs topology ({len(major_nodes)} nodes, {len(major_edges)} edges) to {NETWORK_MAJOR_PATH}")

    # Build High-Density Network (HDN / Major Trunk Corridors)
    hdn_node_codes = set(MAJOR_STATIONS.keys())
    for n in valid_nodes:
        if n.get("train_count", 0) >= 90:
            hdn_node_codes.add(n["code"])
            
    hdn_nodes = [resolved_stations[c] for c in hdn_node_codes if c in resolved_stations]
    hdn_edges = [e for e in valid_edges if e["source"] in hdn_node_codes and e["target"] in hdn_node_codes]

    # Save full network and HDN network
    network_full_data = {
        "nodes": valid_nodes,
        "edges": valid_edges,
        "total_stations": len(valid_nodes),
        "total_edges": len(valid_edges),
        "total_trains": len(all_train_objects),
        "mode": "full"
    }

    network_hdn_data = {
        "nodes": hdn_nodes,
        "edges": hdn_edges,
        "total_stations": len(hdn_nodes),
        "total_edges": len(hdn_edges),
        "total_trains": len(all_train_objects),
        "mode": "hdn"
    }

    with open(NETWORK_FULL_PATH, 'w', encoding='utf-8') as f:
        json.dump(network_full_data, f)
    print(f"Saved full network topology ({len(valid_nodes)} nodes, {len(valid_edges)} edges) to {NETWORK_FULL_PATH}")

    with open(NETWORK_HDN_PATH, 'w', encoding='utf-8') as f:
        json.dump(network_hdn_data, f)
    print(f"Saved HDN trunk topology ({len(hdn_nodes)} nodes, {len(hdn_edges)} edges) to {NETWORK_HDN_PATH}")

    with open(TRAINS_REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_train_objects, f)
    print(f"Saved {len(all_train_objects)} train schedules to {TRAINS_REGISTRY_PATH}")

    # Build searchable station index for fast frontend autocomplete
    search_index = []
    for n in valid_nodes:
        search_index.append({
            "code": n["code"],
            "name": n["name"],
            "lat": n["lat"],
            "lng": n["lng"],
            "zone": n.get("zone", "IR"),
            "is_junction": n.get("is_junction", False),
            "train_count": n.get("train_count", 0)
        })
    with open(STATION_SEARCH_INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(search_index, f)
    print(f"Saved searchable station index ({len(search_index)} entries) to {STATION_SEARCH_INDEX_PATH}")

    # Build genuine ML training dataset
    print("Generating comprehensive ML training dataset from real traffic patterns...")
    samples = []
    for edge in valid_edges:
        eid = edge["id"]
        traffic_24h = hourly_traffic.get(eid, [0] * 24)
        daily_vol = edge["daily_trains"]

        for _ in range(15):
            hour = random.randint(0, 23)
            duration_mins = random.choice([60, 120, 180, 240, 300, 360, 480])
            is_weekend = random.choice([0, 1])

            hrs_spanned = max(1, duration_mins // 60)
            traffic_density = sum(traffic_24h[(hour + h) % 24] for h in range(hrs_spanned))
            effective_traffic = traffic_density * (1.15 if is_weekend else 1.0)
            congestion_factor = min(3.0, 1.0 + (effective_traffic / 4.0))
            trains_affected = int(effective_traffic)
            
            if trains_affected == 0:
                delay_mins = 0
            else:
                base_delay_per_train = 35.0
                delay_mins = int(trains_affected * base_delay_per_train * congestion_factor * random.uniform(0.9, 1.1))
                if duration_mins >= 240:
                    delay_mins += int((duration_mins - 180) * 0.4)

            samples.append({
                "edge_id": eid,
                "hour": hour,
                "duration_mins": duration_mins,
                "traffic_density": traffic_density,
                "is_weekend": is_weekend,
                "daily_train_volume": daily_vol,
                "track_distance_km": edge["distance_km"],
                "trains_affected": trains_affected,
                "delay_mins": delay_mins
            })

    ml_df = pd.DataFrame(samples)
    ml_df.to_csv(ML_OUTPUT_PATH, index=False)
    print(f"Successfully generated {len(ml_df)} ML training samples saved to {ML_OUTPUT_PATH}")

if __name__ == '__main__':
    process_complete_dataset()
