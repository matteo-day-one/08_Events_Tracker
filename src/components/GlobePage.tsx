import { CalendarDays, ExternalLink, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { EventRecord } from "../lib/eventTypes";
import { formatDate, formatDateRange, formatFee, formatMode } from "../lib/formatters";
import { getGlobePins, type GlobePin } from "../lib/locations";
import {
  getMacrotopicColorClass,
  getMacrotopicLabel,
  getSubtopicColorClass,
  getSubtopicLabel
} from "../lib/taxonomy";

type GlobePageProps = {
  events: EventRecord[];
};

export function GlobePage({ events }: GlobePageProps) {
  const pins = useMemo(() => getGlobePins(events), [events]);
  const [selectedPin, setSelectedPin] = useState<GlobePin | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useGlobeScene(viewportRef, canvasRef);

  return (
    <section className="globe-page" aria-label="Globe page">
      <div className="page-heading">
        <h2>Globe</h2>
        <p>{pins.length} mappable events from the current filters.</p>
      </div>

      <div className="globe-layout">
        <div className="globe-viewport" ref={viewportRef}>
          <canvas aria-hidden="true" className="globe-canvas" ref={canvasRef} />
          <div className="globe-pin-layer" aria-label="Mappable event pins">
            {pins.map((pin) => {
              const position = projectLocation(pin.location.latitude, pin.location.longitude);

              return (
                <button
                  aria-label={`Show ${pin.event.name} on globe`}
                  className="globe-pin"
                  key={pin.event.id}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                >
                  <MapPin aria-hidden="true" size={16} />
                </button>
              );
            })}
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
              {pins.slice(0, 12).map((pin) => (
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
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
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

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.z = 3;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshPhongMaterial({
          color: 0x1f8a77,
          emissive: 0x07342e,
          shininess: 28,
          specular: 0xb8fff0
        })
      );
      scene.add(globe);

      const wireframe = new THREE.Mesh(
        new THREE.SphereGeometry(1.006, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xc7fff4, wireframe: true, transparent: true, opacity: 0.18 })
      );
      scene.add(wireframe);

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const light = new THREE.DirectionalLight(0xffffff, 1.2);
      light.position.set(3, 2, 4);
      scene.add(light);

      const resize = () => {
        const width = viewport.clientWidth || 800;
        const height = viewport.clientHeight || 520;
        renderer?.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const animate = () => {
        globe.rotation.y += 0.002;
        wireframe.rotation.y += 0.002;
        renderer?.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };

      resize();
      window.addEventListener("resize", resize);
      animate();

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        renderer?.dispose();
        globe.geometry.dispose();
        wireframe.geometry.dispose();
      };
    } catch {
      renderer?.dispose();
    }
  }, [canvasRef, viewportRef]);
}

function projectLocation(latitude: number, longitude: number): { x: number; y: number } {
  return {
    x: ((longitude + 180) / 360) * 100,
    y: ((90 - latitude) / 180) * 100
  };
}
