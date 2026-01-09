import { getLocationsByAccount, Location } from "./locationData";

// Utility function to get all location IDs for an account
export const getAccountLocationIds = (accountId?: string): string[] => {
  if (!accountId) return [];
  const locations = getLocationsByAccount(accountId);
  return locations.map((loc) => loc.id);
};

// Utility function to format location hours into a readable string
export const formatLocationHours = (hours?: Location["hours"]): string => {
  if (!hours) return "";

  const daysOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dayAbbrev: { [key: string]: string } = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  // Group consecutive days with same hours
  const groups: Array<{
    days: string[];
    open: string;
    close: string;
    isClosed: boolean;
  }> = [];

  let currentGroup: {
    days: string[];
    open: string;
    close: string;
    isClosed: boolean;
  } | null = null;

  for (const day of daysOrder) {
    const dayHours = hours[day];
    if (!dayHours) continue;

    if (
      !currentGroup ||
      currentGroup.open !== dayHours.open ||
      currentGroup.close !== dayHours.close ||
      currentGroup.isClosed !== dayHours.isClosed
    ) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        days: [day],
        open: dayHours.open,
        close: dayHours.close,
        isClosed: dayHours.isClosed,
      };
    } else {
      currentGroup.days.push(day);
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Format groups into strings
  const formattedGroups = groups.map((group) => {
    if (group.isClosed) {
      return `${formatDayRange(group.days, dayAbbrev)}: Closed`;
    }

    // Check if it's 24/7
    if (group.open === "00:00" && group.close === "23:59") {
      return `${formatDayRange(group.days, dayAbbrev)}: 24/7`;
    }

    return `${formatDayRange(group.days, dayAbbrev)}: ${group.open}-${group.close}`;
  });

  // If all 7 days have the same hours, simplify to "Daily"
  if (groups.length === 1 && groups[0].days.length === 7) {
    if (groups[0].isClosed) return "Closed";
    if (groups[0].open === "00:00" && groups[0].close === "23:59") return "Open 24/7";
    return `Daily: ${groups[0].open}-${groups[0].close}`;
  }

  return formattedGroups.join(", ");
};

// Helper function to format day ranges
const formatDayRange = (
  days: string[],
  dayAbbrev: { [key: string]: string }
): string => {
  if (days.length === 1) {
    return dayAbbrev[days[0]];
  }

  const daysOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Check if consecutive
  const firstIndex = daysOrder.indexOf(days[0]);
  const lastIndex = daysOrder.indexOf(days[days.length - 1]);
  const isConsecutive =
    days.length === lastIndex - firstIndex + 1 &&
    days.every((day, idx) => day === daysOrder[firstIndex + idx]);

  if (isConsecutive && days.length > 2) {
    return `${dayAbbrev[days[0]]}-${dayAbbrev[days[days.length - 1]]}`;
  }

  return days.map((day) => dayAbbrev[day]).join(", ");
};

// Utility function to format location address as a single line
export const formatLocationAddress = (address: Location["address"]): string => {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
};

