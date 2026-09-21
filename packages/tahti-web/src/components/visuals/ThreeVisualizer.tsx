import { FC, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { cn } from '../../lib/cn';
import { visualizerPreset } from '../../plugins/visualizers';
import { usePlayerStore } from '../../stores/playerStore';

type VisualizerScheme = {
  accent: string;
  highlight: string;
  bg: string;
  text: string;
  muted: string;
};

type VisualizerSettings = {
  speed: number;
  intensity: number;
  scale: number;
};

export type ThreeVisualizerProps = {
  preset: string;
  scheme: VisualizerScheme;
  settings: VisualizerSettings;
  className?: string;
  artworkUrl?: string | null;
  audioReactive?: boolean;
};

const CAMERA_DISTANCE = 8;
const CAMERA_FOV = 55;
const MAX_PIXEL_RATIO = 2;
const FREQUENCY_SAMPLE_COUNT = 96;
// The scene is a backdrop: 30 fps looks the same and halves the GPU (or, on
// software-rendered WebKit, CPU) cost of a full-window canvas.
const FRAME_INTERVAL_MS = 1000 / 30;

function readLevel(analyser: AnalyserNode | null, frequencyData: Uint8Array) {
  if (!analyser) {
    return 0.22;
  }

  analyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>);
  const sampleCount = Math.min(FREQUENCY_SAMPLE_COUNT, frequencyData.length);
  let total = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    total += frequencyData[index] ?? 0;
  }

  return Math.min(1, total / (sampleCount * 180));
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) {
      return;
    }
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) {
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}

export const ThreeVisualizer: FC<ThreeVisualizerProps> = ({
  preset,
  scheme,
  settings,
  className,
  artworkUrl,
  audioReactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyser = usePlayerStore((state) => state.analyser);
  const status = usePlayerStore((state) => state.status);
  const playing = status === 'playing' || status === 'loading';
  // Read inside the frame loop so play/pause and the analyser arriving don't
  // tear down and rebuild the whole WebGL context.
  const live = useRef({ analyser, playing, audioReactive });
  live.current = { analyser, playing, audioReactive };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(scheme.bg, 0.055);
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_DISTANCE;
    scene.add(new THREE.AmbientLight(scheme.text, 0.7));
    const pointLight = new THREE.PointLight(scheme.highlight, 3, 30);
    pointLight.position.set(3, 4, 6);
    scene.add(pointLight);

    const presetScene = visualizerPreset(preset).build(
      scene,
      scheme,
      artworkUrl,
      camera,
    );
    // Uniformly grows/shrinks the whole scene around the origin — generic
    // across every preset (none of them render a viewport-fitted quad, so
    // this never clips or misaligns), rather than a per-preset "scale"
    // parameter each preset's build() would need to implement itself.
    scene.scale.setScalar(settings.scale);
    let frequencyData = new Uint8Array(new ArrayBuffer(128));
    const clock = new THREE.Clock();
    let animationFrame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);
      if (document.hidden || now - lastFrame < FRAME_INTERVAL_MS) {
        return;
      }
      lastFrame = now;
      const nextWidth = canvas.clientWidth || 1;
      const nextHeight = canvas.clientHeight || 1;
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      const { analyser, playing, audioReactive } = live.current;
      if (analyser && frequencyData.length !== analyser.frequencyBinCount) {
        frequencyData = new Uint8Array(
          new ArrayBuffer(analyser.frequencyBinCount),
        );
      }
      const elapsed = clock.getElapsedTime() * settings.speed;
      const level =
        audioReactive && playing
          ? readLevel(analyser, frequencyData)
          : 0.2 + Math.sin(elapsed * 2.2) * 0.14;
      presetScene.update(elapsed, level * settings.intensity);
      renderer.render(scene, camera);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      disposeScene(scene);
      renderer.dispose();
    };
  }, [artworkUrl, preset, scheme, settings]);

  return (
    <div
      className={cn('overflow-hidden', className)}
      data-visualizer-engine="three"
      data-visualizer-preset={preset}
      aria-hidden
      style={{
        background: scheme.bg,
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
