#!/usr/bin/env python3
"""
MyBidFit Dashboard Mockup Generator
Creates professional platform interface mockup
"""

import requests
import json
import os
from PIL import Image
import io

def generate_dashboard_mockup():
    """Generate MyBidFit platform dashboard mockup"""
    
    # Stability AI API configuration
    api_key = os.getenv('STABILITY_API_KEY')
    if not api_key:
        print("ERROR: STABILITY_API_KEY environment variable not set")
        return False
    
    # Professional dashboard mockup prompt
    prompt = """Modern SaaS dashboard interface for MyBidFit B2B platform,
    'Personalized Opportunities' header at top,
    three opportunity cards showing:
    - First card: 'TechCorp Solutions' with 96% match score, green indicator
    - Second card: 'Global Industries' with 89% match score, blue indicator  
    - Third card: 'Metro Services' with 78% match score, yellow indicator,
    each card has 'View Details & Apply' button,
    clean white background, deep blue (#1e3a8a) headers, 
    bright blue (#3b82f6) accent buttons, professional UI design,
    modern typography, card-based layout, subtle shadows,
    desktop web application interface, high-quality mockup design"""
    
    # API request to Stability AI
    url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "text_prompts": [
            {
                "text": prompt,
                "weight": 1.0
            }
        ],
        "cfg_scale": 8.0,
        "height": 896,
        "width": 1152,  # Dashboard aspect ratio
        "samples": 1,
        "steps": 50,
        "style_preset": "digital-art"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # Save the generated mockup
        if "artifacts" in result:
            import base64
            
            image_data = base64.b64decode(result["artifacts"][0]["base64"])
            image = Image.open(io.BytesIO(image_data))
            
            # Ensure output directory exists
            os.makedirs("/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets", exist_ok=True)
            
            # Save original
            original_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/dashboard_mockup.png"
            image.save(original_path, "PNG", quality=95)
            
            # Create web-optimized WebP version
            webp_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/dashboard_mockup.webp"
            image.save(webp_path, "WebP", quality=85)
            
            print(f"✅ Dashboard mockup generated successfully!")
            print(f"   📄 Original: {original_path}")
            print(f"   🌐 Web-optimized: {webp_path}")
            print(f"   📐 Dimensions: {image.size[0]}x{image.size[1]} (dashboard-optimized)")
            
            return True
        else:
            print(f"❌ Error: No image data in response: {result}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error generating dashboard mockup: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Generating MyBidFit dashboard mockup...")
    success = generate_dashboard_mockup()
    
    if success:
        print("\n🎯 Dashboard mockup ready for your MyBidFit presentation!")
        print("   Perfect for product demo slides")
        print("   Shows personalized opportunities with match scores")
    else:
        print("\n❌ Dashboard mockup generation failed. Please check your API key and try again.")