import React, { useRef, useEffect, useState } from "react";
import { Typography, Space, theme, Tooltip, Collapse, Card, Row, Col, Image, Tag, Badge } from "antd";
import { MapPin, Maximize2, Minimize2, ChevronRight } from "lucide-react";
import * as maptilerSdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Deal } from "../data/mockDeals";
import { getLocationsByAccount, Location } from "../data/locationData";
import { getMerchantAccount } from "../data/merchantAccounts";

const { Text } = Typography;
const { useToken } = theme;

interface SimilarDealsMapProps {
  currentDeal?: {
    id: string;
    category: string;
    subcategory?: string;
    accountId?: string;
    title: string;
  };
  allDeals: Deal[];
  defaultRadius?: number; // in miles
}

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to get primary location coordinates for a deal
const getDealCoordinates = (deal: Deal): Location | null => {
  if (!deal.accountId) return null;
  const locations = getLocationsByAccount(deal.accountId);
  if (locations.length === 0) return null;
  
  // Get primary (first active) location
  const primaryLocation = locations.find(loc => loc.isActive && !loc.isDraft) || locations[0];
  return primaryLocation && primaryLocation.coordinates ? primaryLocation : null;
};

const SimilarDealsMap: React.FC<SimilarDealsMapProps> = ({
  currentDeal,
  allDeals,
  defaultRadius = 10,
}) => {
  const { token } = useToken();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const radiusCircle = useRef<any>(null);
  const markers = useRef<any[]>([]);
  
  const [radius, setRadius] = useState(defaultRadius);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [dealsInRadius, setDealsInRadius] = useState<Array<Deal & { distance: number; location: Location }>>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const dragStateRef = useRef({ isDragging: false });
  const radiusRef = useRef(radius);
  const animationFrameRef = useRef<number | null>(null);
  
  // Keep radiusRef in sync with radius state
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  // Get current deal's location
  useEffect(() => {
    if (currentDeal?.accountId) {
      const locations = getLocationsByAccount(currentDeal.accountId);
      const primaryLocation = locations.find(loc => loc.isActive && !loc.isDraft) || locations[0];
      if (primaryLocation && primaryLocation.coordinates) {
        setCurrentLocation(primaryLocation);
      }
    }
  }, [currentDeal]);

  // Calculate deals within radius (same category only)
  useEffect(() => {
    if (!currentLocation?.coordinates || !currentDeal?.category) {
      setDealsInRadius([]);
      return;
    }

    const { latitude: currentLat, longitude: currentLon } = currentLocation.coordinates;
    
    const dealsWithDistance = allDeals
      .filter(deal => 
        deal.id !== currentDeal?.id && // Exclude current deal
        deal.category === currentDeal.category // Only same category
      )
      .map(deal => {
        const dealLocation = getDealCoordinates(deal);
        if (!dealLocation?.coordinates) return null;

        const distance = calculateDistance(
          currentLat,
          currentLon,
          dealLocation.coordinates.latitude,
          dealLocation.coordinates.longitude
        );

        return {
          ...deal,
          distance,
          location: dealLocation,
        };
      })
      .filter((deal): deal is Deal & { distance: number; location: Location } => 
        deal !== null && deal.distance <= radius
      )
      .sort((a, b) => a.distance - b.distance);

    setDealsInRadius(dealsWithDistance);
  }, [currentLocation, allDeals, radius, currentDeal]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !currentLocation?.coordinates || map.current) return;

    maptilerSdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";

    // Suppress MapTiler sprite image warnings (we use custom HTML markers)
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // Filter out MapTiler image loading warnings (we use custom HTML markers, not sprites)
      if (message.includes('Image') && message.includes('could not be loaded') && 
          (message.includes('sprite') || message.includes('map.addImage'))) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // Filter out MapTiler image loading errors
      if (message.includes('Image') && message.includes('could not be loaded') && 
          (message.includes('sprite') || message.includes('map.addImage'))) {
        return; // Suppress this specific error
      }
      originalError.apply(console, args);
    };

    map.current = new maptilerSdk.Map({
      container: mapContainer.current,
      style: maptilerSdk.MapStyle.STREETS,
      center: [currentLocation.coordinates.longitude, currentLocation.coordinates.latitude],
      zoom: 11,
    });

    // Handle missing sprite images (we use custom HTML markers, not sprites)
    map.current.on('styleimagemissing', (e: any) => {
      const imageId = e.id;
      
      // Skip if no ID or just whitespace
      if (!imageId || !imageId.trim()) {
        return;
      }
      
      if (map.current && !map.current.hasImage(imageId)) {
        try {
          // Create a minimal 1x1 transparent PNG image data
          const size = 1;
          const data = new Uint8Array(size * size * 4);
          // Fill with transparent pixels (RGBA: 0,0,0,0)
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 0; // A (transparent)
          }
          
          map.current.addImage(imageId, {
            width: size,
            height: size,
            data: data,
          });
        } catch (err) {
          // Silently ignore
        }
      }
    });

    return () => {
      // Restore original console methods
      console.warn = originalWarn;
      console.error = originalError;
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentLocation]);

  // Setup drag handlers once
  useEffect(() => {
    if (!map.current || !currentLocation?.coordinates) return;

    const { latitude: lat, longitude: lon } = currentLocation.coordinates;

    // Handle dragging with optimized performance
    const onMouseDown = (e: any) => {
      if (!map.current) return;
      e.preventDefault();
      
      dragStateRef.current.isDragging = true;
      
      setIsDraggingRadius(true);
      map.current.getCanvas().style.cursor = 'ew-resize';
      map.current.dragPan.disable();
    };
    
    const onMouseMove = (e: any) => {
      if (!dragStateRef.current.isDragging || !map.current) {
        return;
      }
      
      // Use requestAnimationFrame to throttle updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!map.current || !dragStateRef.current.isDragging) {
          return;
        }
        
        const mouse = [e.lngLat.lng, e.lngLat.lat];
        
        // Calculate current distance from center to mouse in miles
        const currentDistance = calculateDistance(
          lat,
          lon,
          mouse[1],
          mouse[0]
        );
        
        // Simply use the current distance as the new radius
        // This gives direct control - wherever you drag to becomes the radius
        const newRadius = currentDistance;
        
        // Clamp between 1 and 50 miles
        const clampedRadius = Math.max(1, Math.min(50, Math.round(newRadius)));
        
        // Only update if radius actually changed
        if (clampedRadius !== radiusRef.current) {
          // Update the circle immediately during dragging by updating the source
          const radiusInMeters = clampedRadius * 1609.34;
          const generateCirclePolygon = (centerLon: number, centerLat: number, radiusInMeters: number, points = 64) => {
            const coords = [];
            const distancePerDegree = 111320;
            const latDistancePerDegree = distancePerDegree;
            const lonDistancePerDegree = distancePerDegree * Math.cos(centerLat * Math.PI / 180);
            
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * 2 * Math.PI;
              const dx = radiusInMeters * Math.cos(angle);
              const dy = radiusInMeters * Math.sin(angle);
              const deltaLon = dx / lonDistancePerDegree;
              const deltaLat = dy / latDistancePerDegree;
              coords.push([centerLon + deltaLon, centerLat + deltaLat]);
            }
            return coords;
          };
          
          const circleCoords = generateCirclePolygon(lon, lat, radiusInMeters);
          const circleGeoJSON = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [circleCoords],
              },
              properties: {},
            }],
          };
          
          // Update the source data directly (much faster than recreating layers)
          const source = map.current.getSource('radius-circle');
          if (source && source.type === 'geojson') {
            (source as any).setData(circleGeoJSON);
          }
          
          // Update visual feedback during drag
          if (map.current.getLayer('radius-circle')) {
            map.current.setPaintProperty('radius-circle', 'fill-opacity', 0.15);
          }
          if (map.current.getLayer('radius-circle-outline')) {
            map.current.setPaintProperty('radius-circle-outline', 'line-width', 3);
            map.current.setPaintProperty('radius-circle-outline', 'line-opacity', 0.8);
          }
          if (map.current.getLayer('radius-edge')) {
            map.current.setPaintProperty('radius-edge', 'line-width', 32);
            map.current.setPaintProperty('radius-edge', 'line-opacity', 0.2);
          }
          
          setRadius(clampedRadius);
        }
      });
    };

    const stopDragging = () => {
      if (!map.current || !dragStateRef.current.isDragging) return;
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      dragStateRef.current.isDragging = false;
      setIsDraggingRadius(false);
      map.current.dragPan.enable();
      map.current.getCanvas().style.cursor = 'default';
      
      // Reset visual feedback to normal state
      if (map.current.getLayer('radius-circle')) {
        map.current.setPaintProperty('radius-circle', 'fill-opacity', 0.1);
      }
      if (map.current.getLayer('radius-circle-outline')) {
        map.current.setPaintProperty('radius-circle-outline', 'line-width', 2);
        map.current.setPaintProperty('radius-circle-outline', 'line-opacity', 0.5);
      }
      if (map.current.getLayer('radius-edge')) {
        map.current.setPaintProperty('radius-edge', 'line-width', 20);
        map.current.setPaintProperty('radius-edge', 'line-opacity', 0);
      }
      
      // Auto-zoom to fit the entire radius circle
      const radiusInMeters = radiusRef.current * 1609.34;
      const radiusInDegrees = radiusInMeters / 111320;
      
      // Create bounds that include the entire circle with some padding
      const bounds = [
        [lon - radiusInDegrees * 1.2, lat - radiusInDegrees * 1.2], // Southwest
        [lon + radiusInDegrees * 1.2, lat + radiusInDegrees * 1.2], // Northeast
      ];
      
      map.current.fitBounds(bounds, {
        padding: 40,
        duration: 800,
        maxZoom: 15,
      });
    };

    // Mouse enter on edge - change cursor to show resizing
    const onMouseEnter = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'ew-resize';
      }
    };

    // Mouse leave edge - restore cursor
    const onMouseLeave = () => {
      if (map.current && !dragStateRef.current.isDragging) {
        map.current.getCanvas().style.cursor = 'default';
      }
    };

    // Attach event handlers once
    map.current.on('mouseenter', 'radius-edge', onMouseEnter);
    map.current.on('mouseleave', 'radius-edge', onMouseLeave);
    map.current.on('mousedown', 'radius-edge', onMouseDown);
    map.current.on('mousemove', onMouseMove);
    map.current.on('mouseup', stopDragging);
    map.current.on('mouseleave', stopDragging);

    return () => {
      // Cleanup event listeners
      if (map.current) {
        try {
          map.current.off('mouseenter', 'radius-edge', onMouseEnter);
          map.current.off('mouseleave', 'radius-edge', onMouseLeave);
          map.current.off('mousedown', 'radius-edge', onMouseDown);
          map.current.off('mousemove', onMouseMove);
          map.current.off('mouseup', stopDragging);
          map.current.off('mouseleave', stopDragging);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentLocation]); // Only re-run if location changes

  // Update radius circle and markers (separate from drag handlers)
  useEffect(() => {
    if (!map.current || !currentLocation?.coordinates) return;
    
    // Don't update layers while actively dragging - wait until drag is complete
    if (isDraggingRadius) {
      return;
    }

    const { latitude: lat, longitude: lon } = currentLocation.coordinates;

    const updateMapLayers = () => {
      if (!map.current) return;

      // Remove existing layers (but not event handlers)
      if (radiusCircle.current) {
        try {
          if (map.current.getLayer('radius-edge')) {
            map.current.removeLayer('radius-edge');
          }
          if (map.current.getLayer('radius-circle-outline')) {
            map.current.removeLayer('radius-circle-outline');
          }
          if (map.current.getLayer('radius-circle')) {
            map.current.removeLayer('radius-circle');
          }
          if (map.current.getSource('radius-circle')) {
            map.current.removeSource('radius-circle');
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
        
        radiusCircle.current = null;
      }
      
      // Remove all markers
      markers.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          // Ignore errors
        }
      });
      markers.current = [];

      // Add radius circle - generate proper geographic circle polygon
      const radiusInMeters = radius * 1609.34; // Convert miles to meters
      
      // Generate circle polygon with proper geographic coordinates
      const generateCirclePolygon = (centerLon: number, centerLat: number, radiusInMeters: number, points = 64) => {
        const coords = [];
        const distancePerDegree = 111320; // meters per degree at equator
        const latDistancePerDegree = distancePerDegree;
        const lonDistancePerDegree = distancePerDegree * Math.cos(centerLat * Math.PI / 180);
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusInMeters * Math.cos(angle);
          const dy = radiusInMeters * Math.sin(angle);
          const deltaLon = dx / lonDistancePerDegree;
          const deltaLat = dy / latDistancePerDegree;
          coords.push([centerLon + deltaLon, centerLat + deltaLat]);
        }
        return coords;
      };
      
      const circleCoords = generateCirclePolygon(lon, lat, radiusInMeters);

      const circleGeoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [circleCoords],
          },
          properties: {},
        }],
      };

      map.current.addSource('radius-circle', {
        type: 'geojson',
        data: circleGeoJSON,
      });

      map.current.addLayer({
        id: 'radius-circle',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': token.colorPrimary,
          'fill-opacity': 0.1,
        },
      });
      
      map.current.addLayer({
        id: 'radius-circle-outline',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': token.colorPrimary,
          'line-width': 2,
          'line-opacity': 0.5,
        },
      });

      // Add edge line for dragging (wider hit area)
      map.current.addLayer({
        id: 'radius-edge',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': token.colorPrimary,
          'line-width': 20,
          'line-opacity': 0,
        },
      });

      radiusCircle.current = true;
      
      // Auto-zoom to fit the entire radius circle on initial load
      if (!isDraggingRadius) {
        const radiusInDegrees = radiusInMeters / 111320;
        const bounds = [
          [lon - radiusInDegrees * 1.2, lat - radiusInDegrees * 1.2], // Southwest
          [lon + radiusInDegrees * 1.2, lat + radiusInDegrees * 1.2], // Northeast
        ];
        
        map.current.fitBounds(bounds, {
          padding: 40,
          duration: 1000,
          maxZoom: 15,
        });
      }

      // Add marker for current location (larger, primary color)
      const currentMarkerEl = document.createElement('div');
      currentMarkerEl.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${token.colorPrimary};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          position: relative;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const currentMarker = new maptilerSdk.Marker({
        element: currentMarkerEl,
        anchor: 'bottom',
      })
        .setLngLat([lon, lat])
        .setPopup(
          new maptilerSdk.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">Your Deal Location</div>
              <div style="font-size: 12px; color: #666;">${currentLocation.name}</div>
              <div style="font-size: 11px; color: #999; margin-top: 4px;">${currentLocation.address.street}, ${currentLocation.address.city}</div>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current.push(currentMarker);

      // Add markers for deals within radius (all are same category now)
      dealsInRadius.forEach((deal, index) => {
        const merchant = getMerchantAccount(deal.accountId || "");
        const isCompetitor = deal.accountId?.startsWith('competitor-');
        
        // Calculate if price is lower than current deal
        const currentBestPrice = currentDeal?.options?.length > 0 
          ? Math.min(...(currentDeal.options.map(o => o.grouponPrice) || [0]))
          : 0;
        const competitorBestPrice = deal.options.length > 0
          ? Math.min(...deal.options.map(o => o.grouponPrice))
          : 0;
        const isPriceLower = isCompetitor && competitorBestPrice > 0 && currentBestPrice > 0 && competitorBestPrice < currentBestPrice;
        
        const markerColor = isPriceLower ? token.colorError : (isCompetitor ? token.colorWarning : token.colorSuccess);
        
        const markerEl = document.createElement('div');
        
        markerEl.innerHTML = `
          <div style="
            width: ${isCompetitor ? '28px' : '24px'};
            height: ${isCompetitor ? '28px' : '24px'};
            background: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: ${isCompetitor ? '11px' : '10px'};
            cursor: pointer;
          ">${index + 1}</div>
        `;

        const popupContent = `
          <div style="padding: 8px; min-width: 200px; max-width: 250px;">
            ${isCompetitor ? `<div style="
              background: ${token.colorWarningBg};
              color: ${token.colorWarning};
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              margin-bottom: 8px;
              text-align: center;
            ">⚔️ COMPETITOR</div>` : ''}
            ${merchant ? `<div style="font-size: 11px; color: #999; margin-bottom: 4px;">${merchant.name}</div>` : ''}
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">${deal.title}</div>
            <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
              <span style="
                background: ${token.colorSuccessBg};
                color: ${token.colorSuccess};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
              ">${deal.category}</span>
              <span style="
                background: ${token.colorBgTextHover};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
              ">${deal.status}</span>
            </div>
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${deal.location.name}</div>
            <div style="font-size: 10px; color: #999; margin-bottom: 6px;">${deal.distance.toFixed(1)} miles away</div>
            ${deal.options.length > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 15px; font-weight: 700; color: ${isPriceLower ? token.colorError : token.colorSuccess};">
                    $${deal.options[0].grouponPrice}
                  </span>
                  <span style="font-size: 11px; color: #999; text-decoration: line-through;">
                    $${deal.options[0].regularPrice}
                  </span>
                  <span style="
                    background: ${isPriceLower ? token.colorErrorBg : token.colorSuccessBg};
                    color: ${isPriceLower ? token.colorError : token.colorSuccess};
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                  ">${deal.options[0].discount}% OFF</span>
                </div>
                ${isPriceLower ? `<div style="
                  color: ${token.colorError};
                  font-size: 10px;
                  font-weight: 600;
                  margin-top: 4px;
                ">⚠️ Lower than your deal price!</div>` : ''}
              </div>
            ` : ''}
            ${deal.stats && deal.stats.purchases > 0 ? `
              <div style="font-size: 10px; color: #999; margin-top: 6px;">
                ${deal.stats.purchases} sold
              </div>
            ` : ''}
          </div>
        `;

        const marker = new maptilerSdk.Marker({
          element: markerEl,
          anchor: 'bottom',
        })
          .setLngLat([deal.location.coordinates!.longitude, deal.location.coordinates!.latitude])
          .setPopup(
            new maptilerSdk.Popup({ offset: 25 }).setHTML(popupContent)
          )
          .addTo(map.current);

        markers.current.push(marker);
      });

      // Note: Initial zoom is already set above to show the entire radius circle
    };

    // Check if map is loaded, if not wait for load event
    if (map.current.loaded()) {
      updateMapLayers();
    } else {
      map.current.once('load', updateMapLayers);
    }
  }, [currentLocation, dealsInRadius, radius, token, currentDeal, isDraggingRadius]); // isDraggingRadius in deps ensures update after drag ends

  if (!currentLocation?.coordinates) {
    return (
      <Card size="small" style={{ margin: '0 16px 16px 16px' }}>
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '20px 0' }}>
          <MapPin size={32} style={{ color: token.colorTextTertiary }} />
          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
            No location data available for this account
          </Text>
        </Space>
      </Card>
    );
  }

  return (
    <Collapse
      defaultActiveKey={['similar-deals-map']}
      ghost
      expandIconPosition="start"
      bordered={false}
      className="sidebar-collapse-no-radius"
      style={{ 
        background: 'transparent',
        borderBottom: `1px solid ${token.colorBorder}`,
      }}
      expandIcon={({ isActive }) => (
        <ChevronRight 
          size={16} 
          style={{ 
            transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} 
        />
      )}
      items={[
        {
          key: 'similar-deals-map',
          label: (
            <Text strong style={{ fontSize: 16 }}>Nearby Competitor Deals</Text>
          ),
          children: (
            <div style={{ padding: '0 0 20px 0' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Map Container */}
                <div style={{ position: 'relative' }}>
                  <div
                    ref={mapContainer}
                    style={{
                      width: '100%',
                      height: mapExpanded ? 400 : 250,
                      borderRadius: 8,
                      transition: 'height 0.3s ease',
                      overflow: 'hidden',
                      border: `1px solid ${token.colorBorder}`,
                    }}
                  />
                  <Tooltip title={mapExpanded ? "Minimize" : "Expand"}>
                    <div
                      onClick={() => setMapExpanded(!mapExpanded)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        zIndex: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = token.colorBgTextHover;
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = token.colorBgContainer;
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      {mapExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </div>
                  </Tooltip>
                </div>

                {/* Summary & Legend */}
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Competitor deals in {radius} {radius === 1 ? 'mile' : 'miles'}:
                    </Text>
                    <Text type="secondary" strong style={{ fontSize: 12 }}>{dealsInRadius.length}</Text>
                  </div>
                  {dealsInRadius.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Nearest:</Text>
                      <Text type="secondary" strong style={{ fontSize: 12 }}>
                        {dealsInRadius[0].distance.toFixed(1)} mi
                      </Text>
                    </div>
                  )}
                  
                  {/* Map Legend */}
                  <div style={{ 
                    marginTop: 12, 
                    padding: 8, 
                    background: token.colorBgLayout,
                    borderRadius: 6,
                    border: `1px solid ${token.colorBorder}`,
                  }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Map Legend:
                    </Text>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16,
                          height: 16,
                          background: token.colorPrimary,
                          border: '2px solid white',
                          borderRadius: '50%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                        <Text type="secondary" style={{ fontSize: 10 }}>Your Deal Location</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16,
                          height: 16,
                          background: token.colorWarning,
                          border: '2px solid white',
                          borderRadius: '50%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                        <Text type="secondary" style={{ fontSize: 10 }}>Competitor Deal</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16,
                          height: 16,
                          background: token.colorError,
                          border: '2px solid white',
                          borderRadius: '50%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                        <Text type="secondary" style={{ fontSize: 10 }}>Lower Price Than Yours</Text>
                      </div>
                    </Space>
                  </div>
                </Space>

                {/* Deal Previews */}
                {dealsInRadius.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                      Competitor Deals
                    </Text>
                    <Row gutter={[12, 12]}>
                      {dealsInRadius.slice(0, 6).map((deal, index) => {
                        const featuredImage = deal.content.media.find(m => m.isFeatured) || deal.content.media[0];
                        const imageUrl = featuredImage?.url || "/images/ai/chef-cooking.jpg";
                        const merchant = getMerchantAccount(deal.accountId || "");
                        
                        // Calculate if competitor price is better than current deal
                        const currentBestPrice = currentDeal?.options?.length > 0 
                          ? Math.min(...(currentDeal.options.map(o => o.grouponPrice) || [0]))
                          : 0;
                        const competitorBestPrice = deal.options.length > 0
                          ? Math.min(...deal.options.map(o => o.grouponPrice))
                          : 0;
                        const isPriceLower = competitorBestPrice > 0 && currentBestPrice > 0 && competitorBestPrice < currentBestPrice;

                        return (
                          <Col xs={24} sm={12} key={deal.id}>
                            <Card
                              size="small"
                              style={{ 
                                cursor: "pointer",
                                border: `1px solid ${isPriceLower ? token.colorErrorBorder : token.colorBorder}`,
                                borderRadius: 8,
                              }}
                              hoverable
                              bodyStyle={{ padding: 8 }}
                            >
                              <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ position: 'relative' }}>
                                  <Image
                                    src={imageUrl}
                                    width={70}
                                    height={70}
                                    style={{
                                      borderRadius: 6,
                                      objectFit: "cover",
                                    }}
                                    fallback="/images/ai/chef-cooking.jpg"
                                    preview={false}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 4,
                                      left: 4,
                                      background: token.colorSuccess,
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 10,
                                      fontWeight: 600,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ marginBottom: 4 }}>
                                    {merchant && (
                                      <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>
                                        {merchant.name}
                                      </Text>
                                    )}
                                    <Text strong style={{ fontSize: 12, lineHeight: 1.3, display: 'block' }}>
                                      {deal.title.length > 60
                                        ? `${deal.title.substring(0, 60)}...`
                                        : deal.title}
                                    </Text>
                                  </div>
                                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                    <MapPin size={10} color={token.colorTextSecondary} />
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                      {deal.distance.toFixed(1)} mi away
                                    </Text>
                                  </div>
                                  {deal.options.length > 0 && (
                                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Text 
                                        strong
                                        style={{ 
                                          fontSize: 13,
                                          color: isPriceLower ? token.colorError : token.colorSuccess,
                                        }}
                                      >
                                        ${deal.options[0].grouponPrice}
                                      </Text>
                                      <Text 
                                        delete 
                                        type="secondary" 
                                        style={{ fontSize: 10 }}
                                      >
                                        ${deal.options[0].regularPrice}
                                      </Text>
                                      <Tag 
                                        color={isPriceLower ? "red" : "green"} 
                                        style={{ fontSize: 9, margin: 0, padding: '0 4px' }}
                                      >
                                        {deal.options[0].discount}% off
                                      </Tag>
                                    </div>
                                  )}
                                  {isPriceLower && (
                                    <Text type="danger" style={{ fontSize: 9, display: 'block', marginTop: 4 }}>
                                      ⚠️ Lower than your deal
                                    </Text>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                    {dealsInRadius.length > 6 && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          +{dealsInRadius.length - 6} more deals nearby
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Space>
            </div>
          ),
        },
      ]}
    />
  );
};

export default SimilarDealsMap;

