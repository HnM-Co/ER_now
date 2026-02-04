import React, { useEffect, useRef, useState } from 'react';
import { HospitalData, RegionOption } from '../types';

interface HospitalMapProps {
  hospitals: HospitalData[];
  center: { lat: number; lon: number } | null; // User location
  selectedRegion: RegionOption; // Region center fallback
  isLocating: boolean;
}

const HospitalMap: React.FC<HospitalMapProps> = ({ hospitals, center, selectedRegion, isLocating }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Initialize Map with Retry Logic
  useEffect(() => {
    let intervalId: any = null;
    let attempts = 0;

    const initMap = () => {
        // Check for 'LatLng' constructor to ensure SDK is fully ready
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng || !window.kakao.maps.Map || !containerRef.current) {
            return false;
        }

        try {
            const lat = center?.lat || selectedRegion.lat || 37.5665;
            const lon = center?.lon || selectedRegion.lon || 126.9780;

            const options = {
                center: new window.kakao.maps.LatLng(lat, lon),
                level: center ? 7 : 9,
            };

            const map = new window.kakao.maps.Map(containerRef.current, options);
            mapRef.current = map;

            // Zoom control
            const zoomControl = new window.kakao.maps.ZoomControl();
            map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
            
            setMapError(false);
            setIsMapReady(true);
            return true;
        } catch (e) {
            console.error("Error initializing map:", e);
            return false;
        }
    };

    if (!initMap()) {
        intervalId = setInterval(() => {
            attempts++;
            if (initMap()) {
                clearInterval(intervalId);
            } else if (attempts > 50) { // 5 seconds timeout
                clearInterval(intervalId);
                setMapError(true);
            }
        }, 100);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, []); 

  // Update Center
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !window.kakao || !window.kakao.maps) return;

    const targetLat = center?.lat || selectedRegion.lat;
    const targetLon = center?.lon || selectedRegion.lon;

    if (targetLat && targetLon) {
      const moveLatLon = new window.kakao.maps.LatLng(targetLat, targetLon);
      mapRef.current.panTo(moveLatLon);
      
      if (center) {
          mapRef.current.setLevel(6); 
      } else {
          mapRef.current.setLevel(9);
      }
    }
  }, [center, selectedRegion, isMapReady]);

  // Render Markers
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !window.kakao || !window.kakao.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    hospitals.forEach(hospital => {
      if (!hospital.wgs84Lat || !hospital.wgs84Lon) return;

      const beds = hospital.hvec;
      
      // Define styles directly to bypass Tailwind latency on dynamic elements
      let styles = "";
      let size = "";
      
      // Colors matched to Tailwind: emerald-500 (#10b981), amber-400 (#fbbf24), rose-500 (#f43f5e)
      if (beds >= 5) {
        size = "width:36px; height:36px; font-size:14px;";
        styles = "background-color:#10b981; border:2px solid #6ee7b7; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);";
      } else if (beds >= 1) {
        size = "width:28px; height:28px; font-size:12px;";
        styles = "background-color:#fbbf24; border:2px solid #fde68a; box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);";
      } else {
        size = "width:24px; height:24px; font-size:10px;";
        styles = "background-color:#f43f5e; border:2px solid #fda4af; box-shadow: 0 0 8px rgba(244, 63, 94, 0.4);";
      }

      // Create DOM element for CustomOverlay
      const el = document.createElement('div');
      el.className = 'marker-container'; // just for reference
      el.style.cssText = "position: relative; cursor: pointer;";
      
      // Use inline styles for the bubble to ensure it renders immediately
      el.innerHTML = `
          <div style="${size} ${styles} display:flex; align-items:center; justify-content:center; border-radius:50%; color:white; font-weight:bold; transition: transform 0.2s;">
            ${beds}
          </div>
          <div style="position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); white-space: nowrap; background-color: #1e293b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: none; z-index: 50; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${hospital.dutyName}
          </div>
      `;

      // Simple hover effect using JS events since we are using inline HTML
      el.onmouseenter = () => {
          const tooltip = el.lastElementChild as HTMLElement;
          const bubble = el.firstElementChild as HTMLElement;
          if(tooltip) tooltip.style.display = 'block';
          if(bubble) bubble.style.transform = 'scale(1.1)';
      };
      el.onmouseleave = () => {
          const tooltip = el.lastElementChild as HTMLElement;
          const bubble = el.firstElementChild as HTMLElement;
          if(tooltip) tooltip.style.display = 'none';
          if(bubble) bubble.style.transform = 'scale(1.0)';
      };

      const position = new window.kakao.maps.LatLng(hospital.wgs84Lat, hospital.wgs84Lon);

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: el,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: beds >= 5 ? 30 : (beds >= 1 ? 20 : 10)
      });

      customOverlay.setMap(mapRef.current);
      markersRef.current.push(customOverlay);
    });

    // Add User Marker
    if (center) {
        const userEl = document.createElement('div');
        // Blue dot for user
        userEl.innerHTML = `<div style="width:16px; height:16px; background-color:#2563eb; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;
        
        const userPos = new window.kakao.maps.LatLng(center.lat, center.lon);
        const userOverlay = new window.kakao.maps.CustomOverlay({
            position: userPos,
            content: userEl,
            zIndex: 100
        });
        userOverlay.setMap(mapRef.current);
        markersRef.current.push(userOverlay);
    }

  }, [hospitals, center, isMapReady]);

  return (
    <div className="w-full h-64 bg-slate-100 relative shadow-inner">
      <div ref={containerRef} className="w-full h-full" id="kakao-map" />
      
      {mapError && (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <p className="text-sm font-semibold">지도를 불러올 수 없습니다.</p>
          </div>
      )}

      {/* Legend */}
      {!mapError && isMapReady && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg p-2 shadow border border-slate-200 text-[10px] z-10 flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300"></div>
                <span>여유 (5+)</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-200"></div>
                <span>보통 (1~4)</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500 border border-rose-300"></div>
                <span>만실 (0)</span>
            </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isLocating || (!isMapReady && !mapError)) && (
        <div className="absolute inset-0 bg-slate-100/60 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
};

export default HospitalMap;