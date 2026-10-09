'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { US_VIEW } from '../lib/states';

// Teardrop pin in the group's color. One cached icon per color.
const iconCache = {};
function pinIcon(hex) {
  if (!iconCache[hex]) {
    const html = `<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 23 13 23s13-13.5 13-23C26 5.8 20.2 0 13 0z"
        fill="${hex}" stroke="#333" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="4.5" fill="#ffffff"/>
    </svg>`;
    iconCache[hex] = L.divIcon({
      className: 'camp-pin',
      html,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      popupAnchor: [0, -34],
    });
  }
  return iconCache[hex];
}

// Moves the map when a new state is chosen.
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target.center, target.zoom);
  }, [target, map]);
  return null;
}

export default function MapView({ groups, target }) {
  return (
    <MapContainer
      center={US_VIEW.center}
      zoom={US_VIEW.zoom}
      className="map-canvas"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo target={target} />
      {groups
        .filter((g) => g.visible)
        .map((g) =>
          g.places.map((p, i) => (
            <Marker key={`${g.id}-${i}`} position={[p.lat, p.lng]} icon={pinIcon(g.color)}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                Group: {g.name}
                <br />
                {p.address}
                {p.notes && (
                  <>
                    <br />
                    <em>{p.notes}</em>
                  </>
                )}
              </Popup>
            </Marker>
          ))
        )}
    </MapContainer>
  );
}
