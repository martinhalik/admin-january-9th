import React, { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Divider,
  theme,
  Segmented,
} from "antd";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { MerchantAccount } from "../data/merchantAccounts";
import type { Location } from "../data/locationData";

const { Text } = Typography;
const { useToken } = theme;

interface BusyTime {
  hour: number; // 0-23
  level: number; // 0-100 (0 = not busy, 100 = very busy)
}

interface DayBusyTimes {
  monday: BusyTime[];
  tuesday: BusyTime[];
  wednesday: BusyTime[];
  thursday: BusyTime[];
  friday: BusyTime[];
  saturday: BusyTime[];
  sunday: BusyTime[];
}

interface MerchantInfoCardProps {
  merchant: MerchantAccount;
  location?: Location;
  showBusyTimes?: boolean;
  showCard?: boolean; // Whether to wrap in a Card component
}

const MerchantInfoCard: React.FC<MerchantInfoCardProps> = ({
  merchant,
  location,
  showBusyTimes = true,
  showCard = true,
}) => {
  const { token } = useToken();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showOpeningHours, setShowOpeningHours] = useState(true);
  const [showPopularTimes, setShowPopularTimes] = useState(true);

  // Get current day and time
  const now = new Date();
  const currentDay = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Mock busy times data (in real app, this would come from merchant data)
  const busyTimes: DayBusyTimes = generateMockBusyTimes(merchant.businessType, location?.hours);

  const daysOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const dayLabels: { [key: string]: string } = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const content = (
    <Space direction="vertical" size="middle" style={{ width: "100%", paddingBottom: 16 }}>

      {/* Opening Hours */}
      {location?.hours && (
        <div>
          <div 
            style={{ 
              marginBottom: showOpeningHours ? 12 : 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setShowOpeningHours(!showOpeningHours)}
          >
            <Text strong style={{ fontSize: 13 }}>
              Opening hours
            </Text>
            {showOpeningHours ? (
              <ChevronUp size={14} style={{ color: token.colorTextSecondary }} />
            ) : (
              <ChevronDown size={14} style={{ color: token.colorTextSecondary }} />
            )}
          </div>
          {showOpeningHours && (
            <div style={{ marginTop: 12 }}>
              {daysOrder.map((day) => {
                const hours = location.hours![day];
                const isWeekend = day === "saturday" || day === "sunday";

                return (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                    }}
                  >
                    <Text
                      type={isWeekend ? "secondary" : undefined}
                      style={{
                        fontSize: token.fontSizeSM,
                        minWidth: 100,
                      }}
                    >
                      {dayLabels[day]}
                    </Text>
                    <Text
                      type={isWeekend || hours.isClosed ? "secondary" : undefined}
                      style={{ fontSize: token.fontSizeSM }}
                    >
                      {hours.isClosed
                        ? "Closed"
                        : `${formatTime(hours.open)} - ${formatTime(hours.close)}`}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      

      {/* Busy Times */}
      {showBusyTimes && location?.hours && (
        <>
          <Divider style={{ margin: "0px 0" }} />
          <div 
            style={{ 
              marginBottom: showPopularTimes ? 8 : 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setShowPopularTimes(!showPopularTimes)}
          >
            <Text strong style={{ fontSize: 13 }}>
              Popular times
            </Text>
            {showPopularTimes ? (
              <ChevronUp size={14} style={{ color: token.colorTextSecondary }} />
            ) : (
              <ChevronDown size={14} style={{ color: token.colorTextSecondary }} />
            )}
          </div>
          {showPopularTimes && <>

              {/* Day selector */}
              <div style={{ marginBottom: 12 }}>
                <Segmented
                  value={selectedDay || currentDay}
                  onChange={(value) => setSelectedDay(value as string)}
                  options={daysOrder.map((day) => ({
                    label: dayLabels[day].slice(0, 3),
                    value: day,
                    disabled: location.hours![day].isClosed,
                  }))}
                  size="small"
                  style={{ fontSize: 12 }}
                />
              </div>

              {/* Busy times chart */}
              {(() => {
                const displayDay = selectedDay || currentDay;
                const dayHours = location.hours![displayDay];
                
                if (dayHours.isClosed) {
                  return (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                      }}
                    >
                      <Text type="secondary">Closed on this day</Text>
                    </div>
                  );
                }

                const dayBusyTimes = busyTimes[displayDay as keyof DayBusyTimes];
                
                if (!dayBusyTimes || dayBusyTimes.length === 0) {
                  return (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                      }}
                    >
                      <Text type="secondary">No busy time data available</Text>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-end",
                        height: 50,
                        marginBottom: 8,
                      }}
                    >
                      {dayBusyTimes.map((timeSlot) => {
                        return (
                          <div
                            key={timeSlot.hour}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              position: "relative",
                              minWidth: 4,
                              height: "100%",
                            }}
                            title={`${formatHour(timeSlot.hour)}: ${getBusyLabel(timeSlot.level)} (${Math.round(timeSlot.level)}%)`}
                          >
                            <div
                              style={{
                                height: `${Math.max(timeSlot.level, 5)}%`,
                                width: "100%",
                                background: token.colorFill,
                                borderRadius: "2px 2px 0 0",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.6";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Time labels */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 24,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        6 AM
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        12 PM
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        6 PM
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        12 AM
                      </Text>
                    </div>
                  </div>
                );
              })()}
          </>}
        </>
      )}
    </Space>
  );

  if (showCard) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        {content}
      </Card>
    );
  }

  return content;
};

// Helper functions

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
}

function getBusyLabel(level: number): string {
  if (level < 30) return "Not busy";
  if (level < 60) return "A bit busy";
  if (level < 80) return "Usually busy";
  return "Very busy";
}

// Generate mock busy times based on business type and opening hours
function generateMockBusyTimes(businessType: string, hours?: Location["hours"]): DayBusyTimes {
  const generateDayPattern = (
    peaks: Array<{ start: number; end: number; level: number }>,
    dayHours?: { open: string; close: string; isClosed: boolean }
  ): BusyTime[] => {
    const times: BusyTime[] = [];
    
    // Parse opening hours
    let openHour = 6;
    let closeHour = 24;
    if (dayHours && !dayHours.isClosed) {
      const [oh] = dayHours.open.split(":").map(Number);
      const [ch] = dayHours.close.split(":").map(Number);
      openHour = oh;
      closeHour = ch;
    }
    
    for (let hour = 6; hour < 24; hour++) {
      let level = 0;
      
      // Only show activity during opening hours
      if (!dayHours?.isClosed && hour >= openHour && hour < closeHour) {
        level = 10 + Math.random() * 15; // Base level: not busy
        
        // Check if hour falls within any peak period
        for (const peak of peaks) {
          if (hour >= peak.start && hour <= peak.end) {
            // Within peak hours
            const midPeak = (peak.start + peak.end) / 2;
            const distance = Math.abs(hour - midPeak);
            const maxDistance = (peak.end - peak.start) / 2;
            const falloff = distance / maxDistance;
            level = peak.level * (1 - falloff * 0.3); // 30% falloff from peak
            break;
          } else if (hour === peak.start - 1 || hour === peak.end + 1) {
            // Shoulder hours (hour before/after peak)
            level = peak.level * 0.5;
            break;
          }
        }
      }
      
      times.push({ hour, level: Math.max(0, Math.min(100, level)) });
    }
    return times;
  };

  // Different patterns based on business type
  if (businessType.toLowerCase().includes("restaurant")) {
    return {
      monday: generateDayPattern([
        { start: 11, end: 13, level: 70 },
        { start: 18, end: 20, level: 75 }
      ], hours?.monday),
      tuesday: generateDayPattern([
        { start: 11, end: 13, level: 70 },
        { start: 18, end: 20, level: 75 }
      ], hours?.tuesday),
      wednesday: generateDayPattern([
        { start: 11, end: 13, level: 75 },
        { start: 18, end: 20, level: 80 }
      ], hours?.wednesday),
      thursday: generateDayPattern([
        { start: 11, end: 13, level: 75 },
        { start: 18, end: 20, level: 85 }
      ], hours?.thursday),
      friday: generateDayPattern([
        { start: 11, end: 13, level: 80 },
        { start: 18, end: 21, level: 95 }
      ], hours?.friday),
      saturday: generateDayPattern([
        { start: 11, end: 14, level: 90 },
        { start: 18, end: 21, level: 95 }
      ], hours?.saturday),
      sunday: generateDayPattern([
        { start: 10, end: 14, level: 85 },
        { start: 17, end: 19, level: 70 }
      ], hours?.sunday),
    };
  } else if (businessType.toLowerCase().includes("spa") || businessType.toLowerCase().includes("salon")) {
    return {
      monday: generateDayPattern([{ start: 14, end: 18, level: 65 }], hours?.monday),
      tuesday: generateDayPattern([{ start: 14, end: 18, level: 70 }], hours?.tuesday),
      wednesday: generateDayPattern([{ start: 14, end: 19, level: 80 }], hours?.wednesday),
      thursday: generateDayPattern([{ start: 14, end: 19, level: 85 }], hours?.thursday),
      friday: generateDayPattern([{ start: 13, end: 19, level: 90 }], hours?.friday),
      saturday: generateDayPattern([{ start: 10, end: 17, level: 95 }], hours?.saturday),
      sunday: generateDayPattern([{ start: 11, end: 16, level: 70 }], hours?.sunday),
    };
  } else if (businessType.toLowerCase().includes("gym") || businessType.toLowerCase().includes("fitness")) {
    return {
      monday: generateDayPattern([
        { start: 6, end: 8, level: 90 },
        { start: 17, end: 20, level: 95 }
      ], hours?.monday),
      tuesday: generateDayPattern([
        { start: 6, end: 8, level: 90 },
        { start: 17, end: 20, level: 95 }
      ], hours?.tuesday),
      wednesday: generateDayPattern([
        { start: 6, end: 8, level: 85 },
        { start: 17, end: 20, level: 90 }
      ], hours?.wednesday),
      thursday: generateDayPattern([
        { start: 6, end: 8, level: 85 },
        { start: 17, end: 20, level: 90 }
      ], hours?.thursday),
      friday: generateDayPattern([
        { start: 6, end: 8, level: 80 },
        { start: 17, end: 19, level: 85 }
      ], hours?.friday),
      saturday: generateDayPattern([{ start: 8, end: 13, level: 80 }], hours?.saturday),
      sunday: generateDayPattern([{ start: 9, end: 13, level: 65 }], hours?.sunday),
    };
  } else {
    // Default pattern for general businesses
    return {
      monday: generateDayPattern([{ start: 12, end: 17, level: 70 }], hours?.monday),
      tuesday: generateDayPattern([{ start: 12, end: 17, level: 75 }], hours?.tuesday),
      wednesday: generateDayPattern([{ start: 12, end: 17, level: 75 }], hours?.wednesday),
      thursday: generateDayPattern([{ start: 12, end: 17, level: 80 }], hours?.thursday),
      friday: generateDayPattern([{ start: 12, end: 18, level: 85 }], hours?.friday),
      saturday: generateDayPattern([{ start: 11, end: 17, level: 90 }], hours?.saturday),
      sunday: generateDayPattern([{ start: 12, end: 16, level: 65 }], hours?.sunday),
    };
  }
}

export default MerchantInfoCard;

