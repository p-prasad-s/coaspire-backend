from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
from io import BytesIO
from PIL import Image, ImageDraw

app = Flask(__name__)
CORS(app)  # Allow React to communicate with this server

# --- CORE LOGIC: COASTAL GENERATION ---

def generate_futuristic_coast(width=256, height=256, future_year=0):
    """
    Generates a high-fidelity synthetic coastal environment for the Map.
    """
    # 1. Create a smooth gradient (simulating a beach slope)
    x = np.linspace(0, 1, width)
    y = np.linspace(0, 1, height)
    xv, yv = np.meshgrid(x, y)
    
    # Angled coastline gradient
    base_gradient = (xv * 0.6 + yv * 0.4) 
    
    # 2. Add 'Perlin-like' noise for realism
    noise = np.random.normal(0, 0.04, (height, width))
    terrain = base_gradient + noise

    # 3. Simulation Logic: Sea Level Rise
    # 0.006 shift per year
    erosion_shift = future_year * 0.006
    
    # 4. Define Thresholds (Classifications)
    deep_water_thresh = 0.35 + erosion_shift
    shallow_thresh = 0.45 + erosion_shift
    wave_thresh = 0.50 + erosion_shift
    sand_thresh = 0.65
    
    # 5. Generate Masks (Boolean Arrays)
    deep_water = terrain < deep_water_thresh
    shallow_water = (terrain >= deep_water_thresh) & (terrain < shallow_thresh)
    waves = (terrain >= shallow_thresh) & (terrain < wave_thresh)
    sand = (terrain >= wave_thresh) & (terrain < sand_thresh)
    veg = terrain >= sand_thresh

    return deep_water, shallow_water, waves, sand, veg

def analyze_transects(img_draw, waves_mask, width, height):
    """
    Draws scientific analysis lines (Transects) on the image.
    """
    risk_points = 0
    # Scan every 40px
    for y in range(20, height, 40):
        # Find where waves meet sand
        row = waves_mask[y, :]
        indices = np.where(row)[0]
        
        if len(indices) > 0:
            # Pick the center of the wave zone
            x_center = int(np.mean(indices))
            
            # Draw Transect Line (Yellow Neon)
            img_draw.line([(x_center - 30, y), (x_center + 50, y)], fill=(255, 255, 0, 180), width=1)
            
            # Draw Measurement Node
            color = "#00ffcc" if x_center < 128 else "#ff0055"
            r = 2
            img_draw.ellipse([(x_center-r, y-r), (x_center+r, y+r)], fill=color, outline=None)
            
            if x_center > 128: risk_points += 1
            
    return risk_points

def generate_simulation_metrics(width=256, height=256, future_year=0):
    """
    Pure math calculation for the Report (No image generation).
    """
    # Re-use the generation logic math
    x = np.linspace(0, 1, width)
    y = np.linspace(0, 1, height)
    xv, yv = np.meshgrid(x, y)
    base_gradient = (xv * 0.6 + yv * 0.4) 
    noise = np.random.normal(0, 0.04, (height, width))
    terrain = base_gradient + noise

    erosion_shift = future_year * 0.006
    sand_thresh = 0.65
    
    # Vegetation Mask
    veg_mask = terrain >= sand_thresh
    
    # Calculate Metrics
    total_pixels = width * height
    veg_percent = (np.sum(veg_mask) / total_pixels) * 100
    
    # Erosion Risk (Inverse of stability)
    erosion_risk = (100 - veg_percent) + (future_year * 1.5)
    
    # Optimistic Metric: Restoration Potential
    restoration_potential = (100 - veg_percent) * 0.7

    return round(veg_percent, 2), round(erosion_risk, 2), round(restoration_potential, 2)

