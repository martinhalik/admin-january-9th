import { useState, useEffect, useRef, useMemo } from "react";
import { Card, Typography, Badge, theme, Button, Space, Row, Col } from "antd";
import {
  Phone,
  Mail,
  Maximize2,
  Plus,
  Store,
  Settings,
} from "lucide-react";
import * as maptilerSdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Location, getLocationsByAccount } from "../data/locationData";
import LocationModal from "./LocationModal";

const { Title, Text } = Typography;
const { useToken } = theme;

interface LocationsSectionProps {
  accountId?: string;
  changeCount?: number;
  selectedLocationIds?: string[];
  onLocationChange?: (locationIds: string[]) => void;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({
  accountId,
  changeCount = 0,
  selectedLocationIds = [],
  onLocationChange,
}) => {
  const { token } = useToken();
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | undefined>(undefined);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapScrollEnabled, setMapScrollEnabled] = useState(false);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const markersRef = useRef<{ [locationId: string]: any }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoize filtered locations to prevent map reinitialization on hover
  const locations = useMemo(() => {
    return allLocations.filter((loc) =>
      selectedLocationIds.includes(loc.id)
    );
  }, [allLocations, selectedLocationIds]);

  // Load locations - refresh when accountId or refreshKey changes
  useEffect(() => {
    if (accountId) {
      const accountLocations = getLocationsByAccount(accountId);
      setAllLocations(accountLocations);
    }
  }, [accountId, refreshKey]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || locations.length === 0) return;
    if (map.current) return; // Initialize map only once

    // Get API key from environment or use demo key
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";
    maptilerSdk.config.apiKey = apiKey;

    // Find center point (use first location)
    const firstLocation = locations[0];
    const centerCoords = firstLocation?.coordinates || {
      longitude: -95.7129,
      latitude: 37.0902,
    };

    map.current = new maptilerSdk.Map({
      container: mapContainer.current,
      style: maptilerSdk.MapStyle.STREETS,
      center: [centerCoords.longitude, centerCoords.latitude],
      zoom: locations.length === 1 ? 13 : 10, // Slightly zoomed out for single location
      navigationControl: false, // Disable default controls
    });

    // Disable scroll zoom by default (but keep drag enabled)
    map.current.scrollZoom.disable();

