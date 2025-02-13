'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
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
  const listener = new THREE.AudioListener();
  const audioContext = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

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

    camera.add(listener);

    const sound = new THREE.Audio(listener);
    setSound(sound);

    const analyser = new THREE.AudioAnalyser(sound, 32);
    setAnalyser(analyser);

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
      requestAnimationFrame(animate);
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
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target.result;
          if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          audioContext.current.decodeAudioData(arrayBuffer, (buffer) => {
            sound.setBuffer(buffer);
            setAudioSource('mp3');
          });
        };
        reader.readAsArrayBuffer(file);
      }
    };

    // Handle YouTube URL input
    const handleURLInput = (event) => {
      const url = event.target.value;
      if (url) {
        const proxyUrl = `http://localhost:3002/audio?url=${encodeURIComponent(url)}`;
        audioElementRef.current.src = proxyUrl;
        audioElementRef.current.crossOrigin = "anonymous"; // Set crossOrigin attribute
        audioElementRef.current.load();
        audioElementRef.current.play();
        setAudioSource('youtube');
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const source = audioContext.current.createMediaElementSource(audioElementRef.current);
        const analyserNode = audioContext.current.createAnalyser();
        analyserNode.fftSize = 32;
        source.connect(analyserNode);
        analyserNode.connect(audioContext.current.destination);
        sound.setMediaElementSource(audioElementRef.current);
        setAnalyser(analyserNode);
        console.log('Audio connected to AnalyserNode');
      }
    };

    audioRef.current.addEventListener('change', handleMP3Input);
    urlInputRef.current.addEventListener('change', handleURLInput);

    return () => {
      audioRef.current.removeEventListener('change', handleMP3Input);
      urlInputRef.current.removeEventListener('change', handleURLInput);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const handlePlay = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume().then(() => {
        if (audioSource === 'mp3') {
          sound.play();
        } else if (audioSource === 'youtube') {
          audioElementRef.current.play();
        }
      });
    } else {
      if (audioSource === 'mp3') {
        sound.play();
      } else if (audioSource === 'youtube') {
        audioElementRef.current.play();
      }
    }
  };

  const handleVolumeChange = (event) => {
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
      <form className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          ref={urlInputRef}
          placeholder="Enter YouTube URL"
          className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="button" onClick={handlePlay} className="p-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg shadow-md">
          Visualize
        </button>
      </form>
      <input type="file" ref={audioRef} accept="audio/*" className="mb-4 bg-white p-2 border border-gray-300 rounded-lg shadow-sm" />
      <input type="range" ref={volumeRef} min="0" max="1" step="0.01" defaultValue="1" onChange={handleVolumeChange} className="w-64 mb-4 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div ref={mountRef} className="w-full h-full" />
      <audio ref={audioElementRef} style={{ display: 'none' }} />
    </div>
  );
}