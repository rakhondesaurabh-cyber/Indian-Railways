import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import xgboost as xgb
import pickle

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "ml_training_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_predictor.xgb")

def train_model():
    print(f"Loading training data from {DATASET_PATH}...")
    if not os.path.exists(DATASET_PATH):
        print("Error: Training data not found. Run dataset_processor.py first.")
        return

    df = pd.read_csv(DATASET_PATH)
    
    # Features (X) and Target (y)
    # We do NOT include 'edge_id' directly as it's a high-cardinality categorical.
    # The 'traffic_density' encapsulates the edge's historical busy-ness.
    features = ['hour', 'duration_mins', 'traffic_density', 'is_weekend']
    
    X = df[features]
    y = df['delay_mins']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating Model...")
    y_pred = model.predict(X_test)
    
    # Ensure no negative delays are predicted
    y_pred = np.maximum(y_pred, 0)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"Model Evaluation Metrics:")
    print(f" - RMSE: {rmse:.2f} minutes")
    print(f" - MAE:  {mae:.2f} minutes")
    
    # Save the model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model successfully saved to {MODEL_PATH}")

if __name__ == '__main__':
    train_model()
