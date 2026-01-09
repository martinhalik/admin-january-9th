export interface Location {
  id: string;
  name: string;
  address: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  email?: string;
  website?: string;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
  isActive: boolean;
  isDraft?: boolean; // true if location was auto-saved but not published
  businessType?: string;
  description?: string;
  capacity?: number;
  amenities?: string[];
  parkingInfo?: string;
  accessibility?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LocationImportData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  businessType?: string;
  description?: string;
  capacity?: number;
  amenities?: string;
  parkingInfo?: string;
  accessibility?: string;
}

export interface LocationImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  imported: Location[];
}

// Mock location data for different account types
export const mockLocations: { [accountId: string]: Location[] } = {
  "merchant-1": [
    {
      id: "loc-1-1",
      name: "Chimi's Fresh-Mex - Chicago Loop",
      address: {
        street: "123 West Madison Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60602",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8819,
        longitude: -87.6278,
      },
      phone: "(555) 123-4567",
      email: "chicago@chimisfreshmex.com",
      website: "www.chimisfreshmex.com",
      hours: {
        monday: { open: "11:00", close: "22:00", isClosed: false },
        tuesday: { open: "11:00", close: "22:00", isClosed: false },
        wednesday: { open: "11:00", close: "22:00", isClosed: false },
        thursday: { open: "11:00", close: "22:00", isClosed: false },
        friday: { open: "11:00", close: "23:00", isClosed: false },
        saturday: { open: "10:00", close: "23:00", isClosed: false },
        sunday: { open: "10:00", close: "21:00", isClosed: false },
      },
      isActive: true,
      businessType: "Restaurant",
      description: "Main restaurant location with full dining room and bar",
      capacity: 120,
      amenities: ["Full Bar", "Outdoor Seating", "Takeout", "Delivery"],
      parkingInfo: "Free parking available in front and side lots",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-01-15T10:00:00Z",
      updatedAt: "2023-01-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-1-2",
      name: "Chimi's Fresh-Mex - Wicker Park",
      address: {
        street: "1520 North Milwaukee Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60622",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9095,
        longitude: -87.6773,
      },
      phone: "(555) 987-6543",
      email: "wickerpark@chimisfreshmex.com",
      website: "www.chimisfreshmex.com",
      isActive: true,
      businessType: "Restaurant",
      description: "Trendy Wicker Park location with outdoor patio",
      capacity: 100,
      amenities: ["Full Bar", "Outdoor Seating", "Takeout", "Delivery"],
      parkingInfo: "Street parking available",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2024-11-01T10:00:00Z",
      updatedAt: "2024-11-01T10:00:00Z",
      createdBy: "user",
      updatedBy: "user",
    },
  ],
  "merchant-2": [
    {
      id: "loc-2-1",
      name: "Serenity Spa & Wellness - Downtown",
      address: {
        street: "456 Michigan Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60611",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8781,
        longitude: -87.6298,
      },
      phone: "(555) 234-5678",
      email: "downtown@serenityspa.com",
      website: "www.serenityspa.com",
      hours: {
        monday: { open: "09:00", close: "20:00", isClosed: false },
        tuesday: { open: "09:00", close: "20:00", isClosed: false },
        wednesday: { open: "09:00", close: "20:00", isClosed: false },
        thursday: { open: "09:00", close: "20:00", isClosed: false },
        friday: { open: "09:00", close: "21:00", isClosed: false },
        saturday: { open: "08:00", close: "21:00", isClosed: false },
        sunday: { open: "10:00", close: "18:00", isClosed: false },
      },
      isActive: true,
      businessType: "Spa & Beauty",
      description:
        "Luxury spa with full-service treatments and wellness programs",
      capacity: 50,
      amenities: [
        "Massage Therapy",
        "Facial Treatments",
        "Sauna",
        "Steam Room",
        "Retail Shop",
      ],
      parkingInfo: "Valet parking available, street parking nearby",
      accessibility: [
        "Wheelchair Accessible",
        "Elevator Access",
        "Accessible Restrooms",
      ],
      createdAt: "2023-03-22T10:00:00Z",
      updatedAt: "2023-03-22T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-3": [
    {
      id: "loc-3-1",
      name: "Bella Italia Ristorante - River North",
      address: {
        street: "350 West Hubbard Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60654",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8897,
        longitude: -87.6368,
      },
      phone: "(555) 345-6789",
      email: "manhattan@bellaitalia.com",
      website: "www.bellaitalia.com",
      hours: {
        monday: { open: "17:00", close: "23:00", isClosed: false },
        tuesday: { open: "17:00", close: "23:00", isClosed: false },
        wednesday: { open: "17:00", close: "23:00", isClosed: false },
        thursday: { open: "17:00", close: "23:00", isClosed: false },
        friday: { open: "17:00", close: "24:00", isClosed: false },
        saturday: { open: "16:00", close: "24:00", isClosed: false },
        sunday: { open: "16:00", close: "22:00", isClosed: false },
      },
      isActive: true,
      businessType: "Restaurant",
      description:
        "Fine Italian dining with authentic regional cuisine and extensive wine selection",
      capacity: 80,
      amenities: ["Full Bar", "Wine Cellar", "Private Dining", "Valet Parking"],
      parkingInfo: "Valet parking available, limited street parking",
      accessibility: [
        "Wheelchair Accessible",
        "Elevator Access",
        "Accessible Restrooms",
      ],
      createdAt: "2022-11-08T10:00:00Z",
      updatedAt: "2022-11-08T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-3-2",
      name: "Bella Italia Ristorante - Old Town",
      address: {
        street: "1400 North Wells Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60610",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9087,
        longitude: -87.6348,
      },
      phone: "(555) 345-6790",
      email: "brooklyn@bellaitalia.com",
      website: "www.bellaitalia.com",
      hours: {
        monday: { open: "17:00", close: "23:00", isClosed: false },
        tuesday: { open: "17:00", close: "23:00", isClosed: false },
        wednesday: { open: "17:00", close: "23:00", isClosed: false },
        thursday: { open: "17:00", close: "23:00", isClosed: false },
        friday: { open: "17:00", close: "24:00", isClosed: false },
        saturday: { open: "16:00", close: "24:00", isClosed: false },
        sunday: { open: "16:00", close: "22:00", isClosed: false },
      },
      isActive: true,
      businessType: "Restaurant",
      description:
        "Brooklyn location featuring regional Italian specialties and family-style dining",
      capacity: 70,
      amenities: ["Full Bar", "Outdoor Seating", "Private Dining"],
      parkingInfo: "Street parking available",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-04-15T10:00:00Z",
      updatedAt: "2023-04-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-3-3",
      name: "Bella Italia Ristorante - Queens",
      address: {
        street: "123 Steinway Street",
        city: "Astoria",
        state: "NY",
        zipCode: "11103",
        country: "USA",
      },
      coordinates: {
        latitude: 40.7614,
        longitude: -73.9193,
      },
      phone: "(555) 345-6791",
      email: "queens@bellaitalia.com",
      website: "www.bellaitalia.com",
      hours: {
        monday: { open: "17:00", close: "23:00", isClosed: false },
        tuesday: { open: "17:00", close: "23:00", isClosed: false },
        wednesday: { open: "17:00", close: "23:00", isClosed: false },
        thursday: { open: "17:00", close: "23:00", isClosed: false },
        friday: { open: "17:00", close: "24:00", isClosed: false },
        saturday: { open: "16:00", close: "24:00", isClosed: false },
        sunday: { open: "16:00", close: "22:00", isClosed: false },
      },
      isActive: true,
      businessType: "Restaurant",
      description: "Authentic Italian trattoria serving traditional Roman cuisine",
      capacity: 60,
      amenities: ["Full Bar", "Takeout", "Wine Selection"],
      parkingInfo: "Street parking available",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-08-20T10:00:00Z",
      updatedAt: "2023-08-20T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-3-4",
      name: "Bella Italia Ristorante - Jersey City",
      address: {
        street: "789 Newark Ave",
        city: "Jersey City",
        state: "NJ",
        zipCode: "07302",
        country: "USA",
      },
      coordinates: {
        latitude: 40.7282,
        longitude: -74.0431,
      },
      phone: "(555) 345-6792",
      email: "jerseycity@bellaitalia.com",
      website: "www.bellaitalia.com",
      isActive: true,
      isDraft: true,
      businessType: "Restaurant",
      description: "New Jersey location - opening soon",
      capacity: 80,
      createdAt: "2024-11-02T10:00:00Z",
      updatedAt: "2024-11-02T10:00:00Z",
      createdBy: "user",
      updatedBy: "auto-save",
    },
  ],
  "merchant-4": [
    {
      id: "loc-4-1",
      name: "FitZone Performance Gym - Lincoln Park",
      address: {
        street: "2200 North Clybourn Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60614",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9221,
        longitude: -87.6645,
      },
      phone: "(555) 456-7890",
      email: "westla@fitzone.com",
      website: "www.fitzone.com",
      hours: {
        monday: { open: "05:00", close: "23:00", isClosed: false },
        tuesday: { open: "05:00", close: "23:00", isClosed: false },
        wednesday: { open: "05:00", close: "23:00", isClosed: false },
        thursday: { open: "05:00", close: "23:00", isClosed: false },
        friday: { open: "05:00", close: "23:00", isClosed: false },
        saturday: { open: "06:00", close: "22:00", isClosed: false },
        sunday: { open: "07:00", close: "21:00", isClosed: false },
      },
      isActive: true,
      businessType: "Fitness & Health",
      description:
        "State-of-the-art fitness facility with personal training and group classes",
      capacity: 200,
      amenities: [
        "Cardio Equipment",
        "Weight Training",
        "Group Classes",
        "Personal Training",
        "Locker Rooms",
        "Sauna",
      ],
      parkingInfo: "Free parking available in dedicated lot",
      accessibility: [
        "Wheelchair Accessible",
        "Accessible Equipment",
        "Accessible Restrooms",
      ],
      createdAt: "2023-02-14T10:00:00Z",
      updatedAt: "2023-02-14T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-4-2",
      name: "FitZone Performance Gym - Loop",
      address: {
        street: "220 South State Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60604",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8781,
        longitude: -87.6278,
      },
      phone: "(555) 456-7891",
      email: "downtown@fitzone.com",
      website: "www.fitzone.com",
      hours: {
        monday: { open: "05:00", close: "23:00", isClosed: false },
        tuesday: { open: "05:00", close: "23:00", isClosed: false },
        wednesday: { open: "05:00", close: "23:00", isClosed: false },
        thursday: { open: "05:00", close: "23:00", isClosed: false },
        friday: { open: "05:00", close: "23:00", isClosed: false },
        saturday: { open: "06:00", close: "22:00", isClosed: false },
        sunday: { open: "07:00", close: "21:00", isClosed: false },
      },
      isActive: true,
      businessType: "Fitness & Health",
      description:
        "Downtown location with focus on corporate wellness and lunch-hour classes",
      capacity: 150,
      amenities: [
        "Cardio Equipment",
        "Weight Training",
        "Group Classes",
        "Personal Training",
        "Locker Rooms",
        "Shower Facilities",
      ],
      parkingInfo: "Paid parking in building garage, street parking available",
      accessibility: [
        "Wheelchair Accessible",
        "Accessible Equipment",
        "Accessible Restrooms",
      ],
      createdAt: "2023-06-01T10:00:00Z",
      updatedAt: "2023-06-01T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-5": [
    {
      id: "loc-5-1",
      name: "Glam Studio Hair & Beauty - Gold Coast",
      address: {
        street: "900 North Michigan Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60611",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8986,
        longitude: -87.6244,
      },
      phone: "(555) 567-8901",
      email: "southbeach@glamstudio.com",
      website: "www.glamstudio.com",
      hours: {
        monday: { open: "09:00", close: "19:00", isClosed: false },
        tuesday: { open: "09:00", close: "19:00", isClosed: false },
        wednesday: { open: "09:00", close: "19:00", isClosed: false },
        thursday: { open: "09:00", close: "19:00", isClosed: false },
        friday: { open: "09:00", close: "20:00", isClosed: false },
        saturday: { open: "08:00", close: "20:00", isClosed: false },
        sunday: { open: "10:00", close: "18:00", isClosed: false },
      },
      isActive: true,
      businessType: "Salon",
      description:
        "Full-service hair salon and beauty bar with expert stylists",
      capacity: 25,
      amenities: [
        "Hair Services",
        "Beauty Treatments",
        "Bridal Services",
        "Retail Products",
      ],
      parkingInfo: "Valet parking available, street parking nearby",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-04-05T10:00:00Z",
      updatedAt: "2023-04-05T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-5-2",
      name: "Glam Studio Hair & Beauty - Streeterville",
      address: {
        street: "600 North Lake Shore Drive",
        city: "Chicago",
        state: "IL",
        zipCode: "60611",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8930,
        longitude: -87.6189,
      },
      phone: "(555) 567-8902",
      email: "coralgables@glamstudio.com",
      website: "www.glamstudio.com",
      hours: {
        monday: { open: "09:00", close: "19:00", isClosed: false },
        tuesday: { open: "09:00", close: "19:00", isClosed: false },
        wednesday: { open: "09:00", close: "19:00", isClosed: false },
        thursday: { open: "09:00", close: "19:00", isClosed: false },
        friday: { open: "09:00", close: "20:00", isClosed: false },
        saturday: { open: "08:00", close: "20:00", isClosed: false },
        sunday: { open: "10:00", close: "18:00", isClosed: false },
      },
      isActive: true,
      businessType: "Salon",
      description: "Upscale salon location with full beauty services",
      capacity: 20,
      amenities: ["Hair Services", "Beauty Treatments", "Nail Services", "Retail Products"],
      parkingInfo: "Paid parking garage nearby",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-07-10T10:00:00Z",
      updatedAt: "2023-07-10T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-5-3",
      name: "Glam Studio Hair & Beauty - Lakeview",
      address: {
        street: "3000 North Clark Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60657",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9369,
        longitude: -87.6497,
      },
      phone: "(555) 567-8903",
      email: "brickell@glamstudio.com",
      website: "www.glamstudio.com",
      hours: {
        monday: { open: "09:00", close: "19:00", isClosed: false },
        tuesday: { open: "09:00", close: "19:00", isClosed: false },
        wednesday: { open: "09:00", close: "19:00", isClosed: false },
        thursday: { open: "09:00", close: "19:00", isClosed: false },
        friday: { open: "09:00", close: "20:00", isClosed: false },
        saturday: { open: "08:00", close: "20:00", isClosed: false },
        sunday: { open: "10:00", close: "18:00", isClosed: false },
      },
      isActive: true,
      businessType: "Salon",
      description: "Modern downtown salon with convenient business district location",
      capacity: 22,
      amenities: ["Hair Services", "Express Services", "Retail Products"],
      parkingInfo: "Building parking validation available",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-09-15T10:00:00Z",
      updatedAt: "2023-09-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "loc-5-4",
      name: "Glam Studio Hair & Beauty - Wynwood",
      address: {
        street: "234 NW 23rd Street",
        city: "Miami",
        state: "FL",
        zipCode: "33127",
        country: "USA",
      },
      coordinates: {
        latitude: 25.8004,
        longitude: -80.1977,
      },
      phone: "(555) 567-8904",
      email: "wynwood@glamstudio.com",
      website: "www.glamstudio.com",
      hours: {
        monday: { open: "10:00", close: "19:00", isClosed: false },
        tuesday: { open: "10:00", close: "19:00", isClosed: false },
        wednesday: { open: "10:00", close: "19:00", isClosed: false },
        thursday: { open: "10:00", close: "19:00", isClosed: false },
        friday: { open: "10:00", close: "20:00", isClosed: false },
        saturday: { open: "09:00", close: "20:00", isClosed: false },
        sunday: { open: "10:00", close: "18:00", isClosed: false },
      },
      isActive: true,
      businessType: "Salon",
      description: "Trendy art district salon with creative styling services",
      capacity: 18,
      amenities: ["Hair Services", "Creative Coloring", "Styling Classes", "Retail Products"],
      parkingInfo: "Street parking available",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2024-01-05T10:00:00Z",
      updatedAt: "2024-01-05T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-6": [
    {
      id: "loc-6-1",
      name: "Adventure Escapes - North Side",
      address: {
        street: "4800 West Fullerton Avenue",
        city: "Chicago",
        state: "IL",
        zipCode: "60639",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9245,
        longitude: -87.7446,
      },
      phone: "(555) 678-9012",
      email: "basecamp@adventureescapes.com",
      website: "www.adventureescapes.com",
      hours: {
        monday: { open: "08:00", close: "18:00", isClosed: false },
        tuesday: { open: "08:00", close: "18:00", isClosed: false },
        wednesday: { open: "08:00", close: "18:00", isClosed: false },
        thursday: { open: "08:00", close: "18:00", isClosed: false },
        friday: { open: "08:00", close: "18:00", isClosed: false },
        saturday: { open: "07:00", close: "19:00", isClosed: false },
        sunday: { open: "07:00", close: "19:00", isClosed: false },
      },
      isActive: true,
      businessType: "Activities & Entertainment",
      description:
        "Main base camp for outdoor adventure experiences and equipment rental",
      capacity: 100,
      amenities: [
        "Equipment Rental",
        "Guided Tours",
        "Safety Training",
        "Gift Shop",
        "Refreshments",
      ],
      parkingInfo: "Free parking available for all participants",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-05-20T10:00:00Z",
      updatedAt: "2023-05-20T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-7": [
    {
      id: "loc-7-1",
      name: "The Coffee House - Hyde Park",
      address: {
        street: "1465 East 53rd Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60615",
        country: "USA",
      },
      coordinates: {
        latitude: 41.7995,
        longitude: -87.5907,
      },
      phone: "(555) 789-0123",
      email: "capitolhill@thecoffeehouse.com",
      website: "www.thecoffeehouse.com",
      hours: {
        monday: { open: "06:00", close: "20:00", isClosed: false },
        tuesday: { open: "06:00", close: "20:00", isClosed: false },
        wednesday: { open: "06:00", close: "20:00", isClosed: false },
        thursday: { open: "06:00", close: "20:00", isClosed: false },
        friday: { open: "06:00", close: "21:00", isClosed: false },
        saturday: { open: "07:00", close: "21:00", isClosed: false },
        sunday: { open: "07:00", close: "19:00", isClosed: false },
      },
      isActive: true,
      businessType: "Cafe",
      description:
        "Artisan coffee shop with fresh pastries and light breakfast options",
      capacity: 40,
      amenities: ["WiFi", "Outdoor Seating", "Takeout", "Delivery"],
      parkingInfo: "Street parking available, paid parking nearby",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-06-10T10:00:00Z",
      updatedAt: "2023-06-10T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-8": [
    {
      id: "loc-8-1",
      name: "Ocean View Resort - Lakeshore",
      address: {
        street: "1300 South Lake Shore Drive",
        city: "Chicago",
        state: "IL",
        zipCode: "60605",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8651,
        longitude: -87.6119,
      },
      phone: "(555) 890-1234",
      email: "reservations@oceanviewresort.com",
      website: "www.oceanviewresort.com",
      hours: {
        monday: { open: "00:00", close: "23:59", isClosed: false },
        tuesday: { open: "00:00", close: "23:59", isClosed: false },
        wednesday: { open: "00:00", close: "23:59", isClosed: false },
        thursday: { open: "00:00", close: "23:59", isClosed: false },
        friday: { open: "00:00", close: "23:59", isClosed: false },
        saturday: { open: "00:00", close: "23:59", isClosed: false },
        sunday: { open: "00:00", close: "23:59", isClosed: false },
      },
      isActive: true,
      businessType: "Hotel & Lodging",
      description:
        "Beachfront resort with luxury accommodations and full-service amenities",
      capacity: 200,
      amenities: [
        "Beach Access",
        "Pool",
        "Spa",
        "Restaurant",
        "Bar",
        "Concierge",
        "Room Service",
      ],
      parkingInfo: "Valet parking available, self-parking in resort garage",
      accessibility: [
        "Wheelchair Accessible",
        "Accessible Rooms",
        "Elevator Access",
        "Accessible Restrooms",
      ],
      createdAt: "2022-12-01T10:00:00Z",
      updatedAt: "2022-12-01T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-9": [
    {
      id: "loc-9-1",
      name: "Tokyo Kitchen - West Loop",
      address: {
        street: "500 West Madison Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60661",
        country: "USA",
      },
      coordinates: {
        latitude: 41.8819,
        longitude: -87.6438,
      },
      phone: "(555) 901-2345",
      email: "mission@tokyokitchen.com",
      website: "www.tokyokitchen.com",
      hours: {
        monday: { open: "11:00", close: "22:00", isClosed: false },
        tuesday: { open: "11:00", close: "22:00", isClosed: false },
        wednesday: { open: "11:00", close: "22:00", isClosed: false },
        thursday: { open: "11:00", close: "22:00", isClosed: false },
        friday: { open: "11:00", close: "23:00", isClosed: false },
        saturday: { open: "10:00", close: "23:00", isClosed: false },
        sunday: { open: "10:00", close: "21:00", isClosed: false },
      },
      isActive: true,
      businessType: "Restaurant",
      description:
        "Authentic Japanese restaurant and cooking school specializing in traditional sushi and ramen",
      capacity: 60,
      amenities: [
        "Cooking Classes",
        "Sushi Bar",
        "Private Dining",
        "Takeout",
        "Delivery",
      ],
      parkingInfo: "Street parking available, paid parking nearby",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2023-01-30T10:00:00Z",
      updatedAt: "2023-01-30T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  "merchant-10": [
    {
      id: "loc-10-1",
      name: "Napa Valley Cellars - Chicago Tasting Room",
      address: {
        street: "1800 North Halsted Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60614",
        country: "USA",
      },
      coordinates: {
        latitude: 41.9115,
        longitude: -87.6489,
      },
      phone: "(555) 012-3456",
      email: "tastings@napavalleycellars.com",
      website: "www.napavalleycellars.com",
      hours: {
        monday: { open: "10:00", close: "17:00", isClosed: false },
        tuesday: { open: "10:00", close: "17:00", isClosed: false },
        wednesday: { open: "10:00", close: "17:00", isClosed: false },
        thursday: { open: "10:00", close: "17:00", isClosed: false },
        friday: { open: "10:00", close: "18:00", isClosed: false },
        saturday: { open: "09:00", close: "18:00", isClosed: false },
        sunday: { open: "10:00", close: "17:00", isClosed: false },
      },
      isActive: true,
      businessType: "Winery",
      description:
        "Premium winery offering wine tastings, vineyard tours, and gourmet food pairings",
      capacity: 80,
      amenities: [
        "Wine Tasting",
        "Vineyard Tours",
        "Gift Shop",
        "Event Space",
        "Food Pairings",
      ],
      parkingInfo: "Free parking available on-site",
      accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
      createdAt: "2022-09-15T10:00:00Z",
      updatedAt: "2022-09-15T10:00:00Z",
      createdBy: "system",
      updatedBy: "system",
    },
  ],
  // ChimneyCare - Mobile service, no physical locations
  "merchant-chimneyclean": [],
};

// Bowlero locations - 120 locations across USA (temporary shorthand structure)
const bowleroLocations: Array<{ city: string; state: string; street: string; zipCode: string; lat: number; lng: number }> = [
  { city: "New York", state: "NY", street: "1234 Broadway", zipCode: "10001", lat: 40.7831, lng: -73.9712 },
  { city: "Los Angeles", state: "CA", street: "5678 Sunset Blvd", zipCode: "90028", lat: 34.0928, lng: -118.3287 },
  { city: "Chicago", state: "IL", street: "910 Michigan Ave", zipCode: "60611", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", street: "2345 Main St", zipCode: "77002", lat: 29.7604, lng: -95.3698 },
  { city: "Phoenix", state: "AZ", street: "678 Central Ave", zipCode: "85004", lat: 33.4484, lng: -112.0740 },
  { city: "Philadelphia", state: "PA", street: "1010 Market St", zipCode: "19107", lat: 39.9526, lng: -75.1652 },
  { city: "San Antonio", state: "TX", street: "789 Commerce St", zipCode: "78205", lat: 29.4241, lng: -98.4936 },
  { city: "San Diego", state: "CA", street: "456 Harbor Dr", zipCode: "92101", lat: 32.7157, lng: -117.1611 },
  { city: "Dallas", state: "TX", street: "234 Elm St", zipCode: "75201", lat: 32.7767, lng: -96.7970 },
  { city: "San Jose", state: "CA", street: "890 First St", zipCode: "95113", lat: 37.3382, lng: -121.8863 },
  { city: "Austin", state: "TX", street: "567 Congress Ave", zipCode: "78701", lat: 30.2672, lng: -97.7431 },
  { city: "Jacksonville", state: "FL", street: "345 Bay St", zipCode: "32202", lat: 30.3322, lng: -81.6557 },
  { city: "Fort Worth", state: "TX", street: "123 Main St", zipCode: "76102", lat: 32.7555, lng: -97.3308 },
  { city: "Columbus", state: "OH", street: "789 High St", zipCode: "43215", lat: 39.9612, lng: -82.9988 },
  { city: "Charlotte", state: "NC", street: "456 Tryon St", zipCode: "28202", lat: 35.2271, lng: -80.8431 },
  { city: "Indianapolis", state: "IN", street: "234 Meridian St", zipCode: "46204", lat: 39.7684, lng: -86.1581 },
  { city: "San Francisco", state: "CA", street: "678 Market St", zipCode: "94103", lat: 37.7749, lng: -122.4194 },
  { city: "Seattle", state: "WA", street: "910 Pike St", zipCode: "98101", lat: 47.6062, lng: -122.3321 },
  { city: "Denver", state: "CO", street: "345 17th St", zipCode: "80202", lat: 39.7392, lng: -104.9903 },
  { city: "Washington", state: "DC", street: "567 Pennsylvania Ave", zipCode: "20004", lat: 38.9072, lng: -77.0369 },
  { city: "Boston", state: "MA", street: "890 Boylston St", zipCode: "02199", lat: 42.3601, lng: -71.0589 },
  { city: "Nashville", state: "TN", street: "234 Broadway", zipCode: "37201", lat: 36.1627, lng: -86.7816 },
  { city: "Detroit", state: "MI", street: "678 Woodward Ave", zipCode: "48226", lat: 42.3314, lng: -83.0458 },
  { city: "Portland", state: "OR", street: "345 SW Broadway", zipCode: "97205", lat: 45.5152, lng: -122.6784 },
  { city: "Las Vegas", state: "NV", street: "789 Las Vegas Blvd", zipCode: "89101", lat: 36.1699, lng: -115.1398 },
  { city: "Oklahoma City", state: "OK", street: "123 Main St", zipCode: "73102", lat: 35.4676, lng: -97.5164 },
  { city: "Memphis", state: "TN", street: "456 Beale St", zipCode: "38103", lat: 35.1495, lng: -90.0490 },
  { city: "Louisville", state: "KY", street: "789 Main St", zipCode: "40202", lat: 38.2527, lng: -85.7585 },
  { city: "Baltimore", state: "MD", street: "234 Pratt St", zipCode: "21201", lat: 39.2904, lng: -76.6122 },
  { city: "Milwaukee", state: "WI", street: "567 Wisconsin Ave", zipCode: "53202", lat: 43.0389, lng: -87.9065 },
  { city: "Albuquerque", state: "NM", street: "890 Central Ave", zipCode: "87102", lat: 35.0844, lng: -106.6504 },
  { city: "Tucson", state: "AZ", street: "345 Congress St", zipCode: "85701", lat: 32.2217, lng: -110.9265 },
  { city: "Fresno", state: "CA", street: "678 Fulton St", zipCode: "93721", lat: 36.7378, lng: -119.7871 },
  { city: "Sacramento", state: "CA", street: "123 K St", zipCode: "95814", lat: 38.5816, lng: -121.4944 },
  { city: "Kansas City", state: "MO", street: "456 Main St", zipCode: "64105", lat: 39.0997, lng: -94.5786 },
  { city: "Mesa", state: "AZ", street: "789 Main St", zipCode: "85201", lat: 33.4152, lng: -111.8315 },
  { city: "Atlanta", state: "GA", street: "234 Peachtree St", zipCode: "30303", lat: 33.7490, lng: -84.3880 },
  { city: "Omaha", state: "NE", street: "567 Dodge St", zipCode: "68102", lat: 41.2565, lng: -95.9345 },
  { city: "Colorado Springs", state: "CO", street: "890 Tejon St", zipCode: "80903", lat: 38.8339, lng: -104.8214 },
  { city: "Raleigh", state: "NC", street: "345 Fayetteville St", zipCode: "27601", lat: 35.7796, lng: -78.6382 },
  { city: "Virginia Beach", state: "VA", street: "678 Atlantic Ave", zipCode: "23451", lat: 36.8529, lng: -75.9780 },
  { city: "Long Beach", state: "CA", street: "123 Ocean Blvd", zipCode: "90802", lat: 33.7701, lng: -118.1937 },
  { city: "Miami", state: "FL", street: "456 Biscayne Blvd", zipCode: "33132", lat: 25.7617, lng: -80.1918 },
  { city: "Oakland", state: "CA", street: "789 Broadway", zipCode: "94607", lat: 37.8044, lng: -122.2712 },
  { city: "Minneapolis", state: "MN", street: "234 Hennepin Ave", zipCode: "55401", lat: 44.9778, lng: -93.2650 },
  { city: "Tulsa", state: "OK", street: "567 Main St", zipCode: "74103", lat: 36.1540, lng: -95.9928 },
  { city: "Tampa", state: "FL", street: "890 Kennedy Blvd", zipCode: "33602", lat: 27.9506, lng: -82.4572 },
  { city: "Arlington", state: "TX", street: "345 Main St", zipCode: "76010", lat: 32.7357, lng: -97.1081 },
  { city: "New Orleans", state: "LA", street: "678 Canal St", zipCode: "70130", lat: 29.9511, lng: -90.0715 },
  { city: "Wichita", state: "KS", street: "123 Douglas Ave", zipCode: "67202", lat: 37.6872, lng: -97.3301 },
  { city: "Cleveland", state: "OH", street: "456 Euclid Ave", zipCode: "44114", lat: 41.4993, lng: -81.6944 },
  { city: "Bakersfield", state: "CA", street: "789 Chester Ave", zipCode: "93301", lat: 35.3733, lng: -119.0187 },
  { city: "Aurora", state: "CO", street: "234 Colfax Ave", zipCode: "80010", lat: 39.7294, lng: -104.8319 },
  { city: "Anaheim", state: "CA", street: "567 Harbor Blvd", zipCode: "92805", lat: 33.8366, lng: -117.9143 },
  { city: "Honolulu", state: "HI", street: "890 Ala Moana Blvd", zipCode: "96814", lat: 21.3099, lng: -157.8581 },
  { city: "Santa Ana", state: "CA", street: "345 Main St", zipCode: "92701", lat: 33.7455, lng: -117.8677 },
  { city: "Riverside", state: "CA", street: "678 Market St", zipCode: "92501", lat: 33.9806, lng: -117.3755 },
  { city: "Corpus Christi", state: "TX", street: "123 Shoreline Blvd", zipCode: "78401", lat: 27.8006, lng: -97.3964 },
  { city: "Lexington", state: "KY", street: "456 Main St", zipCode: "40507", lat: 38.0406, lng: -84.5037 },
  { city: "Stockton", state: "CA", street: "789 Main St", zipCode: "95202", lat: 37.9577, lng: -121.2908 },
  { city: "St. Paul", state: "MN", street: "234 Wabasha St", zipCode: "55102", lat: 44.9537, lng: -93.0900 },
  { city: "Cincinnati", state: "OH", street: "567 Vine St", zipCode: "45202", lat: 39.1031, lng: -84.5120 },
  { city: "Henderson", state: "NV", street: "890 Water St", zipCode: "89015", lat: 36.0395, lng: -114.9817 },
  { city: "Pittsburgh", state: "PA", street: "345 Liberty Ave", zipCode: "15222", lat: 40.4406, lng: -79.9959 },
  { city: "Lincoln", state: "NE", street: "678 O St", zipCode: "68508", lat: 40.8136, lng: -96.7026 },
  { city: "Anchorage", state: "AK", street: "123 4th Ave", zipCode: "99501", lat: 61.2181, lng: -149.9003 },
  { city: "Plano", state: "TX", street: "456 Park Blvd", zipCode: "75074", lat: 33.0198, lng: -96.6989 },
  { city: "Orlando", state: "FL", street: "789 Orange Ave", zipCode: "32801", lat: 28.5383, lng: -81.3792 },
  { city: "Irvine", state: "CA", street: "234 Main St", zipCode: "92614", lat: 33.6846, lng: -117.8265 },
  { city: "Newark", state: "NJ", street: "567 Broad St", zipCode: "07102", lat: 40.7357, lng: -74.1724 },
  { city: "Durham", state: "NC", street: "890 Main St", zipCode: "27701", lat: 35.9940, lng: -78.8986 },
  { city: "Chula Vista", state: "CA", street: "345 Broadway", zipCode: "91910", lat: 32.6401, lng: -117.0842 },
  { city: "Toledo", state: "OH", street: "678 Summit St", zipCode: "43604", lat: 41.6528, lng: -83.5379 },
  { city: "Fort Wayne", state: "IN", street: "123 Calhoun St", zipCode: "46802", lat: 41.0793, lng: -85.1394 },
  { city: "St. Petersburg", state: "FL", street: "456 Central Ave", zipCode: "33701", lat: 27.7676, lng: -82.6403 },
  { city: "Laredo", state: "TX", street: "789 San Bernardo Ave", zipCode: "78040", lat: 27.5036, lng: -99.5075 },
  { city: "Jersey City", state: "NJ", street: "234 Grove St", zipCode: "07302", lat: 40.7178, lng: -74.0431 },
  { city: "Chandler", state: "AZ", street: "567 Arizona Ave", zipCode: "85225", lat: 33.3062, lng: -111.8413 },
  { city: "Madison", state: "WI", street: "890 State St", zipCode: "53703", lat: 43.0731, lng: -89.4012 },
  { city: "Lubbock", state: "TX", street: "345 Broadway St", zipCode: "79401", lat: 33.5779, lng: -101.8552 },
  { city: "Scottsdale", state: "AZ", street: "678 Scottsdale Rd", zipCode: "85251", lat: 33.4942, lng: -111.9261 },
  { city: "Reno", state: "NV", street: "123 Virginia St", zipCode: "89501", lat: 39.5296, lng: -119.8138 },
  { city: "Buffalo", state: "NY", street: "456 Main St", zipCode: "14203", lat: 42.8864, lng: -78.8784 },
  { city: "Gilbert", state: "AZ", street: "789 Gilbert Rd", zipCode: "85295", lat: 33.3528, lng: -111.7890 },
  { city: "Glendale", state: "AZ", street: "234 Glendale Ave", zipCode: "85301", lat: 33.5387, lng: -112.1860 },
  { city: "North Las Vegas", state: "NV", street: "567 Lake Mead Blvd", zipCode: "89030", lat: 36.1989, lng: -115.1175 },
  { city: "Winston-Salem", state: "NC", street: "890 Trade St", zipCode: "27101", lat: 36.0999, lng: -80.2442 },
  { city: "Chesapeake", state: "VA", street: "345 Greenbrier Pkwy", zipCode: "23320", lat: 36.7682, lng: -76.2875 },
  { city: "Norfolk", state: "VA", street: "678 Granby St", zipCode: "23510", lat: 36.8508, lng: -76.2859 },
  { city: "Fremont", state: "CA", street: "123 Capitol Ave", zipCode: "94538", lat: 37.5485, lng: -121.9886 },
  { city: "Garland", state: "TX", street: "456 Main St", zipCode: "75040", lat: 32.9126, lng: -96.6389 },
  { city: "Irving", state: "TX", street: "789 O'Connor Rd", zipCode: "75039", lat: 32.8140, lng: -96.9489 },
  { city: "Hialeah", state: "FL", street: "234 Palm Ave", zipCode: "33010", lat: 25.8576, lng: -80.2781 },
  { city: "Richmond", state: "VA", street: "567 Broad St", zipCode: "23219", lat: 37.5407, lng: -77.4360 },
  { city: "Boise", state: "ID", street: "890 Main St", zipCode: "83702", lat: 43.6150, lng: -116.2023 },
  { city: "Spokane", state: "WA", street: "345 Riverside Ave", zipCode: "99201", lat: 47.6588, lng: -117.4260 },
  { city: "Des Moines", state: "IA", street: "678 Locust St", zipCode: "50309", lat: 41.5868, lng: -93.6250 },
  { city: "Modesto", state: "CA", street: "123 I St", zipCode: "95354", lat: 37.6391, lng: -120.9969 },
  { city: "Birmingham", state: "AL", street: "456 20th St N", zipCode: "35203", lat: 33.5207, lng: -86.8025 },
  { city: "Tacoma", state: "WA", street: "789 Pacific Ave", zipCode: "98402", lat: 47.2529, lng: -122.4443 },
  { city: "Fontana", state: "CA", street: "234 Sierra Ave", zipCode: "92335", lat: 34.0922, lng: -117.4350 },
  { city: "San Bernardino", state: "CA", street: "567 E St", zipCode: "92401", lat: 34.1083, lng: -117.2898 },
  { city: "Moreno Valley", state: "CA", street: "890 Alessandro Blvd", zipCode: "92553", lat: 33.9425, lng: -117.2297 },
  { city: "Shreveport", state: "LA", street: "345 Texas St", zipCode: "71101", lat: 32.5252, lng: -93.7502 },
  { city: "Fayetteville", state: "NC", street: "678 Hay St", zipCode: "28301", lat: 35.0527, lng: -78.8784 },
  { city: "Huntsville", state: "AL", street: "123 Jefferson St", zipCode: "35801", lat: 34.7304, lng: -86.5861 },
  { city: "Yonkers", state: "NY", street: "456 Main St", zipCode: "10701", lat: 40.9312, lng: -73.8987 },
  { city: "Aurora", state: "IL", street: "789 Broadway Ave", zipCode: "60505", lat: 41.7606, lng: -88.3201 },
  { city: "Montgomery", state: "AL", street: "234 Dexter Ave", zipCode: "36104", lat: 32.3792, lng: -86.3077 },
  { city: "Amarillo", state: "TX", street: "567 Polk St", zipCode: "79101", lat: 35.2220, lng: -101.8313 },
  { city: "Little Rock", state: "AR", street: "890 Main St", zipCode: "72201", lat: 34.7465, lng: -92.2896 },
  { city: "Akron", state: "OH", street: "345 Main St", zipCode: "44308", lat: 41.0814, lng: -81.5190 },
  { city: "Columbus", state: "GA", street: "678 Broadway", zipCode: "31901", lat: 32.4609, lng: -84.9877 },
  { city: "Grand Rapids", state: "MI", street: "123 Monroe Ave", zipCode: "49503", lat: 42.9634, lng: -85.6681 },
  { city: "Overland Park", state: "KS", street: "456 Metcalf Ave", zipCode: "66204", lat: 38.9822, lng: -94.6708 },
  { city: "Salt Lake City", state: "UT", street: "789 Main St", zipCode: "84101", lat: 40.7608, lng: -111.8910 },
  { city: "Tallahassee", state: "FL", street: "234 Monroe St", zipCode: "32301", lat: 30.4383, lng: -84.2807 },
  { city: "Worcester", state: "MA", street: "567 Main St", zipCode: "01608", lat: 42.2626, lng: -71.8023 },
  { city: "Newport News", state: "VA", street: "890 Jefferson Ave", zipCode: "23601", lat: 37.0871, lng: -76.4730 },
];

mockLocations["merchant-bowlero"] = bowleroLocations.map((loc, index) => ({
  id: `loc-bowlero-${index + 1}`,
  name: `Bowlero ${loc.city}`,
  address: {
    street: loc.street,
    city: loc.city,
    state: loc.state,
    zipCode: loc.zipCode,
    country: "USA",
  },
  coordinates: {
    latitude: loc.lat,
    longitude: loc.lng,
  },
  phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  email: `${loc.city.toLowerCase().replace(/\s+/g, "")}@bowlero.com`,
  website: "www.bowlero.com",
  hours: {
    monday: { open: "10:00", close: "23:00", isClosed: false },
    tuesday: { open: "10:00", close: "23:00", isClosed: false },
    wednesday: { open: "10:00", close: "23:00", isClosed: false },
    thursday: { open: "10:00", close: "24:00", isClosed: false },
    friday: { open: "10:00", close: "02:00", isClosed: false },
    saturday: { open: "09:00", close: "02:00", isClosed: false },
    sunday: { open: "09:00", close: "23:00", isClosed: false },
  },
  isActive: true,
  businessType: "Entertainment",
  description: "Modern bowling and entertainment center with arcade, laser tag, and full-service dining",
  capacity: 250,
  amenities: ["Bowling Lanes", "Arcade", "Laser Tag", "Full Bar", "Restaurant", "Party Rooms", "VIP Lanes"],
  parkingInfo: "Free parking available",
  accessibility: ["Wheelchair Accessible", "Accessible Restrooms", "Accessible Lanes"],
  createdAt: "2022-01-20T10:00:00Z",
  updatedAt: "2024-01-01T10:00:00Z",
  createdBy: "system",
  updatedBy: "system",
}));

// Mama Mia's Italian Kitchen - 5 locations in Chicago area
mockLocations["merchant-9"] = [
  {
    id: "loc-9-1",
    name: "Mama Mia's Italian Kitchen - Lincoln Square",
    address: {
      street: "4700 North Lincoln Avenue",
      city: "Chicago",
      state: "IL",
      zipCode: "60625",
      country: "USA",
    },
    coordinates: {
      latitude: 41.9662,
      longitude: -87.6894,
    },
    phone: "(555) 111-2222",
    email: "backbay@mamamias.com",
    website: "www.mamamias.com",
    hours: {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    },
    isActive: true,
    businessType: "Restaurant",
    description: "Original location featuring authentic Italian recipes and family atmosphere",
    capacity: 85,
    amenities: ["Full Bar", "Outdoor Seating", "Takeout", "Private Dining"],
    parkingInfo: "Valet parking available, street parking nearby",
    accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
    createdAt: "2023-07-15T10:00:00Z",
    updatedAt: "2023-07-15T10:00:00Z",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: "loc-9-2",
    name: "Mama Mia's Italian Kitchen - Cambridge",
    address: {
      street: "789 Massachusetts Avenue",
      city: "Cambridge",
      state: "MA",
      zipCode: "02139",
      country: "USA",
    },
    coordinates: {
      latitude: 42.3736,
      longitude: -71.1097,
    },
    phone: "(555) 111-2223",
    email: "cambridge@mamamias.com",
    website: "www.mamamias.com",
    hours: {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    },
    isActive: true,
    businessType: "Restaurant",
    description: "Cambridge location near Harvard Square with extensive wine selection",
    capacity: 70,
    amenities: ["Full Bar", "Wine Cellar", "Takeout", "Delivery"],
    parkingInfo: "Street parking and public parking garage nearby",
    accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
    createdAt: "2023-10-01T10:00:00Z",
    updatedAt: "2023-10-01T10:00:00Z",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: "loc-9-3",
    name: "Mama Mia's Italian Kitchen - Andersonville",
    address: {
      street: "5200 North Clark Street",
      city: "Chicago",
      state: "IL",
      zipCode: "60640",
      country: "USA",
    },
    coordinates: {
      latitude: 41.9769,
      longitude: -87.6685,
    },
    phone: "(555) 111-2224",
    email: "beaconhill@mamamias.com",
    website: "www.mamamias.com",
    hours: {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    },
    isActive: true,
    businessType: "Restaurant",
    description: "Cozy Beacon Hill location with intimate dining atmosphere",
    capacity: 55,
    amenities: ["Full Bar", "Private Dining", "Takeout"],
    parkingInfo: "Limited street parking, public garage nearby",
    accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
    createdAt: "2023-12-05T10:00:00Z",
    updatedAt: "2023-12-05T10:00:00Z",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: "loc-9-4",
    name: "Mama Mia's Italian Kitchen - Wrigleyville",
    address: {
      street: "3600 North Clark Street",
      city: "Chicago",
      state: "IL",
      zipCode: "60613",
      country: "USA",
    },
    coordinates: {
      latitude: 41.9485,
      longitude: -87.6554,
    },
    phone: "(555) 111-2225",
    email: "northend@mamamias.com",
    website: "www.mamamias.com",
    hours: {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    },
    isActive: true,
    businessType: "Restaurant",
    description: "Authentic Italian neighborhood location in historic North End",
    capacity: 75,
    amenities: ["Full Bar", "Outdoor Seating", "Takeout", "Live Music"],
    parkingInfo: "Parking garage nearby",
    accessibility: ["Wheelchair Accessible", "Accessible Restrooms"],
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: "loc-9-5",
    name: "Mama Mia's Italian Kitchen - Bucktown",
    address: {
      street: "1900 North Damen Avenue",
      city: "Chicago",
      state: "IL",
      zipCode: "60647",
      country: "USA",
    },
    coordinates: {
      latitude: 41.9179,
      longitude: -87.6773,
    },
    phone: "(555) 111-2226",
    email: "seaport@mamamias.com",
    website: "www.mamamias.com",
    hours: {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "10:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    },
    isActive: true,
    businessType: "Restaurant",
    description: "Modern waterfront location with stunning harbor views",
    capacity: 95,
    amenities: ["Full Bar", "Outdoor Seating", "Takeout", "Delivery", "Event Space"],
    parkingInfo: "Parking garage in building",
    accessibility: ["Wheelchair Accessible", "Accessible Restrooms", "Elevator Access"],
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-03-10T10:00:00Z",
    createdBy: "system",
    updatedBy: "system",
  },
];

export const getLocationsByAccount = (accountId: string): Location[] => {
  return mockLocations[accountId] || [];
};

export const getLocationById = (
  accountId: string,
  locationId: string
): Location | undefined => {
  const locations = getLocationsByAccount(accountId);
  return locations.find((location) => location.id === locationId);
};

export const createLocation = (
  accountId: string,
  locationData: Omit<Location, "id" | "createdAt" | "updatedAt">
): Location => {
  const newLocation: Location = {
    ...locationData,
    id: `loc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!mockLocations[accountId]) {
    mockLocations[accountId] = [];
  }

  mockLocations[accountId].push(newLocation);
  return newLocation;
};

export const updateLocation = (
  accountId: string,
  locationId: string,
  updates: Partial<Location>
): Location | null => {
  const locations = getLocationsByAccount(accountId);
  const locationIndex = locations.findIndex(
    (location) => location.id === locationId
  );

  if (locationIndex === -1) {
    return null;
  }

  const updatedLocation = {
    ...locations[locationIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  mockLocations[accountId][locationIndex] = updatedLocation;
  return updatedLocation;
};

export const deleteLocation = (
  accountId: string,
  locationId: string
): boolean => {
  const locations = getLocationsByAccount(accountId);
  const locationIndex = locations.findIndex(
    (location) => location.id === locationId
  );

  if (locationIndex === -1) {
    return false;
  }

  mockLocations[accountId].splice(locationIndex, 1);
  return true;
};

export const importLocations = (
  accountId: string,
  importData: LocationImportData[]
): LocationImportResult => {
  const result: LocationImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    imported: [],
  };

  importData.forEach((data, index) => {
    try {
      const locationData: Omit<Location, "id" | "createdAt" | "updatedAt"> = {
        name: data.name,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        phone: data.phone,
        email: data.email,
        website: data.website,
        isActive: true,
        businessType: data.businessType,
        description: data.description,
        capacity: data.capacity,
        amenities: data.amenities
          ? data.amenities.split(",").map((a) => a.trim())
          : [],
        parkingInfo: data.parkingInfo,
        accessibility: data.accessibility
          ? data.accessibility.split(",").map((a) => a.trim())
          : [],
        createdBy: "import",
        updatedBy: "import",
      };

      const newLocation = createLocation(accountId, locationData);
      result.imported.push(newLocation);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: index + 1,
        field: "general",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return result;
};

export const exportLocations = (accountId: string): LocationImportData[] => {
  const locations = getLocationsByAccount(accountId);
  return locations.map((location) => ({
    name: location.name,
    street: location.address.street,
    city: location.address.city,
    state: location.address.state,
    zipCode: location.address.zipCode,
    country: location.address.country,
    phone: location.phone,
    email: location.email,
    website: location.website,
    businessType: location.businessType,
    description: location.description,
    capacity: location.capacity,
    amenities: location.amenities?.join(", "),
    parkingInfo: location.parkingInfo,
    accessibility: location.accessibility?.join(", "),
  }));
};

