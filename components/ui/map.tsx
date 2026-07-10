"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "leaflet/dist/leaflet.css";

const MapContext = createContext<{
  L: any;
  map: any;
} | null>(null);

const LeafletStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .leaflet-popup-content-wrapper {
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .leaflet-popup-content {
      margin: 0 !important;
      background: transparent !important;
    }
    .leaflet-popup-tip {
      background: #020617 !important;
      border: 1px solid #0f172a !important;
      box-shadow: none !important;
    }
    .leaflet-popup-close-button {
      color: #94a3b8 !important;
      font-size: 18px !important;
      padding: 4px !important;
      top: 8px !important;
      right: 8px !important;
    }
    .custom-leaflet-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `}} />
);

export function Map({
  center,
  zoom,
  children,
}: {
  center: [number, number]; // [lng, lat]
  zoom: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<{ L: any; map: any } | null>(null);

  useEffect(() => {
    let mapInstance: any = null;
    let isCleanedUp = false;

    // Import leaflet dynamically to prevent SSR issues
    import("leaflet").then((module) => {
      if (isCleanedUp) return;
      const L = module.default || module;

      if (!containerRef.current) return;

      // Check if Leaflet has already initialized a map on this DOM node
      if ((containerRef.current as any)._leaflet_id) {
        return;
      }

      // Leaflet expects [lat, lng], but the center prop is [lng, lat]
      const lat = center[1];
      const lng = center[0];

      mapInstance = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], zoom);

      // Add CartoDB Dark Matter tile layer (premium looking dark mode)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(mapInstance);

      // Add zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

      setMapState({ L, map: mapInstance });
    });

    return () => {
      isCleanedUp = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [center, zoom]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <LeafletStyles />
      {mapState && (
        <MapContext.Provider value={mapState}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
}

export function MapMarker({
  longitude,
  latitude,
  children,
}: {
  longitude: number;
  latitude: number;
  children: React.ReactNode;
}) {
  const context = useContext(MapContext);
  if (!context) return null;

  const { L, map } = context;
  const markerRef = useRef<any>(null);
  const [portalNodes, setPortalNodes] = useState<{
    contentNode: HTMLDivElement | null;
    popupNode: HTMLDivElement | null;
  }>({ contentNode: null, popupNode: null });

  useEffect(() => {
    const contentNode = document.createElement("div");
    contentNode.className = "custom-leaflet-marker";

    const popupNode = document.createElement("div");
    popupNode.className = "custom-leaflet-popup";

    const customIcon = L.divIcon({
      html: contentNode,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Create marker. Leaflet takes [latitude, longitude]
    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    setPortalNodes({ contentNode, popupNode });

    return () => {
      if (marker) {
        marker.remove();
      }
    };
  }, [L, map, latitude, longitude]);

  useEffect(() => {
    const marker = markerRef.current;
    const popupNode = portalNodes.popupNode;
    if (!marker || !popupNode) return;

    // Check if there is any MarkerPopup in children
    const hasPopup = React.Children.toArray(children).some(
      (child: any) => child && child.type === MarkerPopup
    );

    if (hasPopup) {
      const popup = L.popup({
        className: "custom-leaflet-popup-wrapper",
        minWidth: 260,
        maxWidth: 320,
      }).setContent(popupNode);

      marker.bindPopup(popup);
    }
  }, [children, portalNodes.popupNode, L]);

  if (!portalNodes.contentNode) return null;

  const childrenArray = React.Children.toArray(children);
  const markerContent = childrenArray.find((child: any) => child && child.type === MarkerContent);
  const markerPopup = childrenArray.find((child: any) => child && child.type === MarkerPopup);

  return (
    <>
      {ReactDOM.createPortal(markerContent, portalNodes.contentNode)}
      {portalNodes.popupNode && markerPopup && ReactDOM.createPortal(markerPopup, portalNodes.popupNode)}
    </>
  );
}

export function MarkerContent({ children }: { children: React.ReactNode }) {
  return <div className="relative flex items-center justify-center">{children}</div>;
}

export function MarkerLabel({
  position = "bottom",
  children,
}: {
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={`absolute z-10 whitespace-nowrap bg-slate-950/95 border border-slate-800 text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded shadow-lg pointer-events-none select-none ${positionClasses[position]}`}>
      {children}
    </div>
  );
}

export function MarkerPopup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`w-full text-left overflow-hidden bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-slate-200 ${className || ""}`}>
      {children}
    </div>
  );
}
