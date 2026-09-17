'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const OceanVesselHero: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0F7FF); // Daylight clear maritime sky tone
    scene.fog = new THREE.FogExp2(0xE8F2FC, 0.008);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(40, 22, 60);
    camera.lookAt(0, 4, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup (Realistic daylight maritime sun & ocean reflections)
    const ambientLight = new THREE.AmbientLight(0xd4e9ff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.5);
    sunLight.position.set(80, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const oceanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    oceanRimLight.position.set(-60, 20, -50);
    scene.add(oceanRimLight);

    // 5. Realistic Ocean Geometry & Material
    const oceanGeometry = new THREE.PlaneGeometry(350, 350, 120, 120);
    oceanGeometry.rotateX(-Math.PI / 2);

    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x034b75, // Deep ocean sapphire
      roughness: 0.15,
      metalness: 0.8,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    // Store original positions for wave animation
    const positionAttribute = oceanGeometry.attributes.position;
    const initialPositions = positionAttribute.array.slice();

    // 6. Detailed Procedural Container Ship Model Group
    const shipGroup = new THREE.Group();

    // Main Hull (Dark navy/black anti-fouling red bottom)
    const hullGeometry = new THREE.BoxGeometry(14, 5, 52);
    // Taper the bow
    const pos = hullGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      // Bow tapering at front (z > 14)
      if (z > 14) {
        const factor = (z - 14) / 12;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.65));
      }
      // Stern tapering at rear (z < -18)
      if (z < -18) {
        const factor = (-18 - z) / 8;
        pos.setX(i, pos.getX(i) * (1 - factor * 0.25));
      }
    }
    hullGeometry.computeVertexNormals();

    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep charcoal navy hull
      roughness: 0.4,
      metalness: 0.2,
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.y = 2.5;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);

    // Red water-line keel
    const keelGeo = new THREE.BoxGeometry(13.8, 1.2, 50);
    const keelMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const keelMesh = new THREE.Mesh(keelGeo, keelMat);
    keelMesh.position.y = 0.5;
    shipGroup.add(keelMesh);

    // Bridge / Accommodations superstructure (Tower)
    const towerGeo = new THREE.BoxGeometry(10, 9, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(0, 8.5, -12);
    towerMesh.castShadow = true;
    shipGroup.add(towerMesh);

    // Navigation bridge wings
    const wingsGeo = new THREE.BoxGeometry(14, 1.5, 3);
    const wingsMesh = new THREE.Mesh(wingsGeo, towerMat);
    wingsMesh.position.set(0, 12, -12);
    shipGroup.add(wingsMesh);

    // Bridge windows (Dark glass)
    const windowGeo = new THREE.BoxGeometry(13.8, 0.8, 0.2);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.set(0, 12.2, -10.4);
    shipGroup.add(windowMesh);

    // Exhaust Funnel / Chimney
    const funnelGeo = new (THREE as any).CylinderGeometry(1.2, 1.4, 6, 16);
    const funnelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const funnelMesh = new THREE.Mesh(funnelGeo, funnelMat);
    funnelMesh.position.set(0, 14.5, -17);
    shipGroup.add(funnelMesh);

    // Radar Mast
    const mastGeo = new (THREE as any).CylinderGeometry(0.15, 0.2, 5);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 15, -12);
    shipGroup.add(mastMesh);


    // Realistic Container Stacks
    const containerColors = [
      0x0284c7, // Ocean Blue
      0x0369a1, // Deep Blue
      0x047857, // Evergreen Green
      0xb91c1c, // Crimson Red
      0xd97706, // Hapag Amber
      0x475569, // Slate Grey
      0x334155, // Dark Navy
    ];

    const boxGeo = new THREE.BoxGeometry(2.2, 2.2, 6.2);
    const rows = 4; // side-by-side
    const stacks = 4; // vertical height
    const bays = 4; // length-wise bays

    for (let b = 0; b < bays; b++) {
      const zPos = -4 + b * 6.6;
      for (let r = 0; r < rows; r++) {
        const xPos = -4.5 + r * 3.0;
        const currentStackHeight = b === 3 ? stacks - 1 : stacks;
        for (let s = 0; s < currentStackHeight; s++) {
          const yPos = 5.8 + s * 2.3;
          const color = containerColors[(b * 5 + r * 3 + s) % containerColors.length];
          const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
          const containerBox = new THREE.Mesh(boxGeo, mat);
          containerBox.position.set(xPos, yPos, zPos);
          containerBox.castShadow = true;
          containerBox.receiveShadow = true;
          shipGroup.add(containerBox);
        }
      }
    }

    shipGroup.position.set(0, 0, 0);
    scene.add(shipGroup);

    // 7. Glowing Navigational Route Line on Ocean
    const routeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-80, 0.5, -90),
      new THREE.Vector3(-40, 0.5, -40),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(45, 0.5, 55),
      new THREE.Vector3(95, 0.5, 110),
    ]);
    const routeGeo = new THREE.TubeGeometry(routeCurve, 64, 0.4, 8, false);
    const routeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const routeMesh = new THREE.Mesh(routeGeo, routeMat);
    scene.add(routeMesh);

    // 8. Navigation Waypoint Buoys / Beacons
    const buoyPoints = [
      new THREE.Vector3(-40, 1, -40),
      new THREE.Vector3(45, 1, 55),
    ];
    buoyPoints.forEach((pt) => {
      const bGeo = new (THREE as any).CylinderGeometry(0.6, 0.8, 2.5, 8);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
      const bMesh = new THREE.Mesh(bGeo, bMat);

      bMesh.position.copy(pt);
      scene.add(bMesh);

      // Flashing light beacon
      const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lightSphere = new THREE.Mesh(lightGeo, lightMat);
      lightSphere.position.set(pt.x, pt.y + 1.6, pt.z);
      scene.add(lightSphere);
    });

    // 9. Floating Maritime Data Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 150;
      particlePositions[i + 1] = Math.random() * 25 + 1;
      particlePositions[i + 2] = (Math.random() - 0.5) * 150;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    setIsLoaded(true);

    // Interactive mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / height) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate Realistic Ocean Waves
      const positions = oceanGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = initialPositions[i * 3];
        const z = initialPositions[i * 3 + 2];
        const wave1 = Math.sin(x * 0.05 + elapsedTime * 1.5) * 0.8;
        const wave2 = Math.cos(z * 0.06 + elapsedTime * 1.2) * 0.8;
        const wave3 = Math.sin((x + z) * 0.03 + elapsedTime * 0.8) * 0.4;
        positions.setY(i, wave1 + wave2 + wave3);
      }
      positions.needsUpdate = true;
      oceanGeometry.computeVertexNormals();

      // Ship Pitching and Rolling with Ocean Motion
      shipGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.4 + 0.2;
      shipGroup.rotation.z = Math.sin(elapsedTime * 1.1) * 0.025; // Roll
      shipGroup.rotation.x = Math.cos(elapsedTime * 0.9) * 0.015; // Pitch

      // Slow cinematic camera float with subtle mouse parallax
      const targetCamX = 40 + mouseX * 8;
      const targetCamY = 22 + mouseY * 4;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 4, 0);

      // Slowly rotate particles
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="glass-card px-3 py-1.5 rounded-xl border border-white/60 text-slate-800 text-[11px] font-mono flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE AIS VESSEL SIMULATION • 17.8 KTS</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="glass-card px-3.5 py-2 rounded-xl border border-white/60 text-slate-700 text-xs shadow-sm">
          <p className="font-semibold text-slate-900">Cape of Good Hope Mainlane</p>
          <p className="text-[10px] text-slate-500">Route SHA → RTM • 13,850 nm</p>
        </div>
      </div>
    </div>
  );
};
