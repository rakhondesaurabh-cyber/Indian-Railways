import urllib.request
import json
import os
import math

BASE_DIR = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
GEO_FILE = os.path.join(DATASET_DIR, "all_station_coordinates.json")
SEARCH_INDEX_PATH = os.path.join(BASE_DIR, "station_search_index.json")
NETWORK_FULL_PATH = os.path.join(BASE_DIR, "railway_network_full.json")
NETWORK_HDN_PATH = os.path.join(BASE_DIR, "railway_network_hdn.json")
NETWORK_MAJOR_PATH = os.path.join(BASE_DIR, "railway_network_major.json")

def download_and_build_geo_db():
    print("Downloading authentic Indian Railway station coordinates from DataMeet GeoJSON...")
    url = "https://raw.githubusercontent.com/datameet/railways/master/stations.json"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    geo_data = {}
    if os.path.exists(GEO_FILE):
        print(f"Loading existing {GEO_FILE}...")
        try:
            with open(GEO_FILE, "r", encoding="utf-8") as f:
                geo_data = json.load(f)
        except Exception:
            geo_data = {}
    
    if len(geo_data) < 5000:
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                content = json.loads(response.read().decode("utf-8"))
                features = content.get("features", [])
                print(f"Processing {len(features)} station features from DataMeet GeoJSON...")
                for f in features:
                    if not f or not isinstance(f, dict):
                        continue
                    props = f.get("properties") or {}
                    geom = f.get("geometry") or {}
                    coords = geom.get("coordinates") if isinstance(geom, dict) else []
                    code = str(props.get("code") or "").strip().upper()
                    if code and coords and len(coords) >= 2:
                        try:
                            lng, lat = float(coords[0]), float(coords[1])
                            # Valid Indian bounds: lat ~6.5 to ~37.5, lng ~68.0 to ~97.5
                            if 6.0 <= lat <= 38.0 and 67.0 <= lng <= 98.0:
                                geo_data[code] = {
                                    "code": code,
                                    "name": str(props.get("name") or code).strip(),
                                    "lat": round(lat, 5),
                                    "lng": round(lng, 5),
                                    "zone": str(props.get("zone") or "IR"),
                                    "state": str(props.get("state") or "")
                                }
                        except (ValueError, TypeError):
                            continue
                with open(GEO_FILE, "w", encoding="utf-8") as out_f:
                    json.dump(geo_data, out_f, indent=2)
                print(f"Successfully saved {len(geo_data)} verified station coordinates to {GEO_FILE}.")
        except Exception as e:
            print(f"Error downloading DataMeet stations: {e}")

    # Additional high-precision overrides for critical junctions & suburban nodes
    CURATED_CRITICAL_FIXES = {
        "NED": {"code": "NED", "name": "Hazur Sahib Nanded", "lat": 19.1528, "lng": 77.3189, "zone": "SCR"},
        "PAU": {"code": "PAU", "name": "Purna Jn", "lat": 19.1837, "lng": 77.0505, "zone": "SCR"},
        "BMF": {"code": "BMF", "name": "Basmat", "lat": 19.3175, "lng": 77.1583, "zone": "SCR"},
        "HNL": {"code": "HNL", "name": "Hingoli Deccan", "lat": 19.7214, "lng": 77.1466, "zone": "SCR"},
        "WHM": {"code": "WHM", "name": "Washim", "lat": 20.1085, "lng": 77.1352, "zone": "SCR"},
        "AK": {"code": "AK", "name": "Akola Jn", "lat": 20.7059, "lng": 77.0172, "zone": "CR"},
        "MZR": {"code": "MZR", "name": "Murtizapur Jn", "lat": 20.7317, "lng": 77.3688, "zone": "CR"},
        "BD": {"code": "BD", "name": "Badnera Jn", "lat": 20.8660, "lng": 77.7288, "zone": "CR"},
        "PBN": {"code": "PBN", "name": "Parbhani Jn", "lat": 19.2608, "lng": 76.7797, "zone": "SCR"},
        "J": {"code": "J", "name": "Jalna", "lat": 19.8347, "lng": 75.8816, "zone": "SCR"},
        "AWB": {"code": "AWB", "name": "Chhatrapati Sambhajinagar (Aurangabad)", "lat": 19.8656, "lng": 75.3347, "zone": "SCR"},
        "MMR": {"code": "MMR", "name": "Manmad Jn", "lat": 20.2520, "lng": 74.4368, "zone": "CR"},
        "NK": {"code": "NK", "name": "Nashik Road", "lat": 19.9575, "lng": 73.8375, "zone": "CR"},
        "IGP": {"code": "IGP", "name": "Igatpuri", "lat": 19.6975, "lng": 73.5636, "zone": "CR"},
        "KYN": {"code": "KYN", "name": "Kalyan Jn", "lat": 19.2364, "lng": 73.1306, "zone": "CR"},
        "CSMT": {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "lat": 18.9401, "lng": 72.8353, "zone": "CR"},
        "CSTM": {"code": "CSTM", "name": "Chhatrapati Shivaji Maharaj Terminus", "lat": 18.9401, "lng": 72.8353, "zone": "CR"},
        "MMCT": {"code": "MMCT", "name": "Mumbai Central", "lat": 18.9690, "lng": 72.8205, "zone": "WR"},
        "BCT": {"code": "BCT", "name": "Mumbai Central", "lat": 18.9690, "lng": 72.8205, "zone": "WR"},
        "LTT": {"code": "LTT", "name": "Lokmanya Tilak Terminus", "lat": 19.0697, "lng": 72.8913, "zone": "CR"},
        "BDTS": {"code": "BDTS", "name": "Bandra Terminus", "lat": 19.0620, "lng": 72.8404, "zone": "WR"},
        "PUNE": {"code": "PUNE", "name": "Pune Jn", "lat": 18.5284, "lng": 73.8744, "zone": "CR"},
        "ANG": {"code": "ANG", "name": "Ahilyanagar (Ahmednagar)", "lat": 19.0948, "lng": 74.7480, "zone": "CR"},
        "DD": {"code": "DD", "name": "Daund Jn", "lat": 18.4655, "lng": 74.5802, "zone": "CR"},
        "SUR": {"code": "SUR", "name": "Solapur", "lat": 17.6599, "lng": 75.9064, "zone": "CR"},
        "KWV": {"code": "KWV", "name": "Kurduvadi Jn", "lat": 18.0877, "lng": 75.4312, "zone": "CR"},
        "MRJ": {"code": "MRJ", "name": "Miraj Jn", "lat": 16.8285, "lng": 74.6465, "zone": "CR"},
        "KOP": {"code": "KOP", "name": "Kolhapur SCSMT", "lat": 16.6985, "lng": 74.2405, "zone": "CR"},
        "SNSI": {"code": "SNSI", "name": "Sainagar Shirdi", "lat": 19.7719, "lng": 74.4839, "zone": "CR"},
        "BAP": {"code": "BAP", "name": "Belapur", "lat": 19.5714, "lng": 74.6542, "zone": "CR"},
        "PB": {"code": "PB", "name": "Puntamba Jn", "lat": 19.6800, "lng": 74.6100, "zone": "CR"},
        "PTU": {"code": "PTU", "name": "Partur", "lat": 19.5960, "lng": 76.2160, "zone": "SCR"},
        "SELU": {"code": "SELU", "name": "Selu", "lat": 19.4580, "lng": 76.4470, "zone": "SCR"},
        "MUE": {"code": "MUE", "name": "Mudkhed Jn", "lat": 19.1670, "lng": 77.5170, "zone": "SCR"},
        "DAB": {"code": "DAB", "name": "Dharmabad", "lat": 18.8950, "lng": 77.8500, "zone": "SCR"},
        "BSX": {"code": "BSX", "name": "Basar", "lat": 18.8780, "lng": 77.9540, "zone": "SCR"},
        "NZB": {"code": "NZB", "name": "Nizamabad Jn", "lat": 18.6725, "lng": 78.0988, "zone": "SCR"},
        "ARMU": {"code": "ARMU", "name": "Armoor", "lat": 18.7900, "lng": 78.2900, "zone": "SCR"},
        "KMC": {"code": "KMC", "name": "Kamareddi", "lat": 18.3200, "lng": 78.3400, "zone": "SCR"},
        "SC": {"code": "SC", "name": "Secunderabad Jn", "lat": 17.4330, "lng": 78.5046, "zone": "SCR"},
        "HYB": {"code": "HYB", "name": "Hyderabad Deccan", "lat": 17.3924, "lng": 78.4682, "zone": "SCR"},
        "KZJ": {"code": "KZJ", "name": "Kazipet Jn", "lat": 17.9780, "lng": 79.5222, "zone": "SCR"},
        "WL": {"code": "WL", "name": "Warangal", "lat": 17.9689, "lng": 79.5941, "zone": "SCR"},
        "BPQ": {"code": "BPQ", "name": "Balharshah Jn", "lat": 19.8510, "lng": 79.3510, "zone": "CR"},
        "CD": {"code": "CD", "name": "Chandrapur", "lat": 19.9547, "lng": 79.2961, "zone": "CR"},
        "WR": {"code": "WR", "name": "Wardha Jn", "lat": 20.7453, "lng": 78.5975, "zone": "CR"},
        "SEGM": {"code": "SEGM", "name": "Sevagram Jn", "lat": 20.7300, "lng": 78.6100, "zone": "CR"},
        "PLO": {"code": "PLO", "name": "Pulgaon Jn", "lat": 20.7258, "lng": 78.3244, "zone": "CR"},
        "DMN": {"code": "DMN", "name": "Dhamangaon", "lat": 20.7833, "lng": 78.1333, "zone": "CR"},
        "CND": {"code": "CND", "name": "Chandur", "lat": 20.8175, "lng": 77.9808, "zone": "CR"},
        "SNI": {"code": "SNI", "name": "Sindi", "lat": 20.8117, "lng": 78.8950, "zone": "CR"},
        "AJNI": {"code": "AJNI", "name": "Ajni", "lat": 21.1214, "lng": 79.0717, "zone": "CR"},
        "NGP": {"code": "NGP", "name": "Nagpur Jn", "lat": 21.1458, "lng": 79.0882, "zone": "CR"},
        "G": {"code": "G", "name": "Gondia Jn", "lat": 21.4587, "lng": 80.1961, "zone": "SECR"},
        "DURG": {"code": "DURG", "name": "Durg Jn", "lat": 21.1904, "lng": 81.2849, "zone": "SECR"},
        "R": {"code": "R", "name": "Raipur Jn", "lat": 21.2514, "lng": 81.6296, "zone": "SECR"},
        "BSP": {"code": "BSP", "name": "Bilaspur Jn", "lat": 22.0797, "lng": 82.1409, "zone": "SECR"},
        "BSL": {"code": "BSL", "name": "Bhusaval Jn", "lat": 21.0455, "lng": 75.7885, "zone": "CR"},
        "JL": {"code": "JL", "name": "Jalgaon Jn", "lat": 21.0077, "lng": 75.5626, "zone": "CR"},
        "KNW": {"code": "KNW", "name": "Khandwa Jn", "lat": 21.8267, "lng": 76.3533, "zone": "CR"},
        "ET": {"code": "ET", "name": "Itarsi Jn", "lat": 22.6122, "lng": 77.7600, "zone": "WCR"},
        "BPL": {"code": "BPL", "name": "Bhopal Jn", "lat": 23.2599, "lng": 77.4126, "zone": "WCR"},
        "RKMP": {"code": "RKMP", "name": "Rani Kamlapati", "lat": 23.2081, "lng": 77.4393, "zone": "WCR"},
        "JBP": {"code": "JBP", "name": "Jabalpur Jn", "lat": 23.1600, "lng": 79.9500, "zone": "WCR"},
        "KTE": {"code": "KTE", "name": "Katni Jn", "lat": 23.8343, "lng": 80.3980, "zone": "WCR"},
        "STA": {"code": "STA", "name": "Satna Jn", "lat": 24.5800, "lng": 80.8300, "zone": "WCR"},
        "PRYJ": {"code": "PRYJ", "name": "Prayagraj Jn", "lat": 25.4447, "lng": 81.8346, "zone": "NCR"},
        "ALD": {"code": "ALD", "name": "Prayagraj (Allahabad)", "lat": 25.4447, "lng": 81.8346, "zone": "NCR"},
        "CNB": {"code": "CNB", "name": "Kanpur Central", "lat": 26.4537, "lng": 80.3507, "zone": "NCR"},
        "LKO": {"code": "LKO", "name": "Lucknow Charbagh", "lat": 26.8315, "lng": 80.9234, "zone": "NR"},
        "GKP": {"code": "GKP", "name": "Gorakhpur Jn", "lat": 26.7588, "lng": 83.3820, "zone": "NER"},
        "BSB": {"code": "BSB", "name": "Varanasi Jn", "lat": 25.3283, "lng": 82.9863, "zone": "NR"},
        "DDU": {"code": "DDU", "name": "Pt Deen Dayal Upadhyaya", "lat": 25.2796, "lng": 83.1187, "zone": "ECR"},
        "MGS": {"code": "MGS", "name": "Mughal Sarai Jn", "lat": 25.2796, "lng": 83.1187, "zone": "ECR"},
        "PNBE": {"code": "PNBE", "name": "Patna Jn", "lat": 25.6022, "lng": 85.1376, "zone": "ECR"},
        "GAYA": {"code": "GAYA", "name": "Gaya Jn", "lat": 24.7955, "lng": 85.0002, "zone": "ECR"},
        "DHN": {"code": "DHN", "name": "Dhanbad Jn", "lat": 23.7917, "lng": 86.4304, "zone": "ECR"},
        "ASN": {"code": "ASN", "name": "Asansol Jn", "lat": 23.6871, "lng": 86.9746, "zone": "ER"},
        "HWH": {"code": "HWH", "name": "Howrah Jn", "lat": 22.5839, "lng": 88.3433, "zone": "ER"},
        "SDAH": {"code": "SDAH", "name": "Sealdah", "lat": 22.5684, "lng": 88.3712, "zone": "ER"},
        "KGP": {"code": "KGP", "name": "Kharagpur Jn", "lat": 22.3391, "lng": 87.3248, "zone": "SER"},
        "TATA": {"code": "TATA", "name": "Tatanagar Jn", "lat": 22.7667, "lng": 86.2000, "zone": "SER"},
        "RNC": {"code": "RNC", "name": "Ranchi Jn", "lat": 23.3512, "lng": 85.3346, "zone": "SER"},
        "BBS": {"code": "BBS", "name": "Bhubaneswar", "lat": 20.2648, "lng": 85.8436, "zone": "ECoR"},
        "CTC": {"code": "CTC", "name": "Cuttack Jn", "lat": 20.4625, "lng": 85.8830, "zone": "ECoR"},
        "PURI": {"code": "PURI", "name": "Puri", "lat": 19.8135, "lng": 85.8312, "zone": "ECoR"},
        "VSKP": {"code": "VSKP", "name": "Visakhapatnam", "lat": 17.7215, "lng": 83.2870, "zone": "ECoR"},
        "BZA": {"code": "BZA", "name": "Vijayawada Jn", "lat": 16.5186, "lng": 80.6200, "zone": "SCR"},
        "MAS": {"code": "MAS", "name": "Chennai Central", "lat": 13.0827, "lng": 80.2707, "zone": "SR"},
        "MS": {"code": "MS", "name": "Chennai Egmore", "lat": 13.0784, "lng": 80.2608, "zone": "SR"},
        "SBC": {"code": "SBC", "name": "KSR Bengaluru", "lat": 12.9779, "lng": 77.5671, "zone": "SWR"},
        "YPR": {"code": "YPR", "name": "Yesvantpur Jn", "lat": 13.0234, "lng": 77.5502, "zone": "SWR"},
        "MYS": {"code": "MYS", "name": "Mysuru Jn", "lat": 12.3160, "lng": 76.6450, "zone": "SWR"},
        "CBE": {"code": "CBE", "name": "Coimbatore Jn", "lat": 11.0018, "lng": 76.9628, "zone": "SR"},
        "ED": {"code": "ED", "name": "Erode Jn", "lat": 11.3364, "lng": 77.7275, "zone": "SR"},
        "SA": {"code": "SA", "name": "Salem Jn", "lat": 11.6643, "lng": 78.1460, "zone": "SR"},
        "TPJ": {"code": "TPJ", "name": "Tiruchchirappalli Jn", "lat": 10.7905, "lng": 78.6856, "zone": "SR"},
        "MDU": {"code": "MDU", "name": "Madurai Jn", "lat": 9.9197, "lng": 78.1105, "zone": "SR"},
        "TVC": {"code": "TVC", "name": "Thiruvananthapuram Central", "lat": 8.4875, "lng": 76.9525, "zone": "SR"},
        "ERS": {"code": "ERS", "name": "Ernakulam Jn", "lat": 9.9680, "lng": 76.2908, "zone": "SR"},
        "CLT": {"code": "CLT", "name": "Kozhikode", "lat": 11.2467, "lng": 75.7804, "zone": "SR"},
        "MAQ": {"code": "MAQ", "name": "Mangaluru Central", "lat": 12.8656, "lng": 74.8431, "zone": "SR"},
        "MAJN": {"code": "MAJN", "name": "Mangaluru Jn", "lat": 12.8698, "lng": 74.8710, "zone": "SR"},
        "UBL": {"code": "UBL", "name": "SSS Hubballi Jn", "lat": 15.3524, "lng": 75.1437, "zone": "SWR"},
        "BGM": {"code": "BGM", "name": "Belagavi", "lat": 15.8497, "lng": 74.4977, "zone": "SWR"},
        "MAO": {"code": "MAO", "name": "Madgaon Jn", "lat": 15.2736, "lng": 73.9780, "zone": "KR"},
        "ST": {"code": "ST", "name": "Surat", "lat": 21.2049, "lng": 72.8411, "zone": "WR"},
        "BRC": {"code": "BRC", "name": "Vadodara Jn", "lat": 22.3107, "lng": 73.1812, "zone": "WR"},
        "ADI": {"code": "ADI", "name": "Ahmedabad Jn", "lat": 23.0225, "lng": 72.5714, "zone": "WR"},
        "RTM": {"code": "RTM", "name": "Ratlam Jn", "lat": 23.3441, "lng": 75.0378, "zone": "WR"},
        "KOTA": {"code": "KOTA", "name": "Kota Jn", "lat": 25.2138, "lng": 75.8648, "zone": "WCR"},
        "SWM": {"code": "SWM", "name": "Sawai Madhopur Jn", "lat": 25.9928, "lng": 76.3688, "zone": "WCR"},
        "JP": {"code": "JP", "name": "Jaipur Jn", "lat": 26.9196, "lng": 75.7878, "zone": "NWR"},
        "AII": {"code": "AII", "name": "Ajmer Jn", "lat": 26.4525, "lng": 74.6399, "zone": "NWR"},
        "JU": {"code": "JU", "name": "Jodhpur Jn", "lat": 26.2807, "lng": 73.0183, "zone": "NWR"},
        "BKN": {"code": "BKN", "name": "Bikaner Jn", "lat": 28.0167, "lng": 73.3119, "zone": "NWR"},
        "MJ": {"code": "MJ", "name": "Marwar Jn", "lat": 25.7333, "lng": 73.6000, "zone": "NWR"},
        "KBK": {"code": "KBK", "name": "Khamil Ghat", "lat": 25.4667, "lng": 73.8333, "zone": "NWR"},
        "NDLS": {"code": "NDLS", "name": "New Delhi", "lat": 28.6143, "lng": 77.2090, "zone": "NR"},
        "DLI": {"code": "DLI", "name": "Old Delhi", "lat": 28.6617, "lng": 77.2281, "zone": "NR"},
        "NZM": {"code": "NZM", "name": "Hazrat Nizamuddin", "lat": 28.5888, "lng": 77.2534, "zone": "NR"},
        "ANVT": {"code": "ANVT", "name": "Anand Vihar Terminal", "lat": 28.6508, "lng": 77.3153, "zone": "NR"},
        "GZB": {"code": "GZB", "name": "Ghaziabad Jn", "lat": 28.6534, "lng": 77.4267, "zone": "NR"},
        "ALJN": {"code": "ALJN", "name": "Aligarh Jn", "lat": 27.8974, "lng": 78.0880, "zone": "NCR"},
        "TDL": {"code": "TDL", "name": "Tundla Jn", "lat": 27.2064, "lng": 78.2393, "zone": "NCR"},
        "AGC": {"code": "AGC", "name": "Agra Cantt", "lat": 27.1587, "lng": 77.9908, "zone": "NCR"},
        "GWL": {"code": "GWL", "name": "Gwalior Jn", "lat": 26.2183, "lng": 78.1828, "zone": "NCR"},
        "VGLJ": {"code": "VGLJ", "name": "V Lakshmibai Jhansi", "lat": 25.4484, "lng": 78.5685, "zone": "NCR"},
        "JHS": {"code": "JHS", "name": "Jhansi Jn", "lat": 25.4484, "lng": 78.5685, "zone": "NCR"},
        "MB": {"code": "MB", "name": "Moradabad Jn", "lat": 28.8386, "lng": 78.7733, "zone": "NR"},
        "BE": {"code": "BE", "name": "Bareilly Jn", "lat": 28.3398, "lng": 79.4172, "zone": "NR"},
        "ASR": {"code": "ASR", "name": "Amritsar Jn", "lat": 31.6340, "lng": 74.8723, "zone": "NR"},
        "LDH": {"code": "LDH", "name": "Ludhiana Jn", "lat": 30.9010, "lng": 75.8573, "zone": "NR"},
        "UMB": {"code": "UMB", "name": "Ambala Cantt", "lat": 30.3323, "lng": 76.8288, "zone": "NR"},
        "CDG": {"code": "CDG", "name": "Chandigarh", "lat": 30.7051, "lng": 76.8013, "zone": "NR"},
        "SRE": {"code": "SRE", "name": "Saharanpur Jn", "lat": 29.9640, "lng": 77.5460, "zone": "NR"},
        "HW": {"code": "HW", "name": "Haridwar Jn", "lat": 29.9457, "lng": 78.1642, "zone": "NR"},
        "DDN": {"code": "DDN", "name": "Dehradun", "lat": 30.3165, "lng": 78.0322, "zone": "NR"},
        "JAT": {"code": "JAT", "name": "Jammu Tawi", "lat": 32.7060, "lng": 74.8795, "zone": "NR"},
        "SVDK": {"code": "SVDK", "name": "SMVD Katra", "lat": 32.9904, "lng": 74.9385, "zone": "NR"},
        "NJP": {"code": "NJP", "name": "New Jalpaiguri", "lat": 26.6853, "lng": 88.4419, "zone": "NFR"},
        "GHY": {"code": "GHY", "name": "Guwahati", "lat": 26.1818, "lng": 91.7516, "zone": "NFR"}
    }
    
    geo_data.update(CURATED_CRITICAL_FIXES)
    with open(GEO_FILE, "w", encoding="utf-8") as out_f:
        json.dump(geo_data, out_f, indent=2)
        
    return geo_data

