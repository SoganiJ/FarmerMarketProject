import os
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from werkzeug.utils import secure_filename
import traceback


# Import the function from our new advisor file
from price_advisor import get_farmer_advice

# --- Configuration ---
app = Flask(__name__)

# --- Load Disease Model ---
try:
    disease_model = tf.keras.models.load_model('plant_disease_model.h5')
    # These are the specific classes your model predicts, based on your script
    CLASS_NAMES = ['Diseased Cotton Leaf', 'Diseased Cotton Plant', 'Fresh Cotton Leaf', 'Fresh Cotton Plant']
    print("✅ Plant disease model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading disease model: {e}")
    disease_model = None

# --- API Endpoints ---

@app.route('/predict-disease', methods=['POST'])
def handle_disease_prediction():
    if disease_model is None:
        return jsonify({'error': 'Disease model is not available.'}), 500
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image file selected.'}), 400

    try:
        # We process the image in memory, no need to save it
        img_bytes = file.read()
        img = tf.keras.preprocessing.image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
        
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        prediction = disease_model.predict(img_array)
        
        # Get the highest probability prediction
        predicted_class_index = np.argmax(prediction[0])
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(np.max(prediction[0]))

        return jsonify({
            'prediction': predicted_class_name,
            'confidence': f"{confidence:.2%}"
        })

    except Exception:
        return jsonify({'error': 'Failed to process the image.'}), 500


@app.route('/get-advice', methods=['POST'])
def handle_get_advice():
    # This endpoint receives data like crop name, location, and the result from the disease check
    data = request.get_json()
    
    required_fields = ['crop_name', 'district', 'state', 'crop_status']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing data. Required fields are: crop_name, district, state, crop_status'}), 400

    # Call the logic function from our other file
    advice_data = get_farmer_advice(
        data['crop_name'],
        data['district'],
        data['state'],
        data['crop_status']
    )

    return jsonify(advice_data)


# --- Run Server ---
if __name__ == '__main__':
    import io # Import io here as it's only used in one place
    # Running on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)