'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const OceanVesselHero: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth || 600;
    let height = container.clientHeight || 500;

    // --- 1. Scene Setup & Atmospheric Fog ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f7ff); // Daylight clear maritime sky tone
    scene.fog = new THREE.FogExp2(0xe8f2fc, 0.0055);

    // --- 2. Camera Setup ---
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    // Initial cinematic perspective viewing the vessel from three-quarter bow angle
    const initialCamPos = new THREE.Vector3(46, 24, 62);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, 5, 2);

    // --- 3. WebGL Renderer with Performance Optimizations ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL initialization fallback triggered:', e);
      setHasWebGlError(true);
      return;
    }

    renderer.setSize(width, height);
    // Cap pixel ratio to 1.5 to maximize battery life and frame rates on mobile Retina/4K screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- 4. Cinematic Maritime Lighting Setup ---
    // Ambient fill simulating sky diffuse light
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.25);
    scene.add(ambientLight);

    // Primary Sun: directional warm sunlight with realistic shadows
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.7);
    sunLight.position.set(70, 95, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    const shadowDist = 45;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Ocean Rim / Back Light: gives crisp blue specular highlights to hull curves & water
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-65, 25, -60);
    scene.add(rimLight);

    // Sea bounce light (upward bounce from water onto the ship hull)
    const seaBounceLight = new THREE.DirectionalLight(0x0284c7, 0.45);
    seaBounceLight.position.set(0, -20, 0);
    scene.add(seaBounceLight);

    // --- 5. Dynamic Procedural Ocean Mesh ---
    const oceanWidth = 380;
    const oceanHeight = 380;
    const oceanSegments = 100;
    const oceanGeometry = new THREE.PlaneGeometry(oceanWidth, oceanHeight, oceanSegments, oceanSegments);
    oceanGeometry.rotateX(-Math.PI / 2);

    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x025a8e, // Deep maritime azure
      roughness: 0.16,
      metalness: 0.65,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    // Store base positions for harmonic wave calculations
    const oceanPosAttr = oceanGeometry.attributes.position;
    const oceanBasePositions = new Float32Array(oceanPosAttr.array);

    // --- 6. Realistic 3D Container Vessel Model ---
    const shipGroup = new THREE.Group();

    // Reusable Materials
    const hullTopsidesMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep industrial navy hull
      roughness: 0.35,
      metalness: 0.25,
    });
    const underwaterKeelMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Anti-fouling maritime oxide red
      roughness: 0.5,
      metalness: 0.15,
    });
    const waterlineStripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Waterline boot-topping stripe
      roughness: 0.4,
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Steel deck gray
      roughness: 0.6,
      metalness: 0.2,
    });
    const superstructureMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Marine white deckhouse
      roughness: 0.25,
      metalness: 0.1,
    });
    const bridgeGlassMat = new THREE.MeshStandardMaterial({
      color: 0x075985, // Tinted observation windows
      roughness: 0.08,
      metalness: 0.92,
    });
    const funnelBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Carrier blue funnel casing
      roughness: 0.35,
      metalness: 0.3,
    });
    const mastMetalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.6,
    });
    const lifeboatOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // High-visibility SOLAS safety orange
      roughness: 0.4,
    });

    // --- A. Main Topsides Hull with Hydrodynamic Bow & Stern Tapering ---
    const hullLength = 58;
    const hullBeam = 14;
    const hullHeight = 5.2;
    const hullSegmentsZ = 48;
    const hullGeo = new THREE.BoxGeometry(hullBeam, hullHeight, hullLength, 6, 2, hullSegmentsZ);

    // Sculpt realistic bow flare and stern tuck
    const hPos = hullGeo.attributes.position;
    for (let i = 0; i < hPos.count; i++) {
      let x = hPos.getX(i);
      let y = hPos.getY(i);
      let z = hPos.getZ(i);

      // Bow taper & hydrodynamic wedge (forward: z > 10)
      if (z > 10) {
        const bowFactor = (z - 10) / (hullLength / 2 - 10);
        // Taper sides towards bow stem
        x *= Math.max(0.08, 1 - Math.pow(bowFactor, 1.25) * 0.88);
        // Add subtle flare (widens slightly at top of bow)
        if (y > 0) {
          x *= 1 + (y / hullHeight) * bowFactor * 0.22;
        }
        // Sheer line: lift forecastle slightly towards bow
        y += Math.pow(bowFactor, 2) * 1.6;
      }

      // Stern taper & rounded cruiser transom (aft: z < -16)
      if (z < -16) {
        const sternFactor = (-16 - z) / (hullLength / 2 - 16);
        x *= Math.max(0.35, 1 - Math.pow(sternFactor, 1.5) * 0.48);
        if (y < 0) {
          y += Math.pow(sternFactor, 1.8) * 0.9;
        }
      }

      // Bottom hull deadrise: narrow at bottom of hull
      if (y < 0) {
        const bottomFactor = -y / (hullHeight / 2);
        x *= 1 - bottomFactor * 0.14;
      }

      hPos.setXYZ(i, x, y, z);
    }
    hullGeo.computeVertexNormals();

    const hullMesh = new THREE.Mesh(hullGeo, hullTopsidesMat);
    hullMesh.position.y = 3.0;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    shipGroup.add(hullMesh);

    // --- B. Anti-Fouling Red Underwater Hull & Keel ---
    const keelGeo = new THREE.BoxGeometry(hullBeam * 0.88, 2.0, hullLength * 0.94, 6, 1, 32);
    const kPos = keelGeo.attributes.position;
    for (let i = 0; i < kPos.count; i++) {
      let x = kPos.getX(i);
      let z = kPos.getZ(i);
      if (z > 8) {
        const factor = (z - 8) / (hullLength * 0.47 - 8);
        x *= Math.max(0.1, 1 - Math.pow(factor, 1.3) * 0.85);
      }
      if (z < -14) {
        const factor = (-14 - z) / (hullLength * 0.47 - 14);
        x *= Math.max(0.4, 1 - factor * 0.5);
      }
      kPos.setX(i, x);
    }
    keelGeo.computeVertexNormals();
    const keelMesh = new THREE.Mesh(keelGeo, underwaterKeelMat);
    keelMesh.position.y = 0.4;
    keelMesh.receiveShadow = true;
    shipGroup.add(keelMesh);

    // Bulbous Bow (protrusion under waterline to reduce drag)
    const bulbousGeo = new THREE.SphereGeometry(2.0, 16, 16);
    bulbousGeo.scale(0.85, 0.9, 2.6);
    const bulbousMesh = new THREE.Mesh(bulbousGeo, underwaterKeelMat);
    bulbousMesh.position.set(0, 0.4, hullLength / 2 - 0.5);
    shipGroup.add(bulbousMesh);

    // Waterline Boot-topping Stripe
    const stripeGeo = new THREE.BoxGeometry(hullBeam * 0.98, 0.35, hullLength * 0.98);
    const stripeMesh = new THREE.Mesh(stripeGeo, waterlineStripeMat);
    stripeMesh.position.y = 1.35;
    shipGroup.add(stripeMesh);

    // Main Deck Plating & Hold Coamings
    const deckGeo = new THREE.BoxGeometry(hullBeam * 0.94, 0.4, hullLength * 0.94);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = 5.65;
    deckMesh.receiveShadow = true;
    shipGroup.add(deckMesh);

    // Forecastle Wave Deflector / Breakwater (V-shaped shield on bow)
    const breakwaterShape = new THREE.Shape();
    breakwaterShape.moveTo(-3.5, 0);
    breakwaterShape.lineTo(0, 3.5);
    breakwaterShape.lineTo(3.5, 0);
    breakwaterShape.lineTo(2.8, 0);
    breakwaterShape.lineTo(0, 2.8);
    breakwaterShape.lineTo(-2.8, 0);
    breakwaterShape.closePath();
    const breakwaterGeo = new THREE.ExtrudeGeometry(breakwaterShape, { depth: 0.8, bevelEnabled: false });
    breakwaterGeo.rotateX(Math.PI / 2);
    const breakwaterMesh = new THREE.Mesh(breakwaterGeo, superstructureMat);
    breakwaterMesh.position.set(0, 6.2, hullLength / 2 - 7.5);
    breakwaterMesh.castShadow = true;
    shipGroup.add(breakwaterMesh);

    // --- C. Detailed Superstructure / Navigation Bridge ---
    // Tier 1: Lower Accommodations & Crew Quarters
    const deckhouseT1Geo = new THREE.BoxGeometry(10.5, 3.6, 9.0);
    const deckhouseT1 = new THREE.Mesh(deckhouseT1Geo, superstructureMat);
    deckhouseT1.position.set(0, 7.5, -12.5);
    deckhouseT1.castShadow = true;
    deckhouseT1.receiveShadow = true;
    shipGroup.add(deckhouseT1);

    // Tier 2: Mid Accommodations Block
    const deckhouseT2Geo = new THREE.BoxGeometry(9.5, 3.0, 8.0);
    const deckhouseT2 = new THREE.Mesh(deckhouseT2Geo, superstructureMat);
    deckhouseT2.position.set(0, 10.8, -12.5);
    deckhouseT2.castShadow = true;
    deckhouseT2.receiveShadow = true;
    shipGroup.add(deckhouseT2);

    // Tier 3: Wheelhouse / Navigation Bridge
    const bridgeGeo = new THREE.BoxGeometry(9.0, 2.4, 6.5);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, superstructureMat);
    bridgeMesh.position.set(0, 13.5, -12.5);
    bridgeMesh.castShadow = true;
    shipGroup.add(bridgeMesh);

    // Extended Bridge Wings (Projecting outward past the hull beam)
    const wingsGeo = new THREE.BoxGeometry(hullBeam + 2.4, 1.3, 3.2);
    const wingsMesh = new THREE.Mesh(wingsGeo, superstructureMat);
    wingsMesh.position.set(0, 13.6, -12.5);
    wingsMesh.castShadow = true;
    shipGroup.add(wingsMesh);

    // Wrap-Around Tinted Bridge Windows
    const bridgeWindowGeo = new THREE.BoxGeometry(hullBeam + 2.2, 0.75, 3.3);
    const bridgeWindowMesh = new THREE.Mesh(bridgeWindowGeo, bridgeGlassMat);
    bridgeWindowMesh.position.set(0, 13.8, -12.5);
    shipGroup.add(bridgeWindowMesh);

    // Bridge Wing Port & Starboard Navigation LED Lights
    const navLightGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const portLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red (Port / Left)
    const portLight = new THREE.Mesh(navLightGeo, portLightMat);
    portLight.position.set(-(hullBeam + 2.4) / 2, 13.8, -12.5);
    shipGroup.add(portLight);

    const stbdLightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Green (Starboard / Right)
    const stbdLight = new THREE.Mesh(navLightGeo, stbdLightMat);
    stbdLight.position.set((hullBeam + 2.4) / 2, 13.8, -12.5);
    shipGroup.add(stbdLight);

    // Main Radar & Communications Mast
    const mastMainGeo = new THREE.CylinderGeometry(0.2, 0.35, 7.0, 8);
    const mastMain = new THREE.Mesh(mastMainGeo, mastMetalMat);
    mastMain.position.set(0, 17.8, -12.5);
    mastMain.castShadow = true;
    shipGroup.add(mastMain);

    // Radar Cross-Trees
    const crossTreeGeo = new THREE.BoxGeometry(4.2, 0.2, 0.3);
    const crossTree = new THREE.Mesh(crossTreeGeo, mastMetalMat);
    crossTree.position.set(0, 18.5, -12.5);
    shipGroup.add(crossTree);

    // Rotating Radar Scanners (animated in loop)
    const radarGeo = new THREE.BoxGeometry(2.4, 0.25, 0.4);
    const radarScanner = new THREE.Mesh(radarGeo, mastMetalMat);
    radarScanner.position.set(0, 20.2, -12.5);
    shipGroup.add(radarScanner);

    const radarTopGeo = new THREE.BoxGeometry(1.6, 0.2, 0.3);
    const radarTop = new THREE.Mesh(radarTopGeo, mastMetalMat);
    radarTop.position.set(0, 21.2, -12.5);
    shipGroup.add(radarTop);

    // Satellite Communication Radomes (White Domes)
    const radomeGeo = new THREE.SphereGeometry(0.65, 12, 12);
    const radome1 = new THREE.Mesh(radomeGeo, superstructureMat);
    radome1.position.set(-2.2, 15.3, -11.0);
    shipGroup.add(radome1);

    const radome2 = new THREE.Mesh(radomeGeo, superstructureMat);
    radome2.position.set(2.2, 15.3, -11.0);
    shipGroup.add(radome2);

    // Exhaust Funnel / Twin Stacks (Aft of Bridge)
    const funnelGeo = new THREE.CylinderGeometry(1.4, 1.8, 6.5, 16);
    funnelGeo.scale(1.2, 1.0, 0.85); // Aerodynamic oval
    const funnelMesh = new THREE.Mesh(funnelGeo, funnelBlueMat);
    funnelMesh.position.set(0, 14.5, -19.0);
    funnelMesh.castShadow = true;
    shipGroup.add(funnelMesh);

    // Funnel Top Exhaust Pipes
    const exhaustGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.6, 8);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const exhaust1 = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust1.position.set(-0.55, 17.8, -19.0);
    shipGroup.add(exhaust1);

    const exhaust2 = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust2.position.set(0.55, 17.8, -19.0);
    shipGroup.add(exhaust2);

    // Free-Fall Stern Lifeboat (Safety Orange, mounted at 45° angle)
    const lifeboatGeo = new THREE.BoxGeometry(1.6, 1.4, 3.8);
    const lifeboat = new THREE.Mesh(lifeboatGeo, lifeboatOrangeMat);
    lifeboat.position.set(0, 6.8, -25.5);
    lifeboat.rotation.x = Math.PI / 4.5;
    lifeboat.castShadow = true;
    shipGroup.add(lifeboat);

    // Stern Mooring Winches
    const winchGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
    const winchMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const winch1 = new THREE.Mesh(winchGeo, winchMat);
    winch1.position.set(-3.5, 6.2, -24.5);
    shipGroup.add(winch1);
    const winch2 = new THREE.Mesh(winchGeo, winchMat);
    winch2.position.set(3.5, 6.2, -24.5);
    shipGroup.add(winch2);

    // --- D. Multi-Carrier Shipping Container Stacks & Lashing Towers ---
    const containerColors = [
      0x0284c7, // Maersk Light Cyan
      0x0369a1, // Deep Marine Blue
      0x047857, // Evergreen Emerald Green
      0xb91c1c, // K-Line / NYK Crimson
      0xd97706, // Hapag-Lloyd Orange-Amber
      0xeab308, // MSC Golden Yellow
      0x334155, // Dark Steel Gray
      0x475569, // Medium Slate
      0xbe123c, // ONE Magenta
    ];

    const boxGeo = new THREE.BoxGeometry(2.35, 2.3, 6.2);
    const rows = 4; // side-by-side columns
    const maxTiers = 4; // vertical stacking tiers

    // 5 Cargo Hold Bays (Bays 1-4 forward of bridge, Bay 5 aft)
    const bayZPositions = [18.5, 11.5, 4.5, -2.5, -24.5];

    for (let b = 0; b < bayZPositions.length; b++) {
      const zPos = bayZPositions[b];
      const isBowBay = b === 0;
      const isAftBay = b === 4;

      for (let r = 0; r < rows; r++) {
        const xPos = -4.5 + r * 3.0;

        // Realistic container distribution: outer stacks lower for vessel stability & visibility
        let stackHeight = maxTiers;
        if (isBowBay) {
          stackHeight = (r === 0 || r === rows - 1) ? 2 : 3;
        } else if (isAftBay) {
          stackHeight = (r === 0 || r === rows - 1) ? 1 : 2;
        } else {
          stackHeight = (r === 0 || r === rows - 1) ? maxTiers - 1 : maxTiers;
        }

        for (let s = 0; s < stackHeight; s++) {
          const yPos = 6.95 + s * 2.35;
          const color = containerColors[(b * 7 + r * 4 + s * 3) % containerColors.length];
          const cMat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.45,
            metalness: 0.18,
          });

          const containerMesh = new THREE.Mesh(boxGeo, cMat);
          containerMesh.position.set(xPos, yPos, zPos);
          containerMesh.castShadow = true;
          containerMesh.receiveShadow = true;
          shipGroup.add(containerMesh);
        }
      }

      // Vertical Lashing Bridge Frames between bays
      if (b < bayZPositions.length - 1 && b !== 3) {
        const lashingFrameGeo = new THREE.BoxGeometry(11.2, 7.5, 0.4);
        const lashingMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          wireframe: false,
          roughness: 0.7,
        });
        const lashingMesh = new THREE.Mesh(lashingFrameGeo, lashingMat);
        lashingMesh.position.set(0, 9.4, zPos - 3.5);
        lashingMesh.castShadow = true;
        shipGroup.add(lashingMesh);
      }
    }

    // --- E. Stern Propeller Wake & Foam Geometry ---
    const wakeGeo = new THREE.PlaneGeometry(16, 75, 12, 36);
    wakeGeo.rotateX(-Math.PI / 2);
    // Taper wake outward from stern
    const wPos = wakeGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const z = wPos.getZ(i);
      const distFromStern = -z;
      if (distFromStern > 0) {
        const factor = 1 + (distFromStern / 75) * 2.2;
        wPos.setX(i, wPos.getX(i) * factor);
      }
    }
    wakeGeo.computeVertexNormals();

    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
    wakeMesh.position.set(0, 0.08, -hullLength / 2 - 37);
    shipGroup.add(wakeMesh);

    // Initial position in scene
    shipGroup.position.set(0, 0, 0);
    scene.add(shipGroup);

    // --- 7. Glowing Navigational Corridor Trajectory ---
    const routeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-95, 0.6, -110),
      new THREE.Vector3(-55, 0.6, -55),
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(55, 0.6, 65),
      new THREE.Vector3(110, 0.6, 130),
    ]);
    const routeGeo = new THREE.TubeGeometry(routeCurve, 72, 0.45, 8, false);
    const routeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const routeMesh = new THREE.Mesh(routeGeo, routeMat);
    scene.add(routeMesh);

    // Navigation Waypoint Beacons
    const waypointCoords = [
      new THREE.Vector3(-55, 1.2, -55),
      new THREE.Vector3(55, 1.2, 65),
    ];
    waypointCoords.forEach((pt) => {
      const buoyGeo = new THREE.CylinderGeometry(0.7, 0.9, 2.8, 8);
      const buoyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
      const buoyMesh = new THREE.Mesh(buoyGeo, buoyMat);
      buoyMesh.position.copy(pt);
      scene.add(buoyMesh);

      // Flashing Light Beacon
      const lightGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lightSphere = new THREE.Mesh(lightGeo, lightMat);
      lightSphere.position.set(pt.x, pt.y + 1.8, pt.z);
      scene.add(lightSphere);
    });

    // --- 8. Ambient Maritime Atmosphere Particles ---
    const particleCount = 90;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 160;
      particlePositions[i + 1] = Math.random() * 22 + 2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.75,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    setIsLoaded(true);

    // --- 9. Mouse & Touch Parallax Tracking with Smooth Lerp ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const updateCoordinates = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-1, Math.min(1, nx));
      mouse.targetY = Math.max(-1, Math.min(1, ny));
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateCoordinates(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        updateCoordinates(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // --- 10. Responsive Resize Observer ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // --- 11. Performance Optimization: Pause Rendering Off-Screen ---
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
      }
    }, { threshold: 0.1 });
    intersectionObserver.observe(container);

    // --- 12. Realistic Continuous Animation Loop ---
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return; // Save 100% GPU/CPU when scrolled away

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth exponential lerp for mouse/touch parallax
      mouse.x += (mouse.targetX - mouse.x) * (delta * 3.5);
      mouse.y += (mouse.targetY - mouse.y) * (delta * 3.5);

      // A. Procedural Dynamic Ocean Waves (Harmonic swell synthesis)
      const posAttr = oceanGeometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const ox = oceanBasePositions[i * 3];
        const oz = oceanBasePositions[i * 3 + 2];

        // Primary rolling ocean swell
        const swell1 = Math.sin(ox * 0.045 + elapsedTime * 1.6) * 0.85;
        const swell2 = Math.cos(oz * 0.055 + elapsedTime * 1.25) * 0.75;
        // Secondary cross-chop
        const chop = Math.sin((ox + oz) * 0.028 + elapsedTime * 0.95) * 0.4;
        // High-frequency surface ripples
        const ripples = Math.cos((ox * 0.12 - oz * 0.09) + elapsedTime * 2.2) * 0.15;

        // Bow wave interaction (disturbance near vessel coordinates)
        let bowWave = 0;
        const dx = ox;
        const dz = oz - 15;
        const distToBow = Math.sqrt(dx * dx + dz * dz);
        if (distToBow < 28) {
          bowWave = Math.sin(distToBow * 0.35 - elapsedTime * 3.0) * (1.0 - distToBow / 28) * 0.45;
        }

        posAttr.setY(i, swell1 + swell2 + chop + ripples + bowWave);
      }
      posAttr.needsUpdate = true;
      oceanGeometry.computeVertexNormals();

      // B. Realistic Multi-Axis Vessel Movement (Hydrodynamic bobbing & steering tilt)
      // Heave (vertical oceanic swell bobbing)
      const heave = Math.sin(elapsedTime * 1.5) * 0.42 + 0.18;
      shipGroup.position.y = heave;

      // Roll (side-to-side pendulum sway + responsive cursor steering roll)
      const naturalRoll = Math.sin(elapsedTime * 1.15) * 0.028;
      const interactiveRoll = mouse.x * 0.045; // Banks subtly towards cursor
      shipGroup.rotation.z = naturalRoll + interactiveRoll;

      // Pitch (bow rises and dips in oncoming swells + cursor pitch influence)
      const naturalPitch = Math.cos(elapsedTime * 0.95) * 0.018;
      const interactivePitch = mouse.y * 0.025;
      shipGroup.rotation.x = naturalPitch + interactivePitch;

      // Yaw (gentle compass heading sway)
      shipGroup.rotation.y = Math.sin(elapsedTime * 0.45) * 0.012 + mouse.x * 0.035;

      // C. Rotating Radar Scanners (45 RPM)
      radarScanner.rotation.y = elapsedTime * 4.8;
      radarTop.rotation.y = -elapsedTime * 3.6;

      // D. Pulsing Stern Wake & Water Foam
      wakeMesh.material.opacity = 0.35 + Math.sin(elapsedTime * 2.8) * 0.08;

      // E. Dynamic Camera Parallax Float
      const targetCamX = initialCamPos.x + mouse.x * 12.0;
      const targetCamY = initialCamPos.y + mouse.y * 6.5;
      camera.position.x += (targetCamX - camera.position.x) * (delta * 2.0);
      camera.position.y += (targetCamY - camera.position.y) * (delta * 2.0);
      camera.lookAt(0, 4.5 + mouse.y * 1.5, 2);

      // F. Drifting Atmosphere Particles
      particles.rotation.y = elapsedTime * 0.018;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // --- 13. Comprehensive Resource Disposal & Teardown ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      cancelAnimationFrame(animId);

      // Deep clean scene geometries and materials to eliminate WebGL memory leaks
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (hasWebGlError) {
    return (
      <div className="relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-gradient-to-b from-sky-50 to-slate-100 flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
            <span className="text-xl">🚢</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Maritime Telemetry Active</h4>
          <p className="text-xs text-slate-500">
            Real-time AIS position tracking active for Cape of Good Hope Mainlane corridor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-gradient-to-b from-sky-50 to-slate-100 select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Telemetry Overlay (Preserved Exact UI & Badges) */}
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