def update_all_system_indexes(geo_data):
    print("Updating station_search_index.json...")
    if os.path.exists(SEARCH_INDEX_PATH):
        with open(SEARCH_INDEX_PATH, "r", encoding="utf-8") as f:
            search_index = json.load(f)
        
        updated_count = 0
        for item in search_index:
            code = item.get("code", "").strip().upper()
            if code in geo_data:
                g = geo_data[code]
                item["lat"] = g["lat"]
                item["lng"] = g["lng"]
                if "name" in g and len(g["name"]) > 2:
                    item["name"] = g["name"]
                if "zone" in g:
                    item["zone"] = g["zone"]
                updated_count += 1
                
        with open(SEARCH_INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(search_index, f, indent=2)
        print(f"Updated {updated_count} station coordinates in station_search_index.json.")

    print("Updating railway_network_full.json...")
    if os.path.exists(NETWORK_FULL_PATH):
        with open(NETWORK_FULL_PATH, "r", encoding="utf-8") as f:
            net_full = json.load(f)
            
        updated_nodes = 0
        for node in net_full.get("nodes", []):
            code = node.get("code", node.get("id", "")).strip().upper()
            if code in geo_data:
                g = geo_data[code]
                node["lat"] = g["lat"]
                node["lng"] = g["lng"]
                if "name" in g and len(g["name"]) > 2:
                    node["name"] = g["name"]
                if "zone" in g:
                    node["zone"] = g["zone"]
                updated_nodes += 1
                
        with open(NETWORK_FULL_PATH, "w", encoding="utf-8") as f:
            json.dump(net_full, f, indent=2)
        print(f"Updated {updated_nodes} nodes in railway_network_full.json.")

    print("Updating railway_network_hdn.json...")
    if os.path.exists(NETWORK_HDN_PATH):
        with open(NETWORK_HDN_PATH, "r", encoding="utf-8") as f:
            net_hdn = json.load(f)
            
        for node in net_hdn.get("nodes", []):
            code = node.get("code", node.get("id", "")).strip().upper()
            if code in geo_data:
                g = geo_data[code]
                node["lat"] = g["lat"]
                node["lng"] = g["lng"]
                if "name" in g and len(g["name"]) > 2:
                    node["name"] = g["name"]
                    
        with open(NETWORK_HDN_PATH, "w", encoding="utf-8") as f:
            json.dump(net_hdn, f, indent=2)

    print("Updating railway_network_major.json...")
    if os.path.exists(NETWORK_MAJOR_PATH):
        with open(NETWORK_MAJOR_PATH, "r", encoding="utf-8") as f:
            net_major = json.load(f)
            
        for node in net_major.get("nodes", []):
            code = node.get("code", node.get("id", "")).strip().upper()
            if code in geo_data:
                g = geo_data[code]
                node["lat"] = g["lat"]
                node["lng"] = g["lng"]
                if "name" in g and len(g["name"]) > 2:
                    node["name"] = g["name"]
                    
        with open(NETWORK_MAJOR_PATH, "w", encoding="utf-8") as f:
            json.dump(net_major, f, indent=2)

if __name__ == "__main__":
    geo = download_and_build_geo_db()
    update_all_system_indexes(geo)
    print("SUCCESS: All railway station coordinates synchronized across the entire platform!")
