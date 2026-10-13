'use client';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';

/** Original, generated conceptual GLB. It does not depict a real/listed building. */
function BuildingModel({ reduced, story }: { reduced: boolean; story: boolean }) {
  const gltf = useLoader(GLTFLoader, '/models/automan-architectural-concept.glb');
  const root = useRef<THREE.Group>(null);
  const { gl, scene, camera, pointer } = useThree();
  const [progress, setProgress] = useState(0);
  const env = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const result = generator.fromScene(new RoomEnvironment(), 0.04);
    generator.dispose();
    return result.texture;
  }, [gl]);
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.MeshStandardMaterial;
      material.envMap = env;
      material.envMapIntensity = object.name.includes('glass') ? 2.5 : 1.3;
      material.needsUpdate = true;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return cloned;
  }, [gltf.scene, env]);
  useEffect(() => {
    return () => { env.dispose(); };
  }, [env]);
  useEffect(() => {
    if (!story) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const element = document.getElementById('architecture-story');
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const distance = Math.max(1, rect.height - innerHeight);
        setProgress(THREE.MathUtils.clamp(-rect.top / distance, 0, 1));
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [story]);
  useFrame((state, delta) => {
    if (!root.current) return;
    const motion = reduced ? 0 : 1;
    const targetYaw = story ? -.4 + progress * 1.07 : -.29 + pointer.x * .16 * motion;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetYaw, 1.9, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, story ? -.05 + progress * .13 : -pointer.y * .07 * motion, 2, delta);
    root.current.position.y = reduced ? -.08 : -.08 + Math.sin(state.clock.elapsedTime * .55) * .045;
    const cam = camera as THREE.PerspectiveCamera;
    const t = story ? progress : 0;
    const targetPos = story ? new THREE.Vector3(8.8 - 6.1*t, 3.5 + 2.4*t, 12.2 - 4.3*t) : new THREE.Vector3(8.1 + pointer.x*.25*motion,4.5,12.5);
    cam.position.lerp(targetPos,1-Math.exp(-delta*2.5));
    cam.lookAt(0,story ? -.05 + t*.7 : -.2,0);
  });
  return <group ref={root} scale={story ? .9 : .84}><primitive object={model}/></group>;
}

export default function ThreeArchitecture({ reduced = false, story = false }: { reduced?: boolean; story?: boolean }) {
  return <Canvas dpr={[1, 1.65]} camera={{position:[8.1,4.5,12.5],fov:38,near:.1,far:90}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} style={{width:'100%',height:'100%'}} fallback={<div className="architecture-static-fallback" aria-hidden="true"><span className="architecture-static-tower short"/><span className="architecture-static-tower tall"/><span className="architecture-static-tower mid"/></div>}>
    <ambientLight intensity={.75} color="#c4dce8"/>
    <hemisphereLight args={['#d6ecf5','#16232c',1.7]}/>
    <directionalLight position={[6,9,7]} intensity={4.1} color="#ffe3b8"/>
    <pointLight position={[-4,3,4]} intensity={23} color="#7cb9d2" distance={18}/>
    <pointLight position={[4,2,-3]} intensity={18} color="#eec08c" distance={15}/>
    <Suspense fallback={null}><BuildingModel reduced={reduced} story={story}/></Suspense>
  </Canvas>;
}
