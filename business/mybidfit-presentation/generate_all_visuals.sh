#!/bin/bash
"""
MyBidFit Complete Visual Asset Generation Script
Generates all presentation visuals in sequence
"""

echo "🎨 MyBidFit Visual Asset Generation Suite"
echo "========================================"

# Check if STABILITY_API_KEY is set
if [ -z "$STABILITY_API_KEY" ]; then
    echo "❌ ERROR: STABILITY_API_KEY environment variable not set"
    echo "   Please set your Stability AI API key:"
    echo "   export STABILITY_API_KEY='your-api-key-here'"
    exit 1
fi

echo "✅ API key detected. Starting visual generation..."
echo ""

# Create assets directory
mkdir -p assets/icons

# Track generation success
success_count=0
total_count=4

# Generate hero background
echo "🎯 1/4 Generating hero background image..."
if python3 generate_hero_image.py; then
    ((success_count++))
    echo "   ✅ Hero background complete"
else
    echo "   ❌ Hero background failed"
fi
echo ""

# Generate business icons
echo "🔧 2/4 Generating business pain points icons..."
if python3 generate_business_icons.py; then
    ((success_count++))
    echo "   ✅ Business icons complete"
else
    echo "   ❌ Business icons failed"
fi
echo ""

# Generate dashboard mockup
echo "💻 3/4 Generating dashboard mockup..."
if python3 generate_dashboard_mockup.py; then
    ((success_count++))
    echo "   ✅ Dashboard mockup complete"
else
    echo "   ❌ Dashboard mockup failed"
fi
echo ""

# Generate investment visual
echo "💰 4/4 Generating investment visualization..."
if python3 generate_investment_visual.py; then
    ((success_count++))
    echo "   ✅ Investment visual complete"
else
    echo "   ❌ Investment visual failed"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Visual Generation Summary:"
echo "   ✅ Successfully generated: $success_count/$total_count assets"

if [ $success_count -eq $total_count ]; then
    echo "   🎉 All MyBidFit visuals ready for presentation!"
    echo ""
    echo "📁 Generated Assets:"
    echo "   • assets/hero_background.png & .webp"
    echo "   • assets/icons/ (6 pain point icons)"
    echo "   • assets/dashboard_mockup.png & .webp"
    echo "   • assets/investment_visual.png & .webp"
    echo ""
    echo "🎯 All images optimized for:"
    echo "   • Presentation slides (high resolution)"
    echo "   • Web display (WebP optimized)"
    echo "   • MyBidFit brand colors"
    echo "   • Professional B2B audience"
else
    echo "   ⚠️  Some assets may have failed. Check individual results above."
fi

echo ""
echo "🚀 Ready to impress investors with your MyBidFit presentation!"