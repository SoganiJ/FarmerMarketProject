import pandas as pd
import requests
import json
import sys

# This API key is for a free weather service.
WEATHER_API_KEY = "30d4741c779ba94c470ca1f63045390a" 
CSV_FILE_PATH = 'latest_stock_data.csv'

def get_farmer_advice(crop_name, district, state, crop_status):
    """
    Generates advice for a farmer based on crop status, weather, and mandi prices.
    """
    # --- Step 1: Load Mandi Price Data ---
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        df['Commodity'] = df['Commodity'].str.strip().str.title()
        crop_name_title = crop_name.strip().title()
    except FileNotFoundError:
        return {"error": "The 'latest_stock_data.csv' file was not found."}
    
    crop_data = df[(df['Commodity'] == crop_name_title) & (df['District'] == district)]
    if crop_data.empty:
        return {"advice": f"No mandi price data found for {crop_name} in {district}."}
    
    mandi_price_quintal = crop_data['Modal_Price'].iloc[-1]
    # Convert from quintal (100kg) to per kg
    mandi_price_per_kg = mandi_price_quintal / 100
    
    # --- Step 2: Fetch Weather Data ---
    temperature = None
    humidity = None
    weather_condition = None
    
    try:
        # Using OpenWeatherMap API
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?q={district},{state},IN&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(weather_url)
        response.raise_for_status()
        data = response.json()
        
        temperature = data['main']['temp']
        humidity = data['main']['humidity']
        weather_condition = data['weather'][0]['description']
        
    except requests.exceptions.RequestException as e:
        print(f"Weather API error: {e}")
        # If weather fails, we can still give price advice
        pass

    # --- Step 3: Generate Final Advice using Rules ---
    advice = "General advice: Monitor market trends and weather forecasts closely." # Default advice

    is_healthy = 'healthy' in crop_status.lower()

    if is_healthy:
        if temperature and (20 <= temperature <= 30 and 40 <= humidity <= 70):
            advice = f"Weather is good for storage. Current Mandi Price is ₹{mandi_price_per_kg:.2f}/kg. Consider waiting if prices are low."
        elif mandi_price_per_kg > 25: # Assuming 25/kg is a good price point (equivalent to 2500/quintal)
            advice = f"Price is high at ₹{mandi_price_per_kg:.2f}/kg! This is a good time to sell."
        else:
            advice = f"Crop is healthy. Current price is ₹{mandi_price_per_kg:.2f}/kg. You can choose to sell now or store and wait for better prices."
    else: # If crop is not healthy
        advice = f"Crop is diseased. It is highly recommended to sell now at the current price of ₹{mandi_price_per_kg:.2f}/kg to avoid further losses."

    return {
        "advice": advice,
        "mandi_price": f"₹{mandi_price_per_kg:.2f}",
        "mandi_price_quintal": f"₹{mandi_price_quintal}", # Keep original for reference
        "temperature": f"{temperature}°C" if temperature is not None else "Not available",
        "humidity": f"{humidity}%" if humidity is not None else "Not available",
        "weather_condition": weather_condition if weather_condition else "Not available"
    }

# Main execution for command line usage
if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({"error": "Invalid number of arguments. Expected: crop_name, district, state, crop_status"}))
        sys.exit(1)
    
    crop_name = sys.argv[1]
    district = sys.argv[2]
    state = sys.argv[3]
    crop_status = sys.argv[4]
    
    try:
        result = get_farmer_advice(crop_name, district, state, crop_status)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Error processing request: {str(e)}"}))