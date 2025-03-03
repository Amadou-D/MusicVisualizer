Music Visualizer
A real-time 3D music visualization web application built with Next.js and Three.js that transforms your audio into stunning interactive visuals.

Overview
This application creates an immersive, audio-reactive 3D environment where a wireframe sphere responds dynamically to music frequencies. Users can visualize audio from YouTube URLs or upload their own MP3 files for a personalized experience.

Features
Interactive 3D Visualization: A wireframe sphere that pulses and morphs to audio frequencies
Dual Audio Sources: Support for both YouTube URLs and MP3 file uploads
Real-time Audio Analysis: Using Web Audio API to analyze frequency data
Customizable Visual Settings: Adjust colors, bloom effects, and visual parameters on the fly
Mouse-controlled Camera: Move your mouse to explore different angles of the visualization
Responsive Design: Adapts seamlessly to different screen sizes
Technology Stack
Next.js: React framework for the UI
Three.js: 3D graphics rendering library
Web Audio API: For audio processing and frequency analysis
WebGL Shaders: Custom GLSL shaders for audio-reactive effects
dat.GUI: For intuitive parameter controls
Tailwind CSS: For styling the interface
How It Works
The application uses the Web Audio API to analyze audio frequencies in real-time, feeding this data into custom Three.js shaders that manipulate a 3D wireframe sphere. The visualization employs Perlin noise and displacement mapping to create organic, flowing movements that respond to the music's intensity and frequency patterns.

Post-processing effects like bloom enhance the visual experience, while a responsive camera allows users to explore the visualization from different perspectives.

Usage
Enter a YouTube URL or upload an MP3 file
Click "Visualize" to start the audio and visualization
Adjust the volume using the slider
Customize colors and visual effects using the GUI panel
Move your mouse to change the viewing angle
