import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { APIProvider, InfoWindow, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { CalendarDays, ExternalLink, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { googleMapsApiKey, googleMapsMapId } from "../config";
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

const DEFAULT_CENTER = { lat: 28, lng: 12 };
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 6;

export function GlobePage({ events }: GlobePageProps) {
  const pins = useMemo(() => getGlobePins(events), [events]);
  const [selectedPin, setSelectedPin] = useState<GlobePin | null>(null);

  useEffect(() => {
    setSelectedPin((current) => {
      if (!current) {
        return current;
      }

      return pins.some((pin) => pin.event.id === current.event.id) ? current : null;
    });
  }, [pins]);

  return (
    <section className="map-page" aria-label="Map page">
      <div className="page-heading">
        <h2>Map</h2>
        <p>{pins.length} mappable events from the current filters.</p>
      </div>

      <div className="map-layout">
        <div className="map-viewport">
          {pins.length === 0 ? (
            <MapPlaceholder
              title="No mappable events to display."
              body="Try loosening the current filters or switch back to the directory."
            />
          ) : googleMapsApiKey ? (
            <APIProvider apiKey={googleMapsApiKey}>
              <GoogleMapSurface pins={pins} selectedPin={selectedPin} onSelectPin={setSelectedPin} />
            </APIProvider>
          ) : (
            <MapPlaceholder
              title="Google Maps is not configured."
              body="Add VITE_GOOGLE_MAPS_API_KEY to enable the interactive Google map in this static app."
            />
          )}
        </div>

        {pins.length === 0 ? (
          <div className="map-side-panel empty-state">
            <h2>No mappable events match the current filters.</h2>
            <p>Online and ambiguous multi-city events are hidden from the map.</p>
          </div>
        ) : selectedPin ? (
          <EventPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
        ) : (
          <CityPinList pins={pins} onSelectPin={setSelectedPin} />
        )}
      </div>
    </section>
  );
}

function GoogleMapSurface({
  pins,
  selectedPin,
  onSelectPin
}: {
  pins: GlobePin[];
  selectedPin: GlobePin | null;
  onSelectPin: (pin: GlobePin | null) => void;
}) {
  return (
    <Map
      className="google-map"
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      mapId={googleMapsMapId}
      reuseMaps
    >
      <FitMapToPins pins={pins} selectedPin={selectedPin} />
      <ClusteredEventMarkers pins={pins} selectedPin={selectedPin} onSelectPin={onSelectPin} />
      {selectedPin ? (
        <InfoWindow
          position={toLatLngLiteral(selectedPin)}
          maxWidth={260}
          onCloseClick={() => onSelectPin(null)}
        >
          <div className="map-info-window">
            <strong>{selectedPin.event.name}</strong>
            <span>{selectedPin.event.location}</span>
            <span>{formatDateRange(selectedPin.event)}</span>
          </div>
        </InfoWindow>
      ) : null}
    </Map>
  );
}

function FitMapToPins({ pins, selectedPin }: { pins: GlobePin[]; selectedPin: GlobePin | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0 || selectedPin) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    pins.forEach((pin) => bounds.extend(toLatLngLiteral(pin)));
    map.fitBounds(bounds, 60);

    if (pins.length === 1) {
      map.setZoom(SELECTED_ZOOM);
    }
  }, [map, pins, selectedPin]);

  useEffect(() => {
    if (!map || !selectedPin) {
      return;
    }

    map.panTo(toLatLngLiteral(selectedPin));
    map.setZoom(Math.max(map.getZoom() ?? DEFAULT_ZOOM, SELECTED_ZOOM));
  }, [map, selectedPin]);

  return null;
}

function ClusteredEventMarkers({
  pins,
  selectedPin,
  onSelectPin
}: {
  pins: GlobePin[];
  selectedPin: GlobePin | null;
  onSelectPin: (pin: GlobePin) => void;
}) {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const handleSelectPin = useCallback((pin: GlobePin) => onSelectPin(pin), [onSelectPin]);

  useEffect(() => {
    if (!map || !markerLibrary) {
      return;
    }

    const markers = pins.map((pin) => {
      const isSelected = selectedPin?.event.id === pin.event.id;
      const glyph = new markerLibrary.PinElement({
        background: isSelected ? "#006c54" : "#0b7a61",
        borderColor: isSelected ? "#003f32" : "#064c3d",
        glyphColor: "#ffffff",
        scale: isSelected ? 1.22 : 1
      });
      const marker = new markerLibrary.AdvancedMarkerElement({
        content: glyph,
        gmpClickable: true,
        position: toLatLngLiteral(pin),
        title: pin.event.name
      });
      const handleMarkerClick = () => handleSelectPin(pin);
      marker.addEventListener("gmp-click", handleMarkerClick);

      return { handleMarkerClick, marker };
    });

    const clusterer = new MarkerClusterer({
      map,
      markers: markers.map(({ marker }) => marker)
    });

    return () => {
      clusterer.clearMarkers();
      markers.forEach(({ marker, handleMarkerClick }) => {
        marker.removeEventListener("gmp-click", handleMarkerClick);
        marker.map = null;
      });
    };
  }, [handleSelectPin, map, markerLibrary, pins, selectedPin]);

  return null;
}

function CityPinList({
  pins,
  onSelectPin
}: {
  pins: GlobePin[];
  onSelectPin: (pin: GlobePin) => void;
}) {
  return (
    <aside aria-label="Mappable events" className="map-side-panel">
      <h3>City pins</h3>
      <p>Select a city or marker to inspect the event details.</p>
      <ul>
        {pins.map((pin) => (
          <li key={pin.event.id}>
            <button type="button" onClick={() => onSelectPin(pin)}>
              {pin.event.name}
            </button>
            <span>{pin.event.location}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function EventPopup({ pin, onClose }: { pin: GlobePin; onClose: () => void }) {
  const event = pin.event;

  return (
    <aside aria-label={event.name} className="map-popup" role="dialog">
      <div className="map-popup-header">
        <div>
          <p>{event.id}</p>
          <h3>{event.name}</h3>
        </div>
        <button aria-label="Close map popup" className="icon-button secondary icon-only" type="button" onClick={onClose}>
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

function MapPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="map-placeholder">
      <MapPin aria-hidden="true" size={28} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function toLatLngLiteral(pin: GlobePin): google.maps.LatLngLiteral {
  return {
    lat: pin.location.latitude,
    lng: pin.location.longitude
  };
}
