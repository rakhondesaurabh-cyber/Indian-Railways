import json
import os

def find_trains_between_stations(start_code, end_code, data):
    """
    Finds all direct trains that travel between a start and end station.

    Args:
        start_code (str): The station code for the starting station.
        end_code (str): The station code for the destination station.
        data (list): The list of train data loaded from the JSON file.
    Returns:
        list: A list of dictionaries, where each dictionary contains
              details of a train that travels between the specified stations.
    """
    found_trains = []
    
    # Make codes uppercase for case-insensitive matching
    start_code = start_code.upper()
    end_code = end_code.upper()

    for train in data:
        start_station_index = -1
        end_station_index = -1
        
        # Check the route for both stations
        # Ensure we have a valid trainRoute list
        if 'trainRoute' not in train or not isinstance(train['trainRoute'], list):
            continue
            
        for i, stop in enumerate(train['trainRoute']):
            station_name = stop.get('stationName', '').upper()
            if start_code in station_name:
                start_station_index = i
            if end_code in station_name:
                end_station_index = i
        
        # A valid route is found if both stations exist and the start comes before the end
        if start_station_index != -1 and end_station_index != -1 and start_station_index < end_station_index:
            train_info = {
                'name': train.get('trainName', 'Unknown'),
                'number': train.get('trainNumber', 'Unknown'),
                'start_station_details': train['trainRoute'][start_station_index],
                'end_station_details': train['trainRoute'][end_station_index]
            }
            found_trains.append(train_info)
            
    return found_trains

if __name__ == "__main__":
    try:
        # Load the dataset from the JSON file
        dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'EXP-TRAINS.json')
        
        with open(dataset_path, 'r', encoding='utf-8') as f:
            train_data = json.load(f)

        # --- Example Usage ---
        # 📍 Set your desired start and end station codes here
        start_station_code = 'MJ'  # Marwar JN
        end_station_code = 'KBK' # Khamil Ghat

        print(f"Searching for trains from '{start_station_code}' to '{end_station_code}'...")
        
        trains = find_trains_between_stations(start_station_code, end_station_code, train_data)

        if trains:
            print(f"\n[SUCCESS] Found {len(trains)} direct train(s):")
            for train in trains:
                print("-" * 40)
                print(f"  Train: {train['name']} ({train['number']})")
                
                # Print details for the start station of the user's journey
                start_details = train['start_station_details']
                print(f"  Departs from {start_details.get('stationName')}: {start_details.get('departs')} on Day {start_details.get('day')}")
                
                # Print details for the end station of the user's journey
                end_details = train['end_station_details']
                print(f"  Arrives at {end_details.get('stationName')}: {end_details.get('arrives')} on Day {end_details.get('day')}")
        else:
            print(f"\n[INFO] No direct trains found between '{start_station_code}' and '{end_station_code}'.")

    except FileNotFoundError:
        print(f"Error: 'EXP-TRAINS.json' not found at {dataset_path}. Please ensure the dataset is present.")
    except json.JSONDecodeError:
        print("Error: Could not decode the JSON file. Please check its format.")
