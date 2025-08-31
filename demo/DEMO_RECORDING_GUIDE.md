# Partner Fit Demo Recording Guide

## 🎬 Overview

The Partner Fit feature includes two demo scripts that can be recorded to showcase the multi-persona evaluation system:

1. **API Terminal Demo** - Shows live API calls with colored terminal output
2. **Playwright Browser Demo** - Shows full UI walkthrough (requires frontend implementation)

## 🚀 Quick Start - API Demo Recording

### Prerequisites
```bash
# Ensure the backend server is running
cd /mnt/c/Users/dnice/DJ\ Programs/mybidfit_mini
npm start

# The server should be running on port 3001
```

### Running the API Demo
```bash
# Navigate to project directory
cd /mnt/c/Users/dnice/DJ\ Programs/mybidfit_mini

# Run the API demo script
node demo/partner-fit-api-demo.js
```

### What the Demo Shows
- **Multi-Persona Evaluation System** - Visual representation of all 4 personas
- **Live API Calls** - Real-time partner matching with authentication
- **Colored Progress Bars** - Visual scoring for each persona (CFO, CISO, Operator, Skeptic)
- **Partnership Workflow** - Search → Evaluate → Invite flow
- **Rich Terminal Output** - Professional colored terminal visualization

### Demo Duration
- **Total Runtime**: ~3 minutes
- **Automated Pacing**: Built-in delays for recording clarity
- **Scene Transitions**: Clear visual markers between sections

## 📹 Recording Setup

### Recommended Recording Software

#### Windows
- **OBS Studio** (Free, recommended)
  - Download: https://obsproject.com/
  - Add "Window Capture" source
  - Select your terminal window
  - Set resolution to 1920x1080
  - Record at 30fps for smooth playback

- **Windows Game Bar** (Built-in)
  - Press `Win + G`
  - Click record button
  - Simple but limited features

#### macOS
- **OBS Studio** (Free, recommended)
- **QuickTime Player** (Built-in)
  - File → New Screen Recording
  - Select terminal window area

#### Linux
- **OBS Studio** (Free, recommended)
- **SimpleScreenRecorder**
  - `sudo apt install simplescreenrecorder`

### Terminal Setup for Best Recording

1. **Maximize Terminal Window**
   - Full screen or at least 1920x1080
   - Dark theme recommended for contrast

2. **Font Settings**
   - Size: 14-16pt for readability
   - Font: Monospace (Consolas, Fira Code, etc.)

3. **Color Theme**
   - High contrast theme
   - The demo uses ANSI colors that work with any theme

## 🎥 Recording Process

### Step 1: Prepare Environment
```bash
# Clear terminal for clean start
clear

# Ensure backend is running
# In Terminal 1:
cd /mnt/c/Users/dnice/DJ\ Programs/mybidfit_mini
npm start
```

### Step 2: Start Recording
1. Open your recording software
2. Select terminal window
3. Start recording
4. Wait 2-3 seconds

### Step 3: Run Demo
```bash
# In Terminal 2:
node demo/partner-fit-api-demo.js
```

### Step 4: Let Demo Complete
- Demo runs automatically with perfect timing
- No interaction needed
- Visual indicators show each scene
- Progress bars animate smoothly

### Step 5: Stop Recording
- Wait 3 seconds after "DEMO COMPLETED" message
- Stop recording
- Save video file

## 🎭 Demo Scenes Breakdown

### Scene 1: Introduction (15 seconds)
- Explains multi-persona evaluation concept
- Lists all 4 business personas

### Scene 2: Authentication (10 seconds)
- Shows JWT token generation
- Demonstrates API security

### Scene 3: Complementary Partners (30 seconds)
- Live API search for complementary partners
- Shows 2 partner results with full persona scores
- Visual progress bars for each score

### Scene 4: Similar Partners (30 seconds)
- Search for scaling partners
- Shows capacity-focused matches
- Same rich visualization

### Scene 5: Profile Creation (15 seconds)
- Creates partner profile via API
- Shows JSON configuration