def encode_image(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# --- API ROUTES ---

@app.route('/analyze-coast', methods=['POST'])
def analyze_coast():
    """
    ENDPOINT 1: Generates the Visual Map Layer
    """
    try:
        data = request.json
        future_year = int(data.get('future_year', 0))
        show_transects = data.get('show_transects', False)
        
        # 1. Generate Layers
        d_water, s_water, waves, sand, veg = generate_futuristic_coast(future_year=future_year)
        
        # 2. Composition (RGBA Image)
        composite = np.zeros((256, 256, 4), dtype=np.uint8)
        
        # Colors: [R, G, B, Alpha]
        composite[d_water] = [10, 20, 60, 200]    # Deep Navy
        composite[s_water] = [0, 100, 200, 180]   # Cyan Blue
        composite[waves]   = [220, 255, 255, 220] # White Foam
        composite[sand]    = [194, 178, 128, 150] # Sand
        composite[veg]     = [0, 180, 100, 160]   # Tech Green

        img_pil = Image.fromarray(composite)
        draw = ImageDraw.Draw(img_pil)

        # 3. Draw Transects if requested
        erosion_risk_score = 0
        if show_transects:
            erosion_risk_score = analyze_transects(draw, waves, 256, 256)

        # 4. Calculate Single-Year Metrics
        total_pixels = 256 * 256
        veg_percent = (np.sum(veg) / total_pixels) * 100
        
        return jsonify({
            "metrics": {
                "vegetation_coverage": round(veg_percent, 2),
                "erosion_risk_index": erosion_risk_score * 10
            },
            "year_offset": future_year,
            "mask_image": f"data:image/png;base64,{encode_image(img_pil)}"
        })
    except Exception as e:
        print(f"Error in /analyze-coast: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate-report', methods=['POST'])
def generate_report():
    """
    ENDPOINT 2: Generates the Multi-Year Strategic Report
    """
    try:
        timeline = [0, 5, 10, 20, 30]
        report_data = []

        for year in timeline:
            veg, erosion, restoration = generate_simulation_metrics(future_year=year)
            
            # Determine Status Label
            status = "STABLE"
            if erosion > 50: status = "WARNING"
            if erosion > 70: status = "CRITICAL"

            report_data.append({
                "year": f"+{year} Years",
                "vegetation": veg,
                "erosion_risk": erosion,
                "restoration_potential": restoration,
                "status": status
            })

        # Generate AI Recommendation
        final_veg = report_data[-1]['vegetation']
        start_veg = report_data[0]['vegetation']
        loss = start_veg - final_veg
        
        recommendation = ""
        if loss < 5:
            recommendation = "Zone is stable. Maintain current monitoring protocols."
        elif loss < 15:
            recommendation = "Moderate erosion detected. Initiate mangrove planting in Sector 4."
        else:
            recommendation = "CRITICAL ALERT: Significant land loss projected. Immediate construction of sea walls and breakwaters required."

        return jsonify({
            "timeline_data": report_data,
            "ai_recommendation": recommendation
        })
    except Exception as e:
        print(f"Error in /generate-report: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/ai-predictor', methods=['POST'])
def ai_predictor():
    """
    ENDPOINT 3: AI Predictor - Optimistic Data Analysis with Visit Points, Graph, Classification, GIS Image
    """
    try:
        # Generate optimistic visit points (e.g., monitoring sites with predicted improvements)
        visit_points = []
        for i in range(10):
            lat = 19.8 + np.random.uniform(-0.1, 0.1)
            lon = 85.8 + np.random.uniform(-0.1, 0.1)
            predicted_veg_increase = round(np.random.uniform(10, 30), 2)  # Optimistic increase %
            classification = "High Potential" if predicted_veg_increase > 20 else "Medium Potential"
            visit_points.append({
                "id": i+1,
                "lat": lat,
                "lon": lon,
                "predicted_veg_increase": predicted_veg_increase,
                "classification": classification,
                "numerical_value": predicted_veg_increase  # For graph
            })

        # Generate a simple GIS image (e.g., predicted future coast with green areas)
        d_water, s_water, waves, sand, veg = generate_futuristic_coast(future_year=10)  # Optimistic future
        composite = np.zeros((256, 256, 4), dtype=np.uint8)
        composite[d_water] = [10, 20, 60, 200]
        composite[s_water] = [0, 100, 200, 180]
        composite[waves] = [220, 255, 255, 220]
        composite[sand] = [194, 178, 128, 150]
        composite[veg] = [0, 255, 100, 200]  # Brighter green for optimistic
        img_pil = Image.fromarray(composite)
        gis_image = f"data:image/png;base64,{encode_image(img_pil)}"

        # Graph data: points for plotting (e.g., veg increase over time or by point)
        graph_data = {
            "labels": [f"Point {p['id']}" for p in visit_points],
            "values": [p['numerical_value'] for p in visit_points]
        }

        return jsonify({
            "visit_points": visit_points,
            "graph_data": graph_data['values'],  # Return just the values array for the graph
            "gis_image": gis_image,
            "summary": {
                "classification": "High Potential Areas Identified for Vegetation Restoration",
                "description": "Optimistic prediction shows potential for vegetation recovery in selected areas."
            }
        })
    except Exception as e:
        print(f"Error in /ai-predictor: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    print(f"✅ AI Engine Running on Port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)