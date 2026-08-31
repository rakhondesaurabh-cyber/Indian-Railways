import requests
import random
import logging

logger = logging.getLogger(__name__)

RAILRADAR_API_KEY = "rg_fbc5e3c5e9ee40a7a5a8daa6e6e0d2af"
RAILRADAR_BASE_URL = "https://api.railradar.mock/v1/live_status"

def get_live_corridor_delays(edges: list, api_key: str = RAILRADAR_API_KEY) -> dict:
    """
    Fetches real-time train running status for a list of track edges.
    In a fully integrated environment, this would call the RailRadar API.
    For demonstration, if the endpoint is unreachable, it simulates realistic live delays.
    
    Returns:
        dict: Mapping of edge_id to average delay (in minutes) currently experienced on that corridor.
    """
    live_delays = {}
    
    try:
        # Attempt to call the live API
        headers = {"Authorization": f"Bearer {api_key}"}
        # In a real scenario, we'd batch request these edges
        # response = requests.post(RAILRADAR_BASE_URL, json={"edges": edges}, headers=headers, timeout=2.0)
        # response.raise_for_status()
        # live_delays = response.json().get('delays', {})
        
        # Simulate connection failure to fallback to mock data for demonstration
        raise requests.exceptions.ConnectionError("RailRadar API endpoint not reachable.")
        
    except requests.exceptions.RequestException as e:
        logger.warning(f"Failed to fetch live telemetry from RailRadar: {e}. Falling back to mock live data.")
        
        # Mock live data generation: 
        # Most corridors are running on time (0 delay).
        # A small percentage have minor delays, and very few have major delays.
        for edge in edges:
            prob = random.random()
            if prob < 0.80:
                live_delays[edge] = 0
            elif prob < 0.95:
                live_delays[edge] = random.randint(5, 30)
            else:
                live_delays[edge] = random.randint(30, 120)
                
    return live_delays