### Scene 6: Partnership Invitation (15 seconds)
- Sends invitation to selected partner
- Shows invitation details and expiration

### Scene 7: Analytics Summary (15 seconds)
- Overall statistics across all personas
- Success rate visualization

## 🎨 Visual Features

### Color-Coded Personas
- 💰 **CFO** - Green (Financial)
- 🔒 **CISO** - Blue (Security)
- ⚙️ **Operator** - Yellow (Operations)
- 🤔 **Skeptic** - Red (Risk)

### Progress Bar Visualization
```
████████████████░░░░ 80% - Excellent
███████████░░░░░░░░░ 55% - Moderate
███░░░░░░░░░░░░░░░░░ 15% - Low
```

### Match Score Indicators
- **80-100%**: Excellent match (green)
- **60-79%**: Good match (yellow)
- **Below 60%**: Poor match (red)

## 📊 Post-Recording

### Video Editing Tips
1. **Trim Start/End** - Remove setup/teardown
2. **Add Title Card** - "MyBidFit Partner Fit - Multi-Persona Evaluation"
3. **Speed Adjustments** - Can speed up slightly (1.25x) if needed
4. **Add Captions** - Explain technical concepts
5. **Background Music** - Light, professional track (optional)

### Export Settings
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30fps
- **Bitrate**: 5-10 Mbps for quality

## 🚀 Advanced: Playwright Browser Demo

### Setup (If Frontend Implemented)
```bash
# Install Playwright if not already installed
npm install playwright

# Run the browser-based demo
node demo/partner-fit-demo.js
```

### Features
- Opens actual browser window
- Shows full UI interactions
- Includes form filling animations
- Visual highlighting of elements
- Automatic screenshot capture

### Recording Browser Demo
- Same recording software setup
- Capture browser window instead of terminal
- Longer runtime (~5 minutes)
- More visual, less technical

## 📝 Demo Script Narration (Optional)

If adding voiceover, here's a suggested script:

```
"Welcome to MyBidFit's Partner Fit feature, featuring our 
revolutionary multi-persona evaluation system.

Unlike traditional partner matching that focuses only on 
capabilities, our system evaluates each partnership through 
four critical business perspectives:

The CFO persona analyzes financial compatibility...
The CISO ensures security and compliance alignment...
The Operator evaluates delivery capability...
And the Skeptic identifies potential risks...

Watch as we search for complementary partners that fill our 
capability gaps... [continue with live narration]"
```

## 🎯 Tips for Great Demo Videos

1. **Practice Run** - Do a test recording first
2. **Clean Desktop** - Hide unnecessary windows/icons
3. **Stable Environment** - Ensure no interruptions
4. **Good Lighting** - If including webcam overlay
5. **Clear Audio** - If adding narration
6. **Consistent Pace** - Let animations complete
7. **Professional Appearance** - Clean terminal, no errors

## 🔧 Troubleshooting

### If Demo Fails
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check database connection
node scripts/check-schema.js

# Ensure JWT secret is set
echo $JWT_SECRET
```

### If Colors Don't Show
- Terminal must support ANSI colors
- Windows: Use Windows Terminal or Git Bash
- Enable color support in terminal settings

### If Timing Is Off
- Don't interact during demo
- Let it run at its own pace
- Delays are optimized for recording

## 📚 Additional Resources

- **Partner Fit Documentation**: `/PARTNER_FIT_TESTING_SUMMARY.md`
- **API Documentation**: `/src/routes/partnerFit.js`
- **Test Suite**: `/test/integration/partnerFit-api.test.js`

## 🎉 Ready to Record!

The demo is fully automated and designed for perfect recordings. Just:
1. Start your recording software
2. Run `node demo/partner-fit-api-demo.js`
3. Let the magic happen!

The visual output with colored progress bars and multi-persona scoring makes for an impressive demonstration of the AI-powered partner matching system.

---

*Demo scripts created for MyBidFit Partner Fit Feature - August 2025*