#!/usr/bin/env python3
"""
MyBidFit Hero Image Generator
Creates professional presentation hero background
"""

import requests
import json
import os
from PIL import Image
import io

def generate_hero_image():
    """Generate MyBidFit hero background image"""
    
    # Stability AI API configuration
    api_key = os.getenv('STABILITY_API_KEY')
    if not api_key:
        print("ERROR: STABILITY_API_KEY environment variable not set")
        return False
    
    # Professional B2B hero image prompt
    prompt = """Professional business success concept for B2B presentation background, 
    arrow hitting bullseye target center, corporate office environment, 
    professional businesspeople in background slightly blurred, 
    deep blue and bright blue color scheme (#1e3a8a, #3b82f6), 
    success and achievement theme, clean modern composition, 
    photorealistic, high quality corporate photography, 
    suitable for investor presentation, inspiring and trustworthy aesthetic"""
    
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
        "width": 1344,  # Hero banner dimensions
        "samples": 1,
        "steps": 50,
        "style_preset": "photographic"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # Save the generated image
        if "artifacts" in result:
            import base64
            
            image_data = base64.b64decode(result["artifacts"][0]["base64"])
            image = Image.open(io.BytesIO(image_data))
            
            # Ensure output directory exists
            os.makedirs("/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets", exist_ok=True)
            
            # Save original
            original_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/hero_background.png"
            image.save(original_path, "PNG", quality=95)
            
            # Create web-optimized WebP version
            webp_path = "/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/hero_background.webp"
            image.save(webp_path, "WebP", quality=85)
            
            print(f"✅ Hero image generated successfully!")
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
        print(f"❌ Error generating image: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Generating MyBidFit hero background image...")
    success = generate_hero_image()
    
    if success:
        print("\n🎯 Hero image ready for your MyBidFit presentation!")
        print("   Use the WebP version for optimal performance")
        print("   Dimensions optimized for presentation slides")
    else:
        print("\n❌ Hero image generation failed. Please check your API key and try again.")