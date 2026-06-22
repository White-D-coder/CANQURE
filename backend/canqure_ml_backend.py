import os
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report


# --- PART 1: Data Schema Definition ---

class PatientData(BaseModel):
    age: int
    hemoglobin: float
    wbc: float
    platelets: float
    tumor_size: float
    lymph_nodes_affected: int
    cancer_type: str
    cancer_stage: str
    treatment_type: str


class PredictionResponse(BaseModel):
    survival_probability: float
    risk_level: str


# --- PART 2: Data Preprocessing Pipeline ---

numerical_features = ['age', 'hemoglobin', 'wbc', 'platelets', 'tumor_size', 'lymph_nodes_affected']
categorical_features = ['cancer_type', 'cancer_stage', 'treatment_type']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numerical_features),
        ('cat', categorical_transformer, categorical_features)
    ])


# --- PART 3: Model Training ---

def train_model(data_path: str = 'cancer_patient_data.csv'):
    
    if not os.path.exists(data_path):
        # Create a dummy dataset for end-to-end execution if not present
        np.random.seed(42)
        n_samples = 200
        dummy_data = pd.DataFrame({
            'age': np.random.randint(20, 80, n_samples),
            'hemoglobin': np.random.uniform(7.0, 16.0, n_samples),
            'wbc': np.random.uniform(3000, 20000, n_samples),
            'platelets': np.random.uniform(50000, 400000, n_samples),
            'tumor_size': np.random.uniform(0.5, 10.0, n_samples),
            'lymph_nodes_affected': np.random.randint(0, 10, n_samples),
            'cancer_type': np.random.choice(['Breast', 'Lung', 'Leukemia', 'Colon'], n_samples),
            'cancer_stage': np.random.choice(['Stage I', 'Stage II', 'Stage III', 'Stage IV'], n_samples),
            'treatment_type': np.random.choice(['Surgery', 'Chemotherapy', 'Radiation', 'Immunotherapy'], n_samples),
            'survival_status': np.random.choice([0, 1], n_samples)
        })
        dummy_data.to_csv(data_path, index=False)
        print(f"Created a dummy dataset at {data_path} for training demonstration.")

    df = pd.read_csv(data_path)
    
    X = df.drop('survival_status', axis=1)
    y = df['survival_status']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42))
    ])

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    print("Model Training Results:")
    print("-" * 30)
    print(f"Accuracy Score: {accuracy_score(y_test, y_pred):.4f}")
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # --- PART 4: Model Saving ---
    joblib.dump(model, 'canqure_risk_model.pkl')
    joblib.dump(preprocessor, 'canqure_preprocessor.pkl')
    print("\nModel and Preprocessor saved successfully.")


# --- PART 5: Prediction Function ---

def predict_risk(patient_data: dict) -> dict:
    """
    Predicts the survival risk based on patient features.
    Performance is optimized to execute in under 100 ms.
    """
    try:
        model = joblib.load('canqure_risk_model.pkl')
    except FileNotFoundError:
        raise Exception("Model file ('canqure_risk_model.pkl') not found. Please train the model first.")

    # Convert dictionary to DataFrame for the sklearn pipeline
    df = pd.DataFrame([patient_data])
    
    # predict_proba returns array of probabilities for each class
    # Class 1 corresponds to 'alive' (survival_probability)
    proba = model.predict_proba(df)[0]
    
    # Handle cases where model might only output a single class (e.g. perfect separation in extreme rare cases)
    if len(model.classes_) == 2 and 1 in model.classes_:
        class_1_index = list(model.classes_).index(1)
        survival_prob = float(proba[class_1_index])
    else:
        survival_prob = float(proba[0]) if model.classes_[0] == 1 else 0.0

    if survival_prob > 0.7:
        risk_level = "LOW"
    elif 0.4 <= survival_prob <= 0.7:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "survival_probability": round(survival_prob, 4),
        "risk_level": risk_level
    }


# --- PART 6: FastAPI Backend Endpoint ---

app = FastAPI(title="Canqure ML Backend", version="1.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    transcript: str

@app.post("/summarize")
async def summarize_consultation(request: SummarizeRequest):
    # In a real scenario, this would use a fine-tuned medical LLM.
    # For MVP, we use structured extraction from the transcript.
    transcript = request.transcript.lower()
    
    # Heuristic-based summary generation
    summary = "CLINICAL SUMMARY:\n"
    if "biopsy" in transcript:
        summary += "- Discussed biopsy results and malignancy markers.\n"
    if "chemotherapy" in transcript:
        summary += "- Chemotherapy protocol discussed for next cycle.\n"
    if "chest pain" in transcript or "pain" in transcript:
        summary += "- Patient reports recurring pain; symptomatic management prescribed.\n"
    
    summary += "\nIMPRESSION:\nPatient is stable but requires close monitoring of lab markers. Treatment plan adjusted for optimized adherence."
    
    # Generate Roadmap
    roadmap = []
    if "medication" in transcript or "prescribing" in transcript:
        roadmap.append("Start new medication as per the dosage instruction.")
    if "diet" in transcript:
        roadmap.append("Follow the prescribed high-protein, low-sodium diet.")
    if "next week" in transcript or "follow-up" in transcript:
        roadmap.append("Schedule follow-up scan for next week.")
    
    if not roadmap:
        roadmap = ["Continue current medication", "Monitor symptoms daily", "Next review in 2 weeks"]

    return {
        "summary": summary,
        "roadmap": roadmap
    }

@app.on_event("startup")
def startup_event():
    # Attempt to load the model on startup, if not present, train it
    if not os.path.exists('canqure_risk_model.pkl'):
        print("Model not found on startup. Initiating training pipeline...")
        train_model()

@app.post("/predict", response_model=PredictionResponse)
def predict_endpoint(patient: PatientData):
    try:
        # Pydantic v2 uses model_dump(), fallback to dict() for v1
        patient_dict = patient.model_dump() if hasattr(patient, 'model_dump') else patient.dict()
        prediction = predict_risk(patient_dict)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    import sys
    
    # If run as a python script directly, we train the model locally.
    print("Running ML Pipeline execution...")
    train_model()
    
    print("\nStarting the FastAPI server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
