import { CalendarDays, ExternalLink, MapPin, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { EventRecord } from "../lib/eventTypes";
import { formatDate, formatDateRange, formatFee, formatMode } from "../lib/formatters";
import { getGlobePins, type GlobePin } from "../lib/locations";
import {
  getMacrotopicColorClass,
  getMacrotopicLabel,
  getSubtopicColorClass,
  getSubtopicLabel
} from "../lib/taxonomy";
import worldMapUrl from "../assets/world-map.svg";

type GlobePageProps = {
  events: EventRecord[];
};

type GlobeSceneControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

export function GlobePage({ events }: GlobePageProps) {
  const pins = useMemo(() => getGlobePins(events), [events]);
  const [selectedPin, setSelectedPin] = useState<GlobePin | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleSelectPin = useCallback((pin: GlobePin) => setSelectedPin(pin), []);

  const globeControls = useGlobeScene(viewportRef, canvasRef, pins, handleSelectPin);

  return (
    <section className="globe-page" aria-label="Globe page">
      <div className="page-heading">
        <h2>Globe</h2>
        <p>{pins.length} mappable events from the current filters.</p>
      </div>

      <div className="globe-layout">
        <div className="globe-viewport" ref={viewportRef}>
          <canvas aria-hidden="true" className="globe-canvas" ref={canvasRef} />
          <div aria-label="Globe controls" className="globe-controls">
            <button aria-label="Zoom in globe" className="globe-control-button" type="button" onClick={globeControls.zoomIn}>
              <ZoomIn aria-hidden="true" size={16} />
            </button>
            <button aria-label="Zoom out globe" className="globe-control-button" type="button" onClick={globeControls.zoomOut}>
              <ZoomOut aria-hidden="true" size={16} />
            </button>
            <button aria-label="Reset globe view" className="globe-control-button" type="button" onClick={globeControls.reset}>
              <RotateCcw aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        {pins.length === 0 ? (
          <div className="globe-side-panel empty-state">
            <h2>No mappable events match the current filters.</h2>
            <p>Online and ambiguous multi-city events are hidden from the globe.</p>
          </div>
        ) : selectedPin ? (
          <EventPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
        ) : (
          <div className="globe-side-panel">
            <h3>City pins</h3>
            <p>Select a pin to inspect the event details.</p>
            <ul>
              {pins.map((pin) => (
                <li key={pin.event.id}>
                  <button type="button" onClick={() => setSelectedPin(pin)}>
                    {pin.event.name}
                  </button>
                  <span>{pin.event.location}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function EventPopup({ pin, onClose }: { pin: GlobePin; onClose: () => void }) {
  const event = pin.event;

  return (
    <aside aria-label={event.name} className="globe-popup" role="dialog">
      <div className="globe-popup-header">
        <div>
          <p>{event.id}</p>
          <h3>{event.name}</h3>
        </div>
        <button aria-label="Close globe popup" className="icon-button secondary icon-only" type="button" onClick={onClose}>
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      <p>{event.description}</p>

      <dl className="detail-list">
        <div>
          <dt>
            <CalendarDays aria-hidden="true" size={16} />
            Dates
          </dt>
          <dd>{formatDateRange(event)}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays aria-hidden="true" size={16} />
            Deadline
          </dt>
          <dd>{formatDate(event.applicationDeadline)}</dd>
        </div>
        <div>
          <dt>
            <MapPin aria-hidden="true" size={16} />
            Location
          </dt>
          <dd>
            <span>{event.location}</span> · {formatMode(event.mode)}
          </dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>{formatFee(event.fee)}</dd>
        </div>
      </dl>

      <div className="tag-block">
        {event.macrotopics.map((id) => (
          <span key={id} className={`topic-chip topic-chip-macro ${getMacrotopicColorClass(id)}`}>
            {getMacrotopicLabel(id)}
          </span>
        ))}
        {event.subtopics.map((id) => (
          <span key={id} className={`topic-chip topic-chip-micro ${getSubtopicColorClass(id)}`}>
            {getSubtopicLabel(id)}
          </span>
        ))}
      </div>

      <a className="primary-link" href={event.website} target="_blank" rel="noreferrer">
        <ExternalLink aria-hidden="true" size={16} />
        Website
      </a>
    </aside>
  );
}

function useGlobeScene(
  viewportRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  pins: GlobePin[],
  onSelectPin: (pin: GlobePin) => void
): GlobeSceneControls {
  const controlsRef = useRef<GlobeSceneControls>({
    zoomIn: () => undefined,
    zoomOut: () => undefined,
    reset: () => undefined
  });
  const onSelectPinRef = useRef(onSelectPin);

  useEffect(() => {
    onSelectPinRef.current = onSelectPin;
  }, [onSelectPin]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;

    if (!viewport || !canvas) {
      return;
    }

    if (navigator.userAgent.toLowerCase().includes("jsdom")) {
      return;
    }

    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.z = 3;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.minDistance = 1.75;
      controls.maxDistance = 4.8;
      controls.target.set(0, 0, 0);
      controls.saveState();

      const texture = new THREE.TextureLoader().load(worldMapUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = false;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x061d1a,
          emissiveIntensity: 0.18,
          map: texture,
          metalness: 0.02,
          roughness: 0.64
        })
      );
      globeGroup.add(globe);

      const wireframe = new THREE.Mesh(
        new THREE.SphereGeometry(1.006, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xc7fff4, wireframe: true, transparent: true, opacity: 0.18 })
      );
      globeGroup.add(wireframe);

      const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcf5a,
        emissive: 0x7a4b00,
        emissiveIntensity: 0.14,
        metalness: 0.05,
        roughness: 0.38
      });
      const markerOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x3b2600 });
      const markerMeshes: THREE.Object3D[] = [];
      const markerGroups = pins.map((pin, index) =>
        createPinMarker(pin, index, markerMaterial, markerOutlineMaterial, markerMeshes)
      );
      markerGroups.forEach((marker) => globeGroup.add(marker));

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const light = new THREE.DirectionalLight(0xffffff, 1.2);
      light.position.set(3, 2, 4);
      scene.add(light);
      const rimLight = new THREE.DirectionalLight(0xa8fff0, 0.6);
      rimLight.position.set(-3, 1.2, -2);
      scene.add(rimLight);

      const setCameraDistance = (distance: number) => {
        if (!controls) {
          return;
        }

        const nextDistance = THREE.MathUtils.clamp(distance, controls.minDistance, controls.maxDistance);
        camera.position.copy(camera.position.clone().normalize().multiplyScalar(nextDistance));
        controls.update();
      };

      controlsRef.current = {
        zoomIn: () => setCameraDistance(camera.position.length() * 0.78),
        zoomOut: () => setCameraDistance(camera.position.length() * 1.22),
        reset: () => {
          controls?.reset();
          controls?.update();
        }
      };

      const resize = () => {
        const width = viewport.clientWidth || 800;
        const height = viewport.clientHeight || 520;
        renderer?.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDownPosition: { x: number; y: number } | null = null;

      const updatePointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const handlePointerDown = (event: PointerEvent) => {
        pointerDownPosition = { x: event.clientX, y: event.clientY };
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (!pointerDownPosition) {
          return;
        }

        const moved = Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y);
        pointerDownPosition = null;

        if (moved > 6) {
          return;
        }

        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(markerMeshes, false)[0];
        const pinIndex = hit?.object.userData.pinIndex;

        if (typeof pinIndex === "number" && pins[pinIndex]) {
          onSelectPinRef.current(pins[pinIndex]);
        }
      };

      const animate = () => {
        controls?.update();
        renderer?.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };

      resize();
      window.addEventListener("resize", resize);
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointerup", handlePointerUp);
      animate();

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointerup", handlePointerUp);
        controls?.dispose();
        renderer?.dispose();
        texture.dispose();
        globe.geometry.dispose();
        markerMaterial.dispose();
        markerOutlineMaterial.dispose();
        wireframe.geometry.dispose();
        markerGroups.forEach((group) => {
          group.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
            }
          });
        });
        controlsRef.current = {
          zoomIn: () => undefined,
          zoomOut: () => undefined,
          reset: () => undefined
        };
      };
    } catch {
      controls?.dispose();
      renderer?.dispose();
    }
  }, [canvasRef, pins, viewportRef]);

  return useMemo(
    () => ({
      zoomIn: () => controlsRef.current.zoomIn(),
      zoomOut: () => controlsRef.current.zoomOut(),
      reset: () => controlsRef.current.reset()
    }),
    []
  );
}

function createPinMarker(
  pin: GlobePin,
  index: number,
  markerMaterial: THREE.Material,
  markerOutlineMaterial: THREE.Material,
  markerMeshes: THREE.Object3D[]
) {
  const position = latLongToVector3(pin.location.latitude, pin.location.longitude, 1.025);
  const marker = new THREE.Group();
  marker.position.copy(position);
  marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize());

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.011, 0.075, 10), markerMaterial);
  stem.position.y = 0.026;
  stem.userData.pinIndex = index;
  marker.add(stem);
  markerMeshes.push(stem);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 18), markerMaterial);
  head.position.y = 0.078;
  head.userData.pinIndex = index;
  marker.add(head);
  markerMeshes.push(head);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 12), markerOutlineMaterial);
  core.position.y = 0.08;
  core.userData.pinIndex = index;
  marker.add(core);
  markerMeshes.push(core);

  return marker;
}

function latLongToVector3(latitude: number, longitude: number, radius: number) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude);
  const longitudeRadians = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    Math.cos(latitudeRadians) * Math.sin(longitudeRadians),
    Math.sin(latitudeRadians),
    Math.cos(latitudeRadians) * Math.cos(longitudeRadians)
  ).multiplyScalar(radius);
}
