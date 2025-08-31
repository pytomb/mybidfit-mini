#!/usr/bin/env python3
"""
MyBidFit Investment Visual Generator
Creates professional investment/growth visualization
"""

import requests
import json
import os
from PIL import Image
import io

def generate_investment_visual():
    """Generate MyBidFit investment and growth visualization"""
    
    # Stability AI API configuration
    api_key = os.getenv('STABILITY_API_KEY')
    if not api_key:
        print("ERROR: STABILITY_API_KEY environment variable not set")
        return False
    
    # Professional investment visualization prompt
    prompt = """Professional business investment visualization showing $500K funding concept,
    upward trending growth chart with ascending bars and arrow,
    network connections between business nodes, interconnected circles,
    money symbols and investment icons, dollar signs and growth indicators,
    deep blue (#1e3a8a) and bright blue (#3b82f6) primary colors,
    accent green (#10b981) for positive growth elements,
    clean modern infographic style, corporate presentation graphics,
    success and profitability theme, investor-focused design,
    professional financial visualization, high-quality business graphics"""
    
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
        "cfg_scale": 7.0,
        "height": 768,
        "width": 1344,  # Investment slide dimensions
        "samples": 1,
        "steps": 50,
        "style_preset": "digital-art"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # Save the generated visualization
        if "artifacts" in result:
            import base64
            
            image_data = base64.b64decode(result["artifacts"][0]["base64"])
            image = Image.open(io.BytesIO(image_data))
            
            # Ensure output directory exists
            os.makedirs("/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets", exist_ok=True)
            
            # Save original
            original_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/investment_visual.png"
            image.save(original_path, "PNG", quality=95)
            
            # Create web-optimized WebP version
            webp_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/investment_visual.webp"
            image.save(webp_path, "WebP", quality=85)
            
            print(f"✅ Investment visual generated successfully!")
            print(f"   📄 Original: {original_path}")
            print(f"   🌐 Web-optimized: {webp_path}")
            print(f"   📐 Dimensions: {image.size[0]}x{image.size[1]} (presentation-ready)")
            
            return True
        else:
            print(f"❌ Error: No image data in response: {result}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error generating investment visual: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Generating MyBidFit investment visualization...")
    success = generate_investment_visual()
    
    if success:
        print("\n🎯 Investment visual ready for your MyBidFit presentation!")
        print("   Perfect for funding and growth slides")
        print("   Professional financial graphics with brand colors")
    else:
        print("\n❌ Investment visual generation failed. Please check your API key and try again.")