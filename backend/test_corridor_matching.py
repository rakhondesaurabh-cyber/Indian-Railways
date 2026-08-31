import json
from datetime import datetime, timedelta
from main import get_all_trains, get_network_full

def extract_station_time(train, station_code, default_hour=6):
    halts = train.get('halts', [])
    h = next((x for x in halts if x.get('stationCode') == station_code), None)
    if h:
        dep_str = str(h.get('departureTime') or h.get('arrivalTime') or '').strip('\'" ')
        if dep_str and dep_str != '00:00:00':
            parts = dep_str.split(':')
            if len(parts) >= 2:
                try:
                    hh, mm = int(parts[0]), int(parts[1])
                    ss = int(parts[2]) if len(parts) > 2 else 0
                    return hh, mm, ss
                except Exception:
                    pass
        arr_m = h.get('arr_mins') or h.get('dep_mins')
        if arr_m is not None:
            hh = (arr_m // 60) % 24
            mm = arr_m % 60
            return hh, mm, 0
    route = train.get('route', [])
    if station_code in route:
        idx = route.index(station_code)
        hh = (default_hour + idx) % 24
        return hh, 0, 0
    return default_hour, 0, 0

def test_ak_pune():
    trains = get_all_trains()
    train_map = {t['id']: t for t in trains}
    stn_index = {}
    for t in trains:
        for s in t.get('route', []):
            stn_index.setdefault(s, []).append(t['id'])

    u, v = 'AK', 'PUNE'
    u_ids = set(stn_index.get(u, []))
    v_ids = set(stn_index.get(v, []))
    common_ids = u_ids.intersection(v_ids)
    
    m_start_dt = datetime(2026, 9, 1, 1, 30)
    m_end_dt = datetime(2026, 9, 1, 3, 30)
    base_date = m_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    buffer = timedelta(minutes=20)
    results = []

    for tid in common_ids:
        t = train_map[tid]
        r = t.get('route', [])
        if u not in r or v not in r:
            continue
        u_idx = r.index(u)
        v_idx = r.index(v)
        if u_idx < v_idx:
            first_stn, second_stn = u, v
            direction = 'forward'
        else:
            first_stn, second_stn = v, u
            direction = 'reverse'

        h1, m1, s1 = extract_station_time(t, first_stn, default_hour=6)
        h2, m2, s2 = extract_station_time(t, second_stn, default_hour=12)

        start_cross = base_date.replace(hour=h1, minute=m1, second=s1)
        end_cross = base_date.replace(hour=h2, minute=m2, second=s2)
        if end_cross <= start_cross:
            end_cross += timedelta(days=1)

        delta = (min(m_end_dt + buffer, end_cross) - max(m_start_dt - buffer, start_cross)).total_seconds()
        is_delayed = delta > 0

        p_val = t.get('priority', 'Medium')
        priority_mult = 2.5 if p_val == 'High' else (0.6 if p_val == 'Low' else 1.0)
        
        if is_delayed:
            overlap_mins = max(15, int(delta / 60))
            train_delay = int(overlap_mins * priority_mult + 20)
            status_label = f'Delayed (+{train_delay}m)'
            status_code = 'delayed'
        elif end_cross <= m_start_dt:
            train_delay = 0
            status_label = 'On-Time (Clears Before Block)'
            status_code = 'before_block'
        else:
            train_delay = 0
            status_label = 'On-Time (Passes After Block)'
            status_code = 'after_block'

        train_clean_name = t.get('train_name') or t.get('name', t['id']).split(' #')[0]
        train_num = str(t.get('train_number', t['id'].replace('TRN-', '')))

        results.append({
            'train_id': t['id'],
            'train_number': train_num,
            'train_name': train_clean_name,
            'name': t.get('name', f'{train_clean_name} #{train_num}'),
            'type': t.get('type', 'Express'),
            'priority': p_val,
            'delay_mins': train_delay,
            'asset_id': f'{u}-{v}',
            'start_cross': start_cross.isoformat(),
            'end_cross': end_cross.isoformat(),
            'start_cross_time': start_cross.strftime('%H:%M'),
            'end_cross_time': end_cross.strftime('%H:%M'),
            'direction': direction,
            'is_delayed': is_delayed,
            'status_label': status_label,
            'status_code': status_code,
            'origin': t.get('origin', r[0] if r else ''),
            'destination': t.get('destination', r[-1] if r else ''),
            'route': r,
            'status': 'Delayed' if is_delayed else 'On-Time'
        })
        
    results.sort(key=lambda x: x['start_cross'])
    print(f"Total AK-PUNE trains: {len(results)}")
    for trn in results[:10]:
        print(f"  {trn['train_number']} {trn['train_name']} ({trn['direction']}): {trn['start_cross_time']} - {trn['end_cross_time']} | {trn['status_label']}")

if __name__ == '__main__':
    test_ak_pune()
