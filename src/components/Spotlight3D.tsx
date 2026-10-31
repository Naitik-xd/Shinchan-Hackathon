import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

interface Spotlight3DProps {
  isDarkTheme?: boolean;
}

export const Spotlight3D: React.FC<Spotlight3DProps> = ({ isDarkTheme = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
        alpha: true,
      });
    } catch {
      setWebGlAvailable(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Scene and Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.8, 4.2);

    // PMREM Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio lighting rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2.5, 3.5, 2.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.2);
    fillLight.position.set(-2.5, -1, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.0);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // --- Hero 3D Composite Subject: The Lumen Revealer Orb ---
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 1. Core "Dark Spot" sphere (Internal core that absorbs light)
    const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x0f172a : 0x1e1b4b,
      roughness: 0.8,
      metalness: 0.3,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(coreMesh);

    // 2. Optical Glass Shell (Refracting spotlight sphere)
    const shellGeo = new THREE.SphereGeometry(0.88, 36, 36);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.95,
      ior: 1.52,
      thickness: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    orbGroup.add(shellMesh);

    // 3. Floating Astrolabe / Orbital Ring (Precision alignment markers)
    const ringGeo = new THREE.TorusGeometry(1.22, 0.025, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x4338ca,
      emissiveIntensity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    orbGroup.add(ringMesh);

    // 4. Secondary Counter-Orbital Ring
    const ring2Geo = new THREE.TorusGeometry(1.36, 0.015, 16, 64);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.2,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 4;
    orbGroup.add(ring2Mesh);

    // 5. Stylized Spotlight Cone (Emitting illuminating rays onto the dark spot)
    const coneGeo = new THREE.ConeGeometry(0.9, 1.8, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, 0.9, 0);
    coneMesh.rotation.x = Math.PI;
    orbGroup.add(coneMesh);

    // Subtle floating dust particles
    const particleCount = isSoftwareGl ? 20 : 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3;
      particlePositions[i + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa5b4fc,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove);

    // Render loop
    let animId = 0;
    let clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        orbGroup.rotation.y += delta * 0.4;
        ringMesh.rotation.z += delta * 0.25;
        ring2Mesh.rotation.x += delta * 0.3;
        particles.rotation.y = time * 0.05;

        // Smooth exponential damping toward mouse target
        orbGroup.rotation.x = THREE.MathUtils.damp(orbGroup.rotation.x, targetY * 0.4, 4, delta);
        orbGroup.rotation.z = THREE.MathUtils.damp(orbGroup.rotation.z, -targetX * 0.4, 4, delta);

        // Gentle vertical levitation bob
        orbGroup.position.y = Math.sin(time * 1.5) * 0.08;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    render();

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDarkTheme]);

  if (!webGlAvailable) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10">
          <div className="w-20 h-20 rounded-full bg-indigo-600/30 blur-xl" />
          <span className="text-xs font-mono tracking-wider text-indigo-400 uppercase">Lumen Spotlight</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full min-h-[220px]" />
      <div className="absolute bottom-2 text-[11px] font-mono text-slate-500/80 pointer-events-none select-none">
        Interactive 3D Optical Core · Drag to angle
      </div>
    </div>
  );
};
