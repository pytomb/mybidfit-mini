#!/usr/bin/env python3
"""
MyBidFit Business Pain Points Icons Generator
Creates 6 professional icons for the sales process pain points
"""

import requests
import json
import os
from PIL import Image
import io

def generate_business_icons():
    """Generate 6 business pain point icons for MyBidFit presentation"""
    
    # Stability AI API configuration
    api_key = os.getenv('STABILITY_API_KEY')
    if not api_key:
        print("ERROR: STABILITY_API_KEY environment variable not set")
        return False
    
    # Icon concepts and prompts
    icons = [
        {
            "name": "prospecting",
            "prompt": """Professional business icon for 'Prospecting', 
            magnifying glass with business opportunities, search and discovery concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        },
        {
            "name": "qualification", 
            "prompt": """Professional business icon for 'Qualification',
            filter or checkmark with criteria evaluation, sorting and selection concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        },
        {
            "name": "needs_assessment",
            "prompt": """Professional business icon for 'Needs Assessment',
            question mark with analysis symbols, understanding and evaluation concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        },
        {
            "name": "proposal_contracting",
            "prompt": """Professional business icon for 'Proposal & Contracting',
            document with pen or contract signing, paperwork and legal concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        },
        {
            "name": "solutioning",
            "prompt": """Professional business icon for 'Solutioning',
            lightbulb with gear or puzzle pieces, problem solving and innovation concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        },
        {
            "name": "close_followup",
            "prompt": """Professional business icon for 'Close & Follow-up',
            handshake with circular arrow or relationship symbol, partnership and ongoing relationship concept,
            clean modern icon design, deep blue (#1e3a8a) and bright blue (#3b82f6),
            white background, circular design suitable for diagram,
            vector-style illustration, minimalist and professional"""
        }
    ]
    
    # API configuration
    url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Ensure output directory exists
    os.makedirs("/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/icons", exist_ok=True)
    
    success_count = 0
    
    for icon in icons:
        print(f"🎨 Generating {icon['name']} icon...")
        
        data = {
            "text_prompts": [
                {
                    "text": icon["prompt"],
                    "weight": 1.0
                }
            ],
            "cfg_scale": 7.0,
            "height": 1024,
            "width": 1024,  # Square icons
            "samples": 1,
            "steps": 50,
            "style_preset": "digital-art"
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            
            if "artifacts" in result:
                import base64
                
                image_data = base64.b64decode(result["artifacts"][0]["base64"])
                image = Image.open(io.BytesIO(image_data))
                
                # Save original
                original_path = f"/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/icons/{icon['name']}_icon.png"
                image.save(original_path, "PNG", quality=95)
                
                # Create web-optimized WebP version
                webp_path = f"/mnt/c/Users/dnice/DJ Programs/mybidfit_mini/business/mybidfit-presentation/assets/icons/{icon['name']}_icon.webp"
                image.save(webp_path, "WebP", quality=85)
                
                success_count += 1
                print(f"   ✅ {icon['name']} icon generated successfully!")
                
            else:
                print(f"   ❌ Error generating {icon['name']}: No image data in response")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ API Request failed for {icon['name']}: {e}")
        except Exception as e:
            print(f"   ❌ Error generating {icon['name']}: {e}")
    
    print(f"\n📊 Icon Generation Summary:")
    print(f"   ✅ Successfully generated: {success_count}/6 icons")
    print(f"   📁 Location: assets/icons/")
    print(f"   📐 Dimensions: 1024x1024 (high resolution)")
    print(f"   🌐 Both PNG and WebP versions created")
    
    return success_count == 6

if __name__ == "__main__":
    print("🎨 Generating MyBidFit business pain points icons...")
    success = generate_business_icons()
    
    if success:
        print("\n🎯 All icons ready for your MyBidFit presentation!")
        print("   Perfect for circular diagram layouts")
        print("   Professional MyBidFit brand colors")
    else:
        print("\n⚠️  Some icons may have failed. Check individual results above.")