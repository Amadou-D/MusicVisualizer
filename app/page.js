'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

export default function Home() {
  const mountRef = useRef(null);
  const audioRef = useRef(null);
  const urlInputRef = useRef(null);
  const audioElementRef = useRef(null);
  const volumeRef = useRef(null);
  const [audioSource, setAudioSource] = useState(null);
  const [sound, setSound] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [isFirefox, setIsFirefox] = useState(false);
  const listener = useRef(null);
  const audioContext = useRef(null);
  const mediaElementSource = useRef(null);
  const animationId = useRef(null);
  const audioSourceConnected = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect Firefox
      setIsFirefox(navigator.userAgent.toLowerCase().indexOf('firefox') > -1);
      
      // Initialize audio context on first user interaction - helps with Firefox
      const initAudio = () => {
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContext.current.state === 'suspended') {
            audioContext.current.resume().catch(err => console.log('Audio context resume error:', err));
          }
        }
        document.removeEventListener('click', initAudio);
      };
      document.addEventListener('click', initAudio, { once: true });
      
      listener.current = new THREE.AudioListener();
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);

      const handleResize = () => {
        setScreenWidth(window.innerWidth);
        setScreenHeight(window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      const params = {
        red: 1.0,
        green: 1.0,
        blue: 1.0,
        threshold: 0.5,
        strength: 0.5,
        radius: 0.8,
      };

      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const renderScene = new RenderPass(scene, camera);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight)
      );
      bloomPass.threshold = params.threshold;
      bloomPass.strength = params.strength;
      bloomPass.radius = params.radius;

      const bloomComposer = new EffectComposer(renderer);
      bloomComposer.addPass(renderScene);
      bloomComposer.addPass(bloomPass);

      const outputPass = new OutputPass();
      bloomComposer.addPass(outputPass);

      camera.position.set(0, -2, 14);
      camera.lookAt(0, 0, 0);

      const uniforms = {
        u_time: { type: 'f', value: 0.0 },
        u_frequency: { type: 'f', value: 0.0 },
        u_red: { type: 'f', value: 1.0 },
        u_green: { type: 'f', value: 1.0 },
        u_blue: { type: 'f', value: 1.0 },
      };

      const vertexShader = `
        uniform float u_time;
        uniform float u_frequency;

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
          return mod289(((x * 34.0) + 10.0) * x);
        }

        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
          return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
        }

        float pnoise(vec3 P, vec3 rep) {
          vec3 Pi0 = mod(floor(P), rep);
          vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P);
          vec3 Pf1 = Pf0 - vec3(1.0);
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;

          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);

          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);

          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);

          vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
          vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
          vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
          vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
          vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
          vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
          vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
          vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;

          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);

          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }

        void main() {
          float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
          float displacement = (u_frequency / 30.0) * (noise / 10.0);
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float u_red;
        uniform float u_green;
        uniform float u_blue;
        void main() {
          gl_FragColor = vec4(u_red, u_green, u_blue, 1.0);
        }
      `;

      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      });

      const geo = new THREE.IcosahedronGeometry(4, 30);
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      mesh.material.wireframe = true;

      camera.add(listener.current);

      const sound = new THREE.Audio(listener.current);
      setSound(sound);

      const analyser = new THREE.AudioAnalyser(sound, 32);
      setAnalyser(analyser);

      import('dat.gui').then((mod) => {
        const GUI = mod.GUI;
        const gui = new GUI();

        const colorsFolder = gui.addFolder('Colors');
        colorsFolder.add(params, 'red', 0, 1).onChange(function (value) {
          uniforms.u_red.value = Number(value);
        });
        colorsFolder.add(params, 'green', 0, 1).onChange(function (value) {
          uniforms.u_green.value = Number(value);
        });
        colorsFolder.add(params, 'blue', 0, 1).onChange(function (value) {
          uniforms.u_blue.value = Number(value);
        });

        const bloomFolder = gui.addFolder('Bloom');
        bloomFolder.add(params, 'threshold', 0, 1).onChange(function (value) {
          bloomPass.threshold = Number(value);
        });
        bloomFolder.add(params, 'strength', 0, 3).onChange(function (value) {
          bloomPass.strength = Number(value);
        });
        bloomFolder.add(params, 'radius', 0, 1).onChange(function (value) {
          bloomPass.radius = Number(value);
        });
      });

      let mouseX = 0;
      let mouseY = 0;
      document.addEventListener('mousemove', function (e) {
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        mouseX = (e.clientX - windowHalfX) / 100;
        mouseY = (e.clientY - windowHalfY) / 100;
      });

      const clock = new THREE.Clock();
      function animate() {
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.5;
        camera.lookAt(scene.position);
        uniforms.u_time.value = clock.getElapsedTime();
        uniforms.u_frequency.value = analyser.getAverageFrequency();
        bloomComposer.render();
        animationId.current = requestAnimationFrame(animate);
      }
      animate();

      window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        bloomComposer.setSize(window.innerWidth, window.innerHeight);
      });

      // Handle MP3 file input
      const handleMP3Input = (event) => {
        const file = event.target.files[0];
        if (file) {
          setLoading(true);
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            if (!audioContext.current) {
              audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume AudioContext if suspended (needed for Firefox)
            if (audioContext.current.state === 'suspended') {
              audioContext.current.resume();
            }
            
            audioContext.current.decodeAudioData(arrayBuffer, (buffer) => {
              sound.setBuffer(buffer);
              setAudioSource('mp3');
              setSongTitle(file.name);
              
              // Only hide loading spinner after audio has started playing
              sound.onEnded = function() {
                console.log('Audio playback ended');
              };
              
              // Play the sound and hide loading spinner once it's started
              sound.play();
              setLoading(false);
            });
          };
          reader.readAsArrayBuffer(file);
        }
      };

      const handleURLInput = async (event) => {
        const url = event.target.value;
        if (!url) return;
        
        setLoading(true);
        
        try {
          // Get video title first (this works across browsers)
          try {
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            setSongTitle(data.title || 'YouTube Audio');
          } catch (titleError) {
            console.warn('Could not fetch video title:', titleError);
            setSongTitle('YouTube Audio');
          }
          
          // Initialize audio context if needed
          if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          // Resume AudioContext if suspended
          if (audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
          }
          
          // Clean up any previous source connection
          if (mediaElementSource.current) {
            try {
              mediaElementSource.current.disconnect();
            } catch (e) {
              console.log('Nothing to disconnect:', e);
            }
            mediaElementSource.current = null;
          }
          
          // Reset audio element
          if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.removeAttribute('src');
            audioElementRef.current.load();
          }
          
          // Define event handlers
          const onCanPlay = () => {
            console.log('Audio can play now');
          };
          
          const onPlaying = () => {
            console.log('Audio is playing');
            setLoading(false);
          };
          
          const onError = (error) => {
            console.error('Error during audio playback:', error);
            setLoading(false);
            
            if (isFirefox) {
              alert('Firefox has stricter security policies. Try uploading an MP3 file directly instead of using YouTube.');
            } else {
              alert('There was an error playing the audio. Please try a different URL or upload an MP3 file.');
            }
          };
          
          // Clean up previous listeners
          const cleanupPreviousListeners = () => {
            if (audioElementRef.current) {
              audioElementRef.current.removeEventListener('canplay', onCanPlay);
              audioElementRef.current.removeEventListener('playing', onPlaying);
              audioElementRef.current.removeEventListener('error', onError);
            }
          };
          
          cleanupPreviousListeners();
          
          // Add cache-busting timestamp to prevent cached responses
          const timestamp = new Date().getTime();
          const proxyUrl = `http://musicserver-3uzw.onrender.com/audio?url=${encodeURIComponent(url)}&t=${timestamp}`;
          
          // Set up audio element
          audioElementRef.current.crossOrigin = "anonymous";
          audioElementRef.current.src = proxyUrl;
          
          // Add event listeners
          audioElementRef.current.addEventListener('canplay', onCanPlay);
          audioElementRef.current.addEventListener('playing', onPlaying);
          audioElementRef.current.addEventListener('error', onError);
          
          audioElementRef.current.load();
          
          // We'll delay creating the MediaElementSource until the user clicks Play
          audioSourceConnected.current = false;
          setAudioSource('youtube');
          setLoading(false);
          
        } catch (error) {
          console.error('Error setting up audio:', error);
          setLoading(false);
          alert('There was an error setting up the audio. Please try a different URL or upload an MP3 file.');
        }
      };
      
      audioRef.current.addEventListener('change', handleMP3Input);
      urlInputRef.current.addEventListener('change', handleURLInput);

      return () => {
        audioRef.current?.removeEventListener('change', handleMP3Input);
        urlInputRef.current?.removeEventListener('change', handleURLInput);
        
        // Clean up media connections
        if (mediaElementSource.current) {
          try {
            mediaElementSource.current.disconnect();
          } catch (e) {
            console.log('Nothing to disconnect on cleanup');
          }
        }
        
        if (mountRef.current && renderer.domElement) {
          try {
            mountRef.current.removeChild(renderer.domElement);
          } catch (e) {
            console.log('Unable to remove renderer');
          }
        }
        
        if (animationId.current) {
          cancelAnimationFrame(animationId.current);
        }
        
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('click', initAudio);
      };
    }
  }, []);

  const handlePlay = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setLoading(true);

    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Always resume the audio context first (critical for Firefox)
    audioContext.current.resume().then(() => {
      // Special handling for YouTube audio source
      if (audioSource === 'youtube' && !audioSourceConnected.current) {
        try {
          // Create MediaElementSource if not already created
          if (!mediaElementSource.current) {
            mediaElementSource.current = audioContext.current.createMediaElementSource(audioElementRef.current);
          }
          
          // Create and connect analyzer node
          const analyserNode = audioContext.current.createAnalyser();
          analyserNode.fftSize = 32;
          
          mediaElementSource.current.connect(analyserNode);
          mediaElementSource.current.connect(audioContext.current.destination);
          
          // Update the analyzer used by THREE.js
          analyser.analyser = analyserNode;
          
          audioSourceConnected.current = true;
          console.log('Audio connected to AnalyserNode on play');
        } catch (error) {
          console.error('Error connecting audio source:', error);
          // Continue with playback even if connection fails
        }
      }
      
      playAudio();
    }).catch(error => {
      console.error('Error resuming audio context:', error);
      setLoading(false);
      alert('Could not start audio playback. Please try again.');
    });
  };

  // Helper function to play audio and manage loading state
  const playAudio = () => {
    if (audioSource === 'mp3') {
      sound.play();
      setLoading(false);
    } else if (audioSource === 'youtube') {
      // For YouTube URLs, we'll rely on the 'playing' event to hide the spinner
      audioElementRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setLoading(false);
        
        if (isFirefox) {
          alert('Firefox has issues with YouTube streaming due to security policies. Please try uploading an MP3 file instead.');
        } else {
          alert('Could not play audio. Please try a different URL or upload an MP3 file.');
        }
      });
    } else {
      // No audio source selected
      setLoading(false);
      alert('Please enter a YouTube URL or upload an MP3 file first.');
    }
  };

  const handleVolumeChange = (event) => {
    if (typeof window === 'undefined') {
      return;
    }

    const volume = event.target.value;
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
    }
    if (sound) {
      sound.setVolume(volume);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 relative">
      <div id="visualizer-container" className="absolute top-0 left-0 w-full h-full -z-10"></div>
      
      {isFirefox && (
        <div className="mb-4 w-full max-w-md bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">Firefox Compatibility Notice</p>
          <p>YouTube streaming may not work properly in Firefox due to strict security policies. For best results:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Upload an MP3 file directly instead</li>
            <li>Always use the Visualize button after entering a URL</li>
            <li>Try Chrome or Edge for full YouTube support</li>
          </ul>
        </div>
      )}
      
      <div className="flex items-center mb-6 gap-4">
        {songTitle && <div className="song-title text-3xl">{songTitle}</div>}
        {loading && <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
      </div>
      
      <form className="mb-4 flex items-center space-x-2 text-gray-700">
        <input
          type="text"
          ref={urlInputRef}
          placeholder="Enter YouTube URL"
          className="p-2 border border-gray-300 rounded-l bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="button" 
          onClick={handlePlay} 
          className="p-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg shadow-md"
        >
          Visualize
        </button>
      </form>
      
      <div className="mb-4 w-full max-w-md">
        <label className="block text-white text-sm font-medium mb-2">Upload MP3 File</label>
        <input 
          type="file" 
          ref={audioRef} 
          accept="audio/*" 
          className="w-full bg-white p-2 border border-gray-300 text-gray-500 rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white" 
        />
      </div>
      
      <div className="mb-4 w-full max-w-md">
        <label className="block text-white text-sm font-medium mb-2">Volume</label>
        <input 
          type="range" 
          ref={volumeRef} 
          min="0" 
          max="1" 
          step="0.01" 
          defaultValue="1" 
          onChange={handleVolumeChange} 
          className="w-full bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>
      
      <div ref={mountRef} className="w-full h-full" />
      <audio 
        ref={audioElementRef} 
        style={{ display: 'none' }} 
        preload="auto" 
        playsInline
        crossOrigin="anonymous" 
      />
    </div>
  );        
}