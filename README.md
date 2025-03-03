# Music Visualizer

A real-time 3D music visualization web application built with Next.js and Three.js that transforms your audio into stunning interactive visuals.

![Music Visualizer Demo] https://music-visualizeer.vercel.app/

## Introduction

This application creates an immersive, audio-reactive 3D environment where a wireframe sphere responds dynamically to music frequencies. Users can visualize audio from YouTube URLs or upload their own MP3 files for a personalized experience.

## Features

- **Interactive 3D Visualization**: A wireframe sphere that pulses and morphs to audio frequencies
- **Dual Audio Sources**: Support for both YouTube URLs and MP3 file uploads
- **Real-time Audio Analysis**: Using Web Audio API to analyze frequency data
- **Customizable Visual Settings**: Adjust colors, bloom effects, and visual parameters on the fly
- **Mouse-controlled Camera**: Move your mouse to explore different angles of the visualization
- **Responsive Design**: Adapts seamlessly to different screen sizes

## Technology Stack

- **Next.js**: React framework for the UI
- **Three.js**: 3D graphics rendering library
- **Web Audio API**: For audio processing and frequency analysis
- **WebGL Shaders**: Custom GLSL shaders for audio-reactive effects
- **dat.GUI**: For intuitive parameter controls
- **Tailwind CSS**: For styling the interface

## Getting Started

These instructions will help you set up the project locally for development and testing purposes.

### Prerequisites

- Node.js 16.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MusicVisualizer.git
   cd MusicVisualizer

2.  Install dependencies:
npm install
# or
yarn install
3. Start the development server:
npm run dev
# or
yarn dev
