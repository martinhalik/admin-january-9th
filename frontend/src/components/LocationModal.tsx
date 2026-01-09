import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Typography,
  theme,
  Space,
  Button,
  Card,
  Empty,
  Checkbox,
  message,
  Popconfirm,
  Form,
  Input,
  Row,
  Col,
  AutoComplete,
  Tag,
  Badge,
  Upload,
  Alert,
  Spin,
  Table,
  Tabs,
  App,
} from "antd";
import { MapPin, Plus, Store, Phone, Clock, Trash2, ArrowLeft, Search, Upload as UploadIcon, FileSpreadsheet, AlertCircle, CheckCircle, Edit2 } from "lucide-react";
import {
  Location,
  getLocationsByAccount,
  deleteLocation,
  createLocation,
  updateLocation,
  getLocationById,
} from "../data/locationData";
import { formatLocationHours, formatLocationAddress } from "../data/locationUtils";
import * as maptilerSdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  selectedLocationIds?: string[];
  onLocationChange?: (locationIds: string[]) => void;
  mode?: "single" | "multiple";
  editingLocationId?: string; // ID of location to edit
}

const LocationModal: React.FC<LocationModalProps> = ({
  open,
  onClose,
  accountId,
  selectedLocationIds = [],
  onLocationChange,
  mode = "multiple",
  editingLocationId,
}) => {
  const { token } = useToken();
  const { modal } = App.useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedLocationIds);
  const [view, setView] = useState<"list" | "add">("list");
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Add location form states
  const [form] = Form.useForm();
  const [addMode, setAddMode] = useState<"search" | "manual" | "import">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const isUserDragging = useRef<boolean>(false);
  const isProgrammaticMove = useRef<boolean>(false);

  // Import states
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedLocations, setParsedLocations] = useState<any[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importTab, setImportTab] = useState<string>("upload");

  // Load locations when modal opens or accountId changes
  useEffect(() => {
    let isMounted = true;

    if (open && accountId) {
      setLoading(true);
      try {
        const data = getLocationsByAccount(accountId);
        if (isMounted) {
          setLocations(data);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          message.error("Failed to load locations");
          setLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [open, accountId]);

  // Sync selected IDs with prop changes
  useEffect(() => {
    setSelectedIds(selectedLocationIds);
  }, [selectedLocationIds]);

  // Reset view when modal opens/closes
  useEffect(() => {
    if (!open) {
      setView("list");
      setAddMode("search");
      setSearchQuery("");
      setSearchOptions([]);
      setCoordinates(null);
      setEditingLocation(null);
      setGoogleSheetsUrl("");
      setParsedLocations([]);
      setImportError(null);
      setImportSuccess(false);
      setImportTab("upload");
      setHasUnsavedChanges(false);
      form.resetFields();
    }
  }, [open, form]);

  // Load editing location when editingLocationId is provided
  useEffect(() => {
    if (open && editingLocationId && accountId) {
      const location = getLocationById(accountId, editingLocationId);
      if (location) {
        setEditingLocation(location);
        setView("add");
        setAddMode("manual");
        setCoordinates(location.coordinates || null);
        
        // Populate form with location data
        form.setFieldsValue({
          name: location.name,
          street: location.address.street,
          street2: location.address.street2,
          city: location.address.city,
          state: location.address.state,
          zipCode: location.address.zipCode,
          country: location.address.country,
          phone: location.phone,
          email: location.email,
          website: location.website,
          note: location.description,
        });
      }
    } else {
      setEditingLocation(null);
    }
  }, [open, editingLocationId, accountId, form]);

  // Initialize map for manual entry in add view
  useEffect(() => {
    if (view === "add" && addMode === "manual" && open && mapContainer.current && !map.current) {
      // Default to USA center if no coordinates yet, otherwise use existing coordinates
      const defaultCoords: [number, number] = coordinates
        ? [coordinates.longitude, coordinates.latitude]
        : [-98.5795, 39.8283]; // Geographic center of USA
      
      const defaultZoom = coordinates ? 17 : 4; // Zoomed out for USA, zoomed in if we have specific coords

      // Get API key from environment or use demo key
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";
      maptilerSdk.config.apiKey = apiKey;

      map.current = new maptilerSdk.Map({
        container: mapContainer.current,
        style: maptilerSdk.MapStyle.STREETS,
        center: defaultCoords,
        zoom: defaultZoom,
        navigationControl: false, // Disable default controls to avoid duplicates
      });

      // Set cursor style for dragging
      if (mapContainer.current) {
        mapContainer.current.style.cursor = "grab";
      }

      // Disable scroll zoom but keep drag enabled
      map.current.scrollZoom.disable();
      
      // Add navigation controls (zoom buttons and compass)
      map.current.addControl(
        new maptilerSdk.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false,
        }),
        "top-right"
      );

      // Add event listeners for map interactions
      map.current.on('dragstart', () => {
        isUserDragging.current = true;
        if (mapContainer.current) {
          mapContainer.current.style.cursor = "grabbing";
        }
      });

      map.current.on('dragend', () => {
        if (mapContainer.current) {
          mapContainer.current.style.cursor = "grab";
        }
        // Reset flag after a short delay to allow coordinate update to process
        setTimeout(() => {
          isUserDragging.current = false;
        }, 100);
      });

      // Removed excessive mousemove logging to reduce console clutter

      // Create custom center marker element with Groupon G logo and arrow
      const markerElement = document.createElement("div");
      markerElement.className = "custom-marker-center";
      markerElement.style.position = "absolute";
      markerElement.style.left = "50%";
      markerElement.style.top = "50%";
      markerElement.style.transform = "translate(-50%, -100%)"; // Bottom of pin at center
      markerElement.style.pointerEvents = "none"; // Allow map dragging through the marker
      markerElement.style.zIndex = "1000";

      // Add rectangle with Groupon G logo and arrow pointer
      markerElement.innerHTML = `
        <div style="
          width: 44px;
          height: 44px;
          background-color: #262626;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        ">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.9368 10.6142L23.933 10.5539H10.6V15.165H17.2823C16.1304 17.1796 14.1886 18.2831 12.0152 18.2831C8.78866 18.2831 5.89243 15.4583 5.89243 11.7884C5.89243 8.47681 8.59241 5.71692 12.0152 5.71692C13.8583 5.71692 15.3735 6.46459 16.8216 7.95753H23.3405C21.4634 3.02074 17.0861 0 12.0811 0C8.75697 0 5.85952 1.16839 3.55447 3.409C1.25065 5.65081 0 8.57297 0 11.756C0 15.1662 1.11778 18.0246 3.32531 20.3302C5.62913 22.7342 8.5595 24 12.0165 24C13.9787 23.9989 15.9114 23.5287 17.6488 22.6295C19.3863 21.7303 20.8768 20.429 21.9924 18.8372C23.3418 16.8887 24 14.6806 24 12.0817C24 11.6126 23.9685 11.1145 23.9368 10.6142Z" fill="white"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -13px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-top: 13px solid #262626;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        "></div>
      `;

      // Add center marker to map container (not as a map marker)
      mapContainer.current.appendChild(markerElement);
      marker.current = markerElement;

      // Update coordinates when map stops moving
      const updateCoordinates = () => {
        // Don't update coordinates if this is a programmatic move
        if (isProgrammaticMove.current) {
          isProgrammaticMove.current = false;
          return;
        }
        
        const center = map.current.getCenter();
        const newCoords = {
          longitude: center.lng,
          latitude: center.lat,
        };
        setCoordinates(newCoords);
        setHasUnsavedChanges(true); // Mark as unsaved when map is moved
      };

      // Set initial coordinates if not already set
      if (!coordinates) {
        setCoordinates({
          longitude: defaultCoords[0],
          latitude: defaultCoords[1],
        });
      }

      // Only update when map finishes moving to avoid infinite loop
      map.current.on("moveend", updateCoordinates);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [view, addMode, open]);

  // Update map position when coordinates change (e.g., from search)
  // But NOT when user is dragging (to prevent infinite loop)
  useEffect(() => {
    if (map.current && coordinates && addMode === "manual" && view === "add" && !isUserDragging.current) {
      const currentCenter = map.current.getCenter();
      const newCoords: [number, number] = [
        coordinates.longitude,
        coordinates.latitude,
      ];
      
      // Only move if coordinates actually changed significantly (to avoid tiny floating point differences)
      const distance = Math.sqrt(
        Math.pow(currentCenter.lng - newCoords[0], 2) +
        Math.pow(currentCenter.lat - newCoords[1], 2)
      );
      
      if (distance > 0.0001) {
        // Set flag before moving to prevent coordinate update loop
        isProgrammaticMove.current = true;
        map.current.flyTo({ center: newCoords, zoom: 17 });
      }
    }
  }, [coordinates, addMode, view]);

  const loadLocations = () => {
    try {
      const data = getLocationsByAccount(accountId);
      setLocations(data);
    } catch (error) {
      message.error("Failed to load locations");
    }
  };

  const handleLocationToggle = (locationId: string) => {
    setHasUnsavedChanges(true);
    if (mode === "single") {
      setSelectedIds([locationId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(locationId)
          ? prev.filter((id) => id !== locationId)
          : [...prev, locationId]
      );
    }
  };

  const handleEditLocation = (locationId: string) => {
    const location = getLocationById(accountId, locationId);
    if (location) {
      setEditingLocation(location);
      setView("add");
      setAddMode("manual");
      setCoordinates(location.coordinates || null);
      
      // Populate form with location data
      form.setFieldsValue({
        name: location.name,
        street: location.address.street,
        street2: location.address.street2,
        city: location.address.city,
        state: location.address.state,
        zipCode: location.address.zipCode,
        country: location.address.country,
        phone: location.phone,
        email: location.email,
        website: location.website,
        note: location.description,
      });
    }
  };

  const handleDeleteLocation = (locationId: string, locationName: string) => {
    try {
      const success = deleteLocation(accountId, locationId);
      if (success) {
        message.success(`"${locationName}" has been deleted`);
        // Remove from selected IDs if it was selected
        setSelectedIds((prev) => prev.filter((id) => id !== locationId));
        // Reload locations
        const data = getLocationsByAccount(accountId);
        setLocations(data);
      } else {
        message.error("Failed to delete location");
      }
    } catch (error) {
      message.error("Failed to delete location");
    }
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    onLocationChange?.(selectedIds);
    onClose();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Discard unsaved changes?',
        content: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
        okText: 'Discard',
        okType: 'danger',
        cancelText: 'Stay',
        zIndex: 1100,
        onOk: () => {
          setSelectedIds(selectedLocationIds); // Reset to original selection
          setHasUnsavedChanges(false);
          onClose();
        },
      });
    } else {
      setSelectedIds(selectedLocationIds); // Reset to original selection
      onClose();
    }
  };

  // Handler for opening add location view
  const handleAddLocationClick = () => {
    setView("add");
  };

  // Handler for going back to location list
  const handleBackToList = (skipWarning: boolean = false) => {
    if (!skipWarning && hasUnsavedChanges && (addMode === "manual" || (addMode === "import" && parsedLocations.length > 0))) {
      modal.confirm({
        title: 'Discard unsaved changes?',
        content: 'You have unsaved changes. Are you sure you want to go back? Your changes will be lost.',
        okText: 'Discard',
        okType: 'danger',
        cancelText: 'Stay',
        zIndex: 1100,
        onOk: () => {
          setView("list");
          setAddMode("search");
          setSearchQuery("");
          setSearchOptions([]);
          setCoordinates(null);
          setHasUnsavedChanges(false);
          setEditingLocation(null); // Reset editing location
          form.resetFields();
        },
      });
    } else {
      setView("list");
      setAddMode("search");
      setSearchQuery("");
      setSearchOptions([]);
      setCoordinates(null);
      setHasUnsavedChanges(false);
      setEditingLocation(null); // Reset editing location
      form.resetFields();
    }
  };

  // Mock Google Places search - searches as user types
  const handleSearchQuery = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || query.length < 3) {
      setSearchOptions([]);
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock search results
      const mockResults = [
        {
          value: "1",
          label: "123 Main St, Mountain View, CA 94043",
          data: {
            name: "Mountain View Location",
            street: "123 Main St",
            city: "Mountain View",
            state: "CA",
            zipCode: "94043",
            country: "USA",
            phone: "(555) 123-4567",
            latitude: 37.4419,
            longitude: -122.143,
          },
        },
        {
          value: "2",
          label: "456 Broadway, San Francisco, CA 94133",
          data: {
            name: "San Francisco Location",
            street: "456 Broadway",
            city: "San Francisco",
            state: "CA",
            zipCode: "94133",
            country: "USA",
            phone: "(555) 234-5678",
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
        {
          value: "3",
          label: "789 Park Ave, New York, NY 10021",
          data: {
            name: "New York Location",
            street: "789 Park Ave",
            city: "New York",
            state: "NY",
            zipCode: "10021",
            country: "USA",
            phone: "(555) 345-6789",
            latitude: 40.7749,
            longitude: -73.9654,
          },
        },
      ];

      setSearchOptions(mockResults);
    } catch (error) {
      // Search error - silently fail
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection from search results
  const handleSelectLocation = async (_value: string, option: any) => {
    const placeData = option.data;
    
    setLoading(true);
    try {
      // Pre-fill form with selected location
      form.setFieldsValue({
        name: placeData.name,
        street: placeData.street,
        city: placeData.city,
        state: placeData.state,
        zipCode: placeData.zipCode,
        country: placeData.country,
        phone: placeData.phone,
      });

      setCoordinates({
        latitude: placeData.latitude,
        longitude: placeData.longitude,
      });

      // Switch to manual mode to show the form with pre-filled data
      setAddMode("manual");
      setHasUnsavedChanges(true); // Mark as unsaved when location is selected from search
      message.success("Location found! Review and save.");
    } catch (error) {
      message.error("Failed to load location");
    } finally {
      setLoading(false);
    }
  };

  // Geocode address using MapTiler API
  const geocodeAddress = async (street: string, city?: string, state?: string, zipCode?: string) => {
    try {
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";
      
      // Build query string from available address components
      const parts = [street, city, state, zipCode, 'USA'].filter(Boolean);
      const query = encodeURIComponent(parts.join(', '));
      
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${query}.json?key=${apiKey}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Extract address components from the geocoded result
        const context = feature.context || [];
        
        // Try to extract city, state, zipcode from context
        let geocodedCity = city;
        let geocodedState = state;
        let geocodedZip = zipCode;
        
        context.forEach((item: any) => {
          if (item.id.startsWith('place.') && !geocodedCity) {
            geocodedCity = item.text;
          } else if (item.id.startsWith('region.') && !geocodedState) {
            geocodedState = item.short_code?.replace('US-', '') || item.text;
          } else if (item.id.startsWith('postcode.') && !geocodedZip) {
            geocodedZip = item.text;
          }
        });
        
        return {
          coordinates: { latitude: lat, longitude: lng },
          city: geocodedCity,
          state: geocodedState,
          zipCode: geocodedZip,
        };
      }
    } catch (error) {
      // Geocoding error - silently fail
    }
    return null;
  };

  // Handle street address change with geocoding
  const handleStreetChange = async () => {
    const street = form.getFieldValue('street');
    const city = form.getFieldValue('city');
    const state = form.getFieldValue('state');
    const zipCode = form.getFieldValue('zipCode');
    
    if (!street || street.trim().length < 5) {
      return; // Need at least some street info
    }
    
    // Try to geocode
    const result = await geocodeAddress(street, city, state, zipCode);
    
    if (result) {
      // Update coordinates and zoom map
      setCoordinates(result.coordinates);
      
      // Prefill city, state, zip if they were found and fields are empty
      const updates: any = {};
      if (result.city && !city) updates.city = result.city;
      if (result.state && !state) updates.state = result.state;
      if (result.zipCode && !zipCode) updates.zipCode = result.zipCode;
      
      if (Object.keys(updates).length > 0) {
        form.setFieldsValue(updates);
      }
    }
  };

  // Handler for submitting new or edited location
  const handleSubmitLocation = async (values: any) => {
    setLoading(true);
    try {
      // Validate that we have coordinates
      if (!coordinates) {
        message.warning("Please wait for the map to load or adjust the pin location");
        setLoading(false);
        return;
      }

      const locationData = {
        name: values.name || `${values.street}, ${values.city}`,
        address: {
          street: values.street,
          street2: values.street2,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country || "USA",
        },
        phone: values.phone,
        email: values.email,
        website: values.website,
        coordinates: coordinates,
        isActive: true,
        // Always mark as draft - will be published when deal content is published
        isDraft: true,
        description: values.note,
        updatedBy: "user",
      };

      if (editingLocation) {
        // Update existing location
        const updated = updateLocation(accountId, editingLocation.id, locationData);
        if (updated) {
          message.success("Location updated successfully!");
          
          // Reload locations and go back to list
          loadLocations();
          setHasUnsavedChanges(false);
          
          // Go back to list after editing, skip warning since we just saved
          handleBackToList(true);
        } else {
          throw new Error("Failed to update location");
        }
      } else {
        // Create new location
        createLocation(accountId, { ...locationData, createdBy: "user" });
        message.success("Location added successfully!");
        
        // Reload locations and go back to list view, skip warning since we just saved
        loadLocations();
        setHasUnsavedChanges(false);
        handleBackToList(true);
      }
    } catch (error) {
      message.error(editingLocation ? "Failed to update location" : "Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  // Parse CSV content
  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'street', 'city', 'state', 'zipcode'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
    }

    const locations = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        continue;
      }

      const location: any = {};
      headers.forEach((header, index) => {
        location[header] = values[index];
      });

      // Validate required fields
      if (!location.name || !location.street || !location.city || !location.state || !location.zipcode) {
        continue;
      }

      locations.push(location);
    }

    return locations;
  };

  // Parse Excel file (XLSX, XLS)
  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Use empty string for empty cells
          });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file must have a header row and at least one data row'));
            return;
          }

          // Extract headers and normalize to lowercase
          const headers = (jsonData[0] as any[]).map((h: any) => 
            String(h || '').trim().toLowerCase()
          );
          
          const requiredFields = ['name', 'street', 'city', 'state', 'zipcode'];
          const missingFields = requiredFields.filter(field => !headers.includes(field));
          
          if (missingFields.length > 0) {
            reject(new Error(`Missing required columns: ${missingFields.join(', ')}`));
            return;
          }

          const locations = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            
            // Skip empty rows
            if (!row || row.every(cell => !cell)) {
              continue;
            }

            const location: any = {};
            headers.forEach((header, index) => {
              location[header] = String(row[index] || '').trim();
            });

            // Validate required fields
            if (!location.name || !location.street || !location.city || !location.state || !location.zipcode) {
              continue;
            }

            locations.push(location);
          }

          resolve(locations);
        } catch (error: any) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsBinaryString(file);
    });
  };

  // Handle file upload (CSV, Excel, Numbers)
  const handleFileUpload = async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    setParsedLocations([]);
    setImportSuccess(false);

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    try {
      let parsed: any[] = [];

      // Handle Excel files (.xlsx, .xls)
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        parsed = await parseExcel(file);
      }
      // Handle CSV files
      else if (fileExtension === '.csv') {
        const content = await file.text();
        parsed = parseCSV(content);
      }
      // Handle Numbers files - needs to be exported first
      else if (fileExtension === '.numbers') {
        setImportError(
          'Numbers files are not directly supported. Please export your file to Excel (.xlsx) or CSV format from Numbers: File → Export To → Excel/CSV'
        );
        setImportLoading(false);
        return false;
      }
      // Unsupported file type
      else {
        setImportError(`Unsupported file type: ${fileExtension}. Please use CSV or Excel (.xlsx, .xls)`);
        setImportLoading(false);
        return false;
      }

      if (parsed.length === 0) {
        setImportError('No valid locations found in file');
      } else {
        setParsedLocations(parsed);
        setImportSuccess(true);
        message.success(`Successfully parsed ${parsed.length} location(s) from ${fileExtension.toUpperCase().substring(1)} file`);
      }
    } catch (error: any) {
      setImportError(error.message || 'Failed to parse file');
      message.error('Failed to parse file');
    } finally {
      setImportLoading(false);
    }

    return false; // Prevent auto upload
  };

  // Handle Google Sheets URL
  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl.trim()) {
      message.warning('Please enter a Google Sheets URL');
      return;
    }

    setImportError(null);
    setImportLoading(true);
    setParsedLocations([]);
    setImportSuccess(false);

    try {
      // Extract spreadsheet ID from URL
      const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Invalid Google Sheets URL. Please use a valid share link.');
      }

      const spreadsheetId = match[1];
      
      // Convert to CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
      
      // Fetch the CSV data
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error('Unable to access sheet. Please make sure the sheet is publicly accessible (Anyone with the link can view).');
        }
        throw new Error(`Failed to fetch sheet data (Status: ${response.status})`);
      }

      const content = await response.text();
      const parsed = parseCSV(content);
      
      if (parsed.length === 0) {
        setImportError('No valid locations found in Google Sheet');
      } else {
        setParsedLocations(parsed);
        setImportSuccess(true);
        setHasUnsavedChanges(true);
        message.success(`Successfully imported ${parsed.length} location(s) from Google Sheets`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to import from Google Sheets';
      setImportError(errorMessage);
      message.error(errorMessage);
    } finally {
      setImportLoading(false);
    }
  };

  // Handle bulk import of locations
  const handleBulkImport = async () => {
    if (parsedLocations.length === 0) {
      message.warning('No locations to import');
      return;
    }

    setImportLoading(true);
    try {
      let successCount = 0;
      let failureCount = 0;

      for (const loc of parsedLocations) {
        try {
          const locationData = {
            name: loc.name,
            address: {
              street: loc.street,
              street2: loc.street2 || '',
              city: loc.city,
              state: loc.state,
              zipCode: loc.zipcode,
              country: loc.country || 'USA',
            },
            phone: loc.phone || '',
            email: loc.email || '',
            website: loc.website || '',
            coordinates: loc.latitude && loc.longitude ? {
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude),
            } : {
              latitude: 0,
              longitude: 0,
            },
            isActive: true,
            isDraft: true,
            description: loc.note || '',
            createdBy: 'user',
          };

          createLocation(accountId, locationData);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Successfully imported ${successCount} location(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
        loadLocations();
        setHasUnsavedChanges(false);
        handleBackToList();
      } else {
        message.error('Failed to import any locations');
      }
    } catch (error) {
      message.error('Failed to import locations');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <>
      {/* Hidden form to prevent useForm warning - always keeps form instance connected */}
      <Form form={form} style={{ display: 'none' }} />
      
      <Modal
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={view === "add" && addMode === "manual" ? 1200 : 700}
        centered
        maskClosable={true}
        styles={{
          body: {
            padding: 0,
            maxHeight: view === "add" && addMode === "manual" ? "650px" : "calc(100vh - 200px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
      {/* Fixed Header */}
      <div
        style={{
          background: token.colorBgContainer,
          position: "sticky",
          top: 0,
          zIndex: 1,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: view === "add" && addMode === "manual" 
            ? `${token.padding}px ${token.padding}px ${token.paddingSM}px` 
            : `${token.paddingLG}px ${token.paddingLG}px ${token.padding}px`,
        }}
      >
        {view === "list" ? (
          // Location List Header
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: token.marginSM,
                marginBottom: token.marginXS,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: token.borderRadiusLG,
                  background: `${token.colorPrimary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: token.colorPrimary,
                }}
              >
                <MapPin size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    Manage Locations
                  </Title>
                  {locations.length > 0 && selectedIds.length > 0 && (
                    <Tag
                      style={{
                        margin: 0,
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {selectedIds.length} selected
                    </Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {locations.length === 0
                    ? "Add your first location"
                    : `Select locations where this deal is valid`}
                </Text>
              </div>
              <Button
                type="link"
                icon={<Plus size={14} />}
                onClick={handleAddLocationClick}
                style={{
                  padding: 0,
                  height: "auto",
                  fontSize: 13,
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Add Location
              </Button>
            </div>
          </>
        ) : (
          // Add Location Header
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: token.marginXS,
            }}
          >
            {/* iOS-style Back Button */}
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              onClick={
                editingLocation
                  ? () => handleBackToList() // Always go back to list when editing
                  : addMode === "manual"
                  ? () => {
                      // Go back to search mode
                      setAddMode("search");
                      setSearchQuery("");
                      setSearchOptions([]);
                      form.resetFields();
                    }
                  : addMode === "import"
                  ? () => {
                      setAddMode("search");
                      setGoogleSheetsUrl("");
                      setParsedLocations([]);
                      setImportError(null);
                      setImportSuccess(false);
                      setImportTab("upload");
                    }
                  : () => handleBackToList()
              }
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            />

            <Title level={5} style={{ margin: 0, flex: 1 }}>
              {editingLocation ? "Edit Location" : (addMode === "manual" ? "Enter location manually" : addMode === "import" ? "Import Locations" : "Add New Location")}
            </Title>
          </div>
        )}
      </div>

      {/* Content Area - switches between list and add views */}
      {view === "list" ? (
        <>
          {/* Scrollable Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: `${token.paddingLG}px`,
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Text type="secondary">Loading locations...</Text>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {/* Existing Locations List */}
                {locations.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: token.marginSM,
                  }}
                >
                  <Text
                    type="secondary"
                    strong
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Available Locations
                  </Text>
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setSelectedIds(locations.map((loc) => loc.id))}
                      style={{
                        padding: 0,
                        height: "auto",
                        fontSize: 12,
                      }}
                    >
                      Select All
                    </Button>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      •
                    </Text>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setSelectedIds([])}
                      style={{
                        padding: 0,
                        height: "auto",
                        fontSize: 12,
                      }}
                    >
                      Deselect All
                    </Button>
                  </Space>
                </div>
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  {locations.map((location) => {
                    const isSelected = selectedIds.includes(location.id);
                    return (
                      <Card
                        key={location.id}
                        size="small"
                        hoverable
                        onClick={() => handleLocationToggle(location.id)}
                        style={{
                          cursor: "pointer",
                          border: isSelected
                            ? `2px solid ${token.colorPrimary}`
                            : `1px solid ${token.colorBorder}`,
                          background: token.colorBgContainer,
                          transition: "all 0.2s ease",
                        }}
                        styles={{
                          body: {
                            padding: token.paddingSM,
                          },
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: token.marginSM,
                          }}
                        >
                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleLocationToggle(location.id);
                            }}
                            style={{ flexShrink: 0 }}
                          />

                          {/* Location Icon */}
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: token.borderRadius,
                              background: isSelected
                                ? token.colorPrimary
                                : token.colorBgTextHover,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isSelected
                                ? "#fff"
                                : token.colorTextSecondary,
                              flexShrink: 0,
                            }}
                          >
                            <Store size={18} />
                          </div>

                          {/* Location Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 2,
                              }}
                            >
                              <Text
                                strong
                                style={{
                                  fontSize: 14,
                                  color: token.colorText,
                                }}
                              >
                                {location.name}
                              </Text>
                              {location.isDraft && (
                                <Tag
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    padding: "2px 6px",
                                    lineHeight: "1",
                                    height: "auto",
                                    background: token.colorWarningBg,
                                    color: token.colorWarningText,
                                    border: `1px solid ${token.colorWarningBorder}`,
                                    borderRadius: 4,
                                    fontWeight: 500,
                                  }}
                                >
                                  Draft
                                </Tag>
                              )}
                            </div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                marginBottom: 4,
                              }}
                            >
                              {formatLocationAddress(location.address)}
                            </Text>

                            {/* Additional Info */}
                            {(location.phone || location.hours) && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: token.marginSM,
                                  marginTop: 6,
                                }}
                              >
                                {location.phone && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <Phone size={11} color={token.colorTextTertiary} />
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 11 }}
                                    >
                                      {location.phone}
                                    </Text>
                                  </div>
                                )}
                                {location.hours && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      minWidth: 0,
                                      flex: 1,
                                    }}
                                  >
                                    <Clock size={11} color={token.colorTextTertiary} style={{ flexShrink: 0 }} />
                                    <Text
                                      type="secondary"
                                      style={{ 
                                        fontSize: 11,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {formatLocationHours(location.hours)}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Edit and Delete Buttons */}
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <Button
                              type="text"
                              size="small"
                              icon={<Edit2 size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLocation(location.id);
                              }}
                              style={{
                                opacity: 0.6,
                              }}
                            />
                          <Popconfirm
                            title="Delete location"
                            description={`Are you sure you want to delete "${location.name}"?`}
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDeleteLocation(location.id, location.name);
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<Trash2 size={16} />}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                opacity: 0.6,
                              }}
                            />
                          </Popconfirm>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              </div>
            )}

            {/* Empty State for No Locations */}
            {locations.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">No locations found</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Add your first location using the button above
                    </Text>
                  </Space>
                }
              />
            )}
          </Space>
        )}
      </div>
        </>
      ) : (
        // Add Location View
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: addMode === "manual" ? token.padding : token.paddingLG,
          }}
        >
          {/* Search Mode */}
          {addMode === "search" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: token.marginLG,
                  paddingTop: token.paddingSM,
                }}
              >
                <MapPin
                  size={48}
                  style={{ color: token.colorPrimary, marginBottom: token.marginSM }}
                />
                <Title level={4} style={{ margin: 0, marginBottom: token.marginXXS }}>
                  Find a Location
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Start typing an address to get suggestions
                </Text>
              </div>

              <AutoComplete
                options={searchOptions}
                value={searchQuery}
                onChange={handleSearchQuery}
                onSelect={handleSelectLocation}
                size="large"
                style={{ width: "100%", marginBottom: token.marginSM }}
                notFoundContent={loading ? "Searching..." : searchQuery.length >= 3 ? "No locations found" : null}
              >
                <Input
                  placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
                  prefix={<Search size={16} style={{ color: token.colorTextTertiary }} />}
                  size="large"
                />
              </AutoComplete>

              {/* Helper text and Manual Entry Link */}
              <div style={{ textAlign: "center" }}>
                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: token.marginXS }}>
                    Keep typing... (minimum 3 characters)
                  </Text>
                )}
                <Space split={<Text type="secondary">•</Text>}>
                  <Button
                    type="link"
                    onClick={() => setAddMode("manual")}
                    style={{ padding: 0, height: "auto", fontSize: 13 }}
                  >
                    Enter manually
                  </Button>
                  <Button
                    type="link"
                    onClick={() => setAddMode("import")}
                    style={{ padding: 0, height: "auto", fontSize: 13 }}
                  >
                    Import locations
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {/* Manual Entry Mode */}
          {addMode === "manual" && (
            <div 
              style={{ 
                display: "flex", 
                gap: token.marginLG,
              }}
            >
              {/* Form Column */}
              <div style={{ flex: "0 0 48%", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSubmitLocation}
                onValuesChange={() => setHasUnsavedChanges(true)}
                  style={{ 
                    marginBottom: 0,
                  }}
              >
                <Form.Item
                  label="Location Name"
                  name="name"
                    style={{ marginBottom: 12 }}
                >
                  <Input placeholder="e.g., Main Street Store" />
                </Form.Item>

                  <Form.Item
                    label="Street"
                    name="street"
                    rules={[
                      { required: true, message: "Please enter street address" },
                    ]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input 
                      placeholder="Street address" 
                      onBlur={handleStreetChange}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Street Address 2 (Optional)"
                    name="street2"
                    style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="Apartment, suite, etc." />
                  </Form.Item>

                  <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    label="City"
                    name="city"
                        rules={[{ required: true, message: "Required" }]}
                        style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                        label="State"
                    name="state"
                        rules={[{ required: true, message: "Required" }]}
                        style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>
              </Row>

                  <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                        label="ZIP Code"
                    name="zipCode"
                        rules={[{ required: true, message: "Required" }]}
                        style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="ZIP code" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                      <Form.Item 
                        label="Phone" 
                        name="phone"
                        style={{ marginBottom: 12 }}
                      >
                    <Input placeholder="Phone number" />
                  </Form.Item>
                </Col>
              </Row>

                  <Form.Item 
                    label="Note" 
                    name="note"
                    style={{ marginBottom: 12 }}
                  >
                <TextArea
                      rows={2}
                      placeholder="Additional info"
                />
              </Form.Item>

              {editingLocation?.isDraft && (
                    <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge
                      count="Draft"
                      style={{
                        background: token.colorInfoBg,
                        color: token.colorInfo,
                        border: `1px solid ${token.colorInfoBorder}`,
                        fontSize: 11,
                        height: "auto",
                        lineHeight: "1",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontWeight: 500,
                        boxShadow: "none",
                      }}
                    />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Will be published with deal content
                    </Text>
                  </div>
                </div>
              )}
                </Form>
              </div>

              {/* Map Column */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 13 }}>
                  Adjust location on map
                </Text>
                </div>
                <div
                  ref={mapContainer}
                  style={{
                    flex: 1,
                    minHeight: 400,
                    maxHeight: 520,
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorder}`,
                    position: "relative",
                  }}
                />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>
                  Drag the map to position the pin. Use zoom controls to adjust precision.
                </Text>
              </div>
            </div>
          )}

          {/* Import Mode */}
          {addMode === "import" && (
            <div>
              {/* Instructions */}
              <Card
                style={{
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  marginBottom: token.marginLG,
                }}
              >
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
                    <FileSpreadsheet size={20} style={{ color: token.colorPrimary }} />
                    <Text strong style={{ fontSize: 14 }}>CSV Format Requirements</Text>
                  </div>
                  <Paragraph style={{ margin: 0, fontSize: 13 }} type="secondary">
                    Your CSV file must include the following columns (column names should match exactly):
                  </Paragraph>
                  <div style={{ 
                    background: token.colorBgContainer, 
                    padding: token.paddingSM,
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorder}`,
                  }}>
                    <Text code style={{ fontSize: 12 }}>
                      name, street, city, state, zipcode
                    </Text>
                  </div>
                  <Paragraph style={{ margin: 0, fontSize: 12 }} type="secondary">
                    <strong>Optional columns:</strong> street2, phone, email, website, country, latitude, longitude, note
                  </Paragraph>
                  <Paragraph style={{ margin: 0, fontSize: 12, marginTop: 4 }} type="secondary">
                    <strong>Example:</strong>
                  </Paragraph>
                  <div style={{ 
                    background: token.colorBgContainer, 
                    padding: token.paddingSM,
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorder}`,
                    fontSize: 11,
                    overflowX: "auto",
                  }}>
                    <code>
                      name,street,city,state,zipcode,phone<br/>
                      Downtown Store,123 Main St,Seattle,WA,98101,(206) 555-0100<br/>
                      Uptown Location,456 Pine Ave,Seattle,WA,98102,(206) 555-0200
                    </code>
                  </div>
                </Space>
              </Card>

              {/* Tabbed Upload Section */}
              <Tabs
                activeKey={importTab}
                onChange={setImportTab}
                items={[
                  {
                    key: 'upload',
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UploadIcon size={14} />
                        Upload File
                      </span>
                    ),
                    children: (
                      <div>
                        <Upload.Dragger
                          accept=".csv,.xlsx,.xls"
                          beforeUpload={handleFileUpload}
                          showUploadList={false}
                          disabled={importLoading}
                        >
                          <div style={{ padding: token.paddingLG }}>
                            <UploadIcon size={32} style={{ color: token.colorPrimary, marginBottom: token.marginXS }} />
                            <Paragraph style={{ margin: 0, color: token.colorText }}>
                              Click or drag file to upload
                            </Paragraph>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Supports: CSV (.csv), Excel (.xlsx, .xls)
                            </Text>
                            <div style={{ marginTop: token.marginXS }}>
                              <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                                Note: Numbers files should be exported to Excel or CSV first
                              </Text>
                            </div>
                          </div>
                        </Upload.Dragger>
                      </div>
                    ),
                  },
                  {
                    key: 'sheets',
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileSpreadsheet size={14} />
                        Google Sheets
                      </span>
                    ),
                    children: (
                      <div>
                        <Alert
                          message="Make sure your Google Sheet is publicly accessible"
                          description="Go to Share → Change to 'Anyone with the link' → Viewer"
                          type="info"
                          showIcon
                          style={{ marginBottom: token.marginLG, fontSize: 12 }}
                        />
                        <Space.Compact style={{ width: "100%" }}>
                          <Input
                            placeholder="Paste Google Sheets URL here"
                            value={googleSheetsUrl}
                            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                            disabled={importLoading}
                            prefix={<FileSpreadsheet size={14} style={{ color: token.colorTextTertiary }} />}
                            size="large"
                          />
                          <Button 
                            type="primary"
                            onClick={handleGoogleSheetsImport}
                            loading={importLoading}
                            disabled={!googleSheetsUrl.trim()}
                            size="large"
                          >
                            Import
                          </Button>
                        </Space.Compact>
                      </div>
                    ),
                  },
                ]}
              />

              {/* Loading State */}
              {importLoading && (
                <div style={{ 
                  textAlign: "center", 
                  padding: `${token.paddingLG}px 0`,
                  marginTop: token.marginLG,
                }}>
                  <Spin size="large" />
                  <Text type="secondary" style={{ display: "block", marginTop: token.marginSM }}>
                    Processing locations...
                  </Text>
                </div>
              )}

              {/* Error State */}
              {importError && !importLoading && (
                <Alert
                  message="Import Error"
                  description={importError}
                  type="error"
                  showIcon
                  icon={<AlertCircle size={16} />}
                  closable
                  onClose={() => setImportError(null)}
                  style={{ marginTop: token.marginLG }}
                />
              )}

              {/* Success State with Preview */}
              {importSuccess && parsedLocations.length > 0 && !importLoading && (
                <div style={{ marginTop: token.marginLG }}>
                  <Alert
                    message="Locations Parsed Successfully"
                    description={`Found ${parsedLocations.length} valid location(s). Review below and click "Import All" to add them.`}
                    type="success"
                    showIcon
                    icon={<CheckCircle size={16} />}
                    style={{ marginBottom: token.marginSM }}
                  />
                  
                  {/* Preview Table */}
                  <Table
                    dataSource={parsedLocations}
                    rowKey={(_record, index) => index?.toString() || '0'}
                    size="small"
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 5, size: "small" }}
                    columns={[
                      {
                        title: 'Name',
                        dataIndex: 'name',
                        key: 'name',
                        width: 150,
                        ellipsis: true,
                      },
                      {
                        title: 'Street',
                        dataIndex: 'street',
                        key: 'street',
                        width: 150,
                        ellipsis: true,
                      },
                      {
                        title: 'City',
                        dataIndex: 'city',
                        key: 'city',
                        width: 100,
                      },
                      {
                        title: 'State',
                        dataIndex: 'state',
                        key: 'state',
                        width: 60,
                      },
                      {
                        title: 'ZIP',
                        dataIndex: 'zipcode',
                        key: 'zipcode',
                        width: 80,
                      },
                      {
                        title: 'Phone',
                        dataIndex: 'phone',
                        key: 'phone',
                        width: 120,
                        ellipsis: true,
                        render: (text) => text || '-',
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fixed Footer - Only show for list view, manual entry mode, and import mode with parsed data */}
      {(view === "list" || (view === "add" && addMode === "manual") || (view === "add" && addMode === "import" && parsedLocations.length > 0)) && (
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: view === "add" && addMode === "manual" 
              ? `${token.paddingSM}px ${token.padding}px`
              : `${token.paddingSM}px ${token.paddingLG}px`,
            background: token.colorBgContainer,
          }}
        >
          <div style={{ display: "flex", gap: token.marginXS, justifyContent: "flex-end" }}>
            {view === "list" ? (
              <>
                <Button onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSave}
                  disabled={selectedIds.length === 0 && locations.length > 0}
                >
                  {selectedIds.length === 0
                    ? "Select Locations"
                    : `Confirm ${selectedIds.length} ${
                        selectedIds.length === 1 ? "Location" : "Locations"
                      }`}
                </Button>
              </>
            ) : addMode === "import" ? (
              // Import mode
              <Button
                type="primary"
                onClick={handleBulkImport}
                loading={importLoading}
                disabled={parsedLocations.length === 0}
              >
                Import All ({parsedLocations.length})
              </Button>
            ) : (
              // Manual entry mode
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
              >
                {editingLocation ? "Update Location" : "Save Location"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
    </>
  );
};

export default LocationModal;