    // Add navigation controls (zoom buttons)
    map.current.addControl(
      new maptilerSdk.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false,
      }),
      "top-right"
    );

    // Enable scroll zoom and remove overlay on click
    map.current.on('click', () => {
      if (map.current && !map.current.scrollZoom.isEnabled()) {
        map.current.scrollZoom.enable();
        setMapScrollEnabled(true);
      }
    });

    // Disable scroll zoom when mouse leaves the map
    if (mapContainer.current) {
      mapContainer.current.addEventListener('mouseleave', () => {
        if (map.current && map.current.scrollZoom.isEnabled()) {
          map.current.scrollZoom.disable();
          setMapScrollEnabled(false);
        }
      });
    }

    // Add custom markers for each location
    locations.forEach((location) => {
      if (location.coordinates) {
        const markerColor = token.colorTextBase;
        const highlightColor = token.colorPrimary;

        // Create custom marker element with Groupon G logo and arrow
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.cursor = "pointer";
        el.setAttribute("data-location-id", location.id);

        // Add rectangle with Groupon G logo and arrow pointer
        el.innerHTML = `
          <div class="marker-body" style="
            width: 40px;
            height: 40px;
            background-color: ${markerColor};
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.9368 10.6142L23.933 10.5539H10.6V15.165H17.2823C16.1304 17.1796 14.1886 18.2831 12.0152 18.2831C8.78866 18.2831 5.89243 15.4583 5.89243 11.7884C5.89243 8.47681 8.59241 5.71692 12.0152 5.71692C13.8583 5.71692 15.3735 6.46459 16.8216 7.95753H23.3405C21.4634 3.02074 17.0861 0 12.0811 0C8.75697 0 5.85952 1.16839 3.55447 3.409C1.25065 5.65081 0 8.57297 0 11.756C0 15.1662 1.11778 18.0246 3.32531 20.3302C5.62913 22.7342 8.5595 24 12.0165 24C13.9787 23.9989 15.9114 23.5287 17.6488 22.6295C19.3863 21.7303 20.8768 20.429 21.9924 18.8372C23.3418 16.8887 24 14.6806 24 12.0817C24 11.6126 23.9685 11.1145 23.9368 10.6142Z" fill="white"/>
            </svg>
          </div>
          <div class="marker-arrow" style="
            position: absolute;
            bottom: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 12px solid ${markerColor};
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
            transition: all 0.2s ease;
          "></div>
        `;

        // Add hover effect for markers with smooth transitions
        const rectEl = el.querySelector(".marker-body") as HTMLElement;
        const arrowEl = el.querySelector(".marker-arrow") as HTMLElement;
        
        // Add transition for smooth animation
        if (rectEl) {
          rectEl.style.transition = "transform 0.2s ease, background-color 0.2s ease";
        }
        if (arrowEl) {
          arrowEl.style.transition = "border-top-color 0.2s ease";
        }
        
        el.onmouseenter = () => {
          setHoveredLocationId(location.id);
          if (rectEl) {
            rectEl.style.transform = "scale(1.2)";
            rectEl.style.backgroundColor = highlightColor;
          }
          if (arrowEl) {
            arrowEl.style.borderTopColor = highlightColor;
          }
        };
        el.onmouseleave = () => {
          setHoveredLocationId(null);
          if (rectEl) {
            rectEl.style.transform = "scale(1)";
            rectEl.style.backgroundColor = markerColor;
          }
          if (arrowEl) {
            arrowEl.style.borderTopColor = markerColor;
          }
        };

        const marker = new maptilerSdk.Marker({
          element: el,
          anchor: "bottom", // Anchor at the bottom point of the arrow
        })
          .setLngLat([
            location.coordinates.longitude,
            location.coordinates.latitude,
          ])
          .setPopup(
            new maptilerSdk.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <strong style="font-size: 14px;">${location.name}</strong>
                <p style="margin: 4px 0 0; font-size: 12px; color: ${token.colorTextSecondary};">
                  ${location.address.street}<br/>
                  ${location.address.city}, ${location.address.state} ${location.address.zipCode}
                </p>
              </div>`
            )
          )
          .addTo(map.current);

        // Store marker reference
        markersRef.current[location.id] = {
          marker,
          element: el,
          rectEl,
          arrowEl,
          coordinates: location.coordinates
        };
      }
    });

    // Adjust map view to fit all markers with smooth animation
    if (locations.length > 1) {
      const bounds = new maptilerSdk.LngLatBounds();
      locations.forEach((location) => {
        if (location.coordinates) {
          bounds.extend([
            location.coordinates.longitude,
            location.coordinates.latitude,
          ]);
        }
      });
      map.current.fitBounds(bounds, { 
        padding: 60,
        duration: 800, // Smooth animation
        easing: (t: number) => t * (2 - t) // Ease-out effect
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current = {};
      setMapScrollEnabled(false);
    };
  }, [locations, token]);

  // Handle hover effects - highlight marker and pan to it if out of view
  useEffect(() => {
    if (!map.current || !hoveredLocationId) return;

    const markerData = markersRef.current[hoveredLocationId];
    if (!markerData) return;

    // Highlight the marker
    const { rectEl, arrowEl, coordinates } = markerData;
    const highlightColor = token.colorPrimary;
    
    if (rectEl) {
      rectEl.style.transform = "scale(1.2)";
      rectEl.style.backgroundColor = highlightColor;
    }
    if (arrowEl) {
      arrowEl.style.borderTopColor = highlightColor;
    }

    // Only animate if location is completely out of view
    if (coordinates && map.current) {
      const bounds = map.current.getBounds();
      const point = { lng: coordinates.longitude, lat: coordinates.latitude };
      
      // Only pan if marker is outside current bounds (not visible at all)
      if (!bounds.contains(point)) {
        // Get current zoom and keep it
        const currentZoom = map.current.getZoom();
        
        // Calculate bounds that include both current view and the marker
        const currentCenter = map.current.getCenter();
        const newBounds = new maptilerSdk.LngLatBounds();
        
        // Add current center and the marker location to bounds
        newBounds.extend([currentCenter.lng, currentCenter.lat]);
        newBounds.extend([coordinates.longitude, coordinates.latitude]);
        
        // Smoothly pan to show both without aggressive centering
        map.current.fitBounds(newBounds, {
          padding: 80,
          maxZoom: currentZoom, // Don't zoom in more than current
          duration: 1200,
          easing: (t: number) => {
            // Smooth ease-in-out curve
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          },
        });
      }
      // If it's visible, do nothing - just highlight the marker
    }

    return () => {
      // Reset marker styling when hover ends - smooth transition
      const markerColor = token.colorTextBase;
      if (rectEl) {
        rectEl.style.transform = "scale(1)";
        rectEl.style.backgroundColor = markerColor;
      }
      if (arrowEl) {
        arrowEl.style.borderTopColor = markerColor;
      }
    };
  }, [hoveredLocationId, token]);

  const handleLocationModalSuccess = (newSelectedIds: string[]) => {
    onLocationChange?.(newSelectedIds);
    setIsLocationModalOpen(false);
    setEditingLocationId(undefined);
    // Reload locations in case new ones were added
    if (accountId) {
      const accountLocations = getLocationsByAccount(accountId);
      setAllLocations(accountLocations);
    }
  };

  const handleCloseLocationModal = () => {
    setIsLocationModalOpen(false);
    setEditingLocationId(undefined);
    // Refresh locations when modal closes to pick up any edits
    setRefreshKey(prev => prev + 1);
  };

  const handleUnassignLocation = (locationId: string) => {
    const newSelectedIds = selectedLocationIds.filter((id) => id !== locationId);
    onLocationChange?.(newSelectedIds);
  };

  if (!accountId) {
    return null;
  }


  const renderLocationCard = (location: Location) => {
    const isHovered = hoveredLocationId === location.id;
    
    return (
    <div
      key={location.id}
      style={{
        padding: "16px 0",
        borderBottom:
          locations.indexOf(location) < locations.length - 1
            ? `1px solid ${token.colorBorder}`
            : "none",
        backgroundColor: isHovered ? token.colorBgTextHover : "transparent",
        marginLeft: -20,
        marginRight: -20,
        paddingLeft: 20,
        paddingRight: 20,
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHoveredLocationId(location.id)}
      onMouseLeave={() => setHoveredLocationId(null)}
      onClick={() => {
        setEditingLocationId(location.id);
        setIsLocationModalOpen(true);
      }}
    >
      <Row gutter={16} align="middle">
        <Col flex="auto">
          {/* Location Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              {location.name}
            </Title>
            {location.isDraft && (
              <Badge
                count="Draft"
                style={{
                  background: token.colorWarningBg,
                  color: token.colorWarningText,
                  border: `1px solid ${token.colorWarningBorder}`,
                  fontSize: 10,
                  height: "auto",
                  lineHeight: "1",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 500,
                  boxShadow: "none",
                }}
              />
            )}
          </div>

          {/* Address - single line */}
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            {location.address.street}, {location.address.city},{" "}
            {location.address.state}, {location.address.zipCode}
          </Text>

          {/* Contact Info - inline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {location.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Phone size={13} color={token.colorTextTertiary} />
                <Text type="secondary" style={{ fontSize: 13 }}>{location.phone}</Text>
              </div>
            )}
            {location.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Mail size={13} color={token.colorTextTertiary} />
                <Text type="secondary" style={{ fontSize: 13 }}>{location.email}</Text>
              </div>
            )}
          </div>
        </Col>
        <Col>
          {/* Action Buttons */}
          <Space>
            <Button
              size="middle"
              onClick={(e) => {
                e.stopPropagation();
                setEditingLocationId(location.id);
                setIsLocationModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="middle"
              onClick={(e) => {
                e.stopPropagation();
                handleUnassignLocation(location.id);
              }}
            >
              Unassign
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
    );
  };

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 15 }}>
              Locations
            </Text>
            {changeCount > 0 && (
              <Badge
                count={changeCount}
                style={{
                  background: token.colorWarning,
                  boxShadow: "none",
                }}
              />
            )}
          </div>
        }
        extra={
          <Space size={12}>
            {locations.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {locations.length} {locations.length === 1 ? "location" : "locations"} selected
              </Text>
            )}
            <Button
              type="link"
              icon={locations.length === 0 ? <Plus size={14} /> : <Settings size={14} />}
              onClick={() => setIsLocationModalOpen(true)}
              style={{ padding: 0, height: "auto" }}
            >
              {locations.length === 0 ? "Add Locations" : "Manage Locations"}
            </Button>
          </Space>
        }
        style={{
          marginTop: 16,
          border: `1px solid ${token.colorBorder}`,
          background: token.colorBgContainer,
        }}
        styles={{
          body: {
            padding: locations.length === 0 ? "40px 20px" : "16px 20px",
          },
        }}
      >
        {locations.length === 0 ? (
          <div style={{ textAlign: "center" }}>
            <Store size={48} style={{ color: token.colorTextTertiary, marginBottom: 16 }} />
            <Title level={5} type="secondary" style={{ marginBottom: 8 }}>
              No locations selected
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
              Add locations to show where this deal is valid
            </Text>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsLocationModalOpen(true)}
            >
              Add Locations
            </Button>
          </div>
        ) : (
          <>
            {/* Map */}
            <div
              style={{
                marginBottom: 16,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                ref={mapContainer}
                style={{
                  height: mapExpanded ? "500px" : "300px",
                  width: "100%",
                  transition: "height 0.3s ease",
                }}
              />
              {/* Scroll zoom hint when disabled */}
              {!mapScrollEnabled && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: token.colorBgContainer,
                    padding: "8px 16px",
                    borderRadius: 6,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                    fontSize: 12,
                    color: token.colorTextSecondary,
                    fontWeight: 500,
                    pointerEvents: "none",
                    zIndex: 2,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  Click map to enable scroll zoom
                </div>
              )}
              <Button
                type="default"
                size="small"
                icon={<Maximize2 size={14} />}
                onClick={() => setMapExpanded(!mapExpanded)}
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  background: token.colorBgContainer,
                  boxShadow: `0 2px 6px ${token.colorBorderSecondary}`,
                  zIndex: 2,
                }}
              >
                {mapExpanded ? "Collapse map" : "Expand map"}
              </Button>
            </div>

            {/* All Locations List */}
            <div style={{ marginTop: 16 }}>
              {locations.map((location) => renderLocationCard(location))}
            </div>
          </>
        )}
      </Card>

      {/* Location Modal */}
      <LocationModal
        open={isLocationModalOpen}
        onClose={handleCloseLocationModal}
        accountId={accountId}
        selectedLocationIds={selectedLocationIds}
        onLocationChange={handleLocationModalSuccess}
        mode="multiple"
        editingLocationId={editingLocationId}
      />
    </>
  );
};

export default LocationsSection;
