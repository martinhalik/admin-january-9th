import React from "react";
import { Card, Select, Typography, theme, Badge, Space, Divider, Input, Row, Col, Checkbox } from "antd";
import { Globe, Link, Phone, Mail, Clock, Store, Truck, CalendarClock } from "lucide-react";
import RedemptionInstructionsEditor from "./RedemptionInstructionsEditor";

const { Text } = Typography;
const { useToken } = theme;

export type RedemptionMethod = "at-location" | "online" | "at-customers-location";
export type OnlineRedemptionType = "checkout" | "direct-link";

// Helper to replace placeholders with actual values
const replacePlaceholders = (
  template: string,
  phone?: string,
  email?: string,
  bookingUrl?: string
): string => {
  let result = template;
  
  // Replace placeholders with actual values or keep placeholder if not available
  if (phone) {
    result = result.replace(/\$phone/g, phone);
  }
  if (email) {
    result = result.replace(/\$email/g, email);
  }
  if (bookingUrl) {
    result = result.replace(/\$booking_url/g, bookingUrl);
  }
  
  return result;
};

// Default templates for redemption instructions based on method (HTML format for TipTap)
const getDefaultInstructions = (
  method: RedemptionMethod, 
  bookingRequired?: boolean,
  hasPhone?: boolean,
  hasEmail?: boolean,
  phone?: string,
  email?: string,
  bookingUrl?: string,
  hasOnline?: boolean,
  onlineRedemptionType?: OnlineRedemptionType,
  merchantName?: string
): string => {
  let template = "";
  
  switch (method) {
    case "at-location":
      if (bookingRequired) {
        // Build contact text based on what's selected
        const contactMethods = [];
        if (hasOnline && bookingUrl) {
          contactMethods.push("book online at <strong><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"$booking_url\">$booking_url</a></strong>");
        }
        if (hasPhone) {
          contactMethods.push("call them at <strong>$phone</strong>");
        }
        if (hasEmail) {
          contactMethods.push("email them at <strong>$email</strong>");
        }
        
        let contactInstruction = "";
        if (contactMethods.length === 0) {
          // No booking method selected - return empty string to show empty state
          return "";
        } else if (contactMethods.length === 1) {
          contactInstruction = contactMethods[0].charAt(0).toUpperCase() + contactMethods[0].slice(1);
        } else if (contactMethods.length === 2) {
          contactInstruction = contactMethods[0].charAt(0).toUpperCase() + contactMethods[0].slice(1) + " or " + contactMethods[1];
        } else {
          // 3 or more methods: "Method1, method2, or method3"
          const lastMethod = contactMethods[contactMethods.length - 1];
          const otherMethods = contactMethods.slice(0, -1);
          contactInstruction = otherMethods[0].charAt(0).toUpperCase() + otherMethods[0].slice(1) + ", " + otherMethods.slice(1).join(", ") + ", or " + lastMethod;
        }
        
        template = `<p><strong>1. Book in Advance, Appointment Required</strong> – ${contactInstruction} — and don't forget to mention your Groupon voucher.<br><strong>2. Show Your Voucher &amp; Enjoy:</strong> On the day of your appointment, present your groupon (either on your phone or a printout) upon arrival. That's it!</p><p><em>Need help finding your voucher? No problem! Here's how:</em></p><p>Groupon App: Go to 'My Stuff'<br>Desktop: Go to 'My Groupons' &gt; 'See Details'<br>Your voucher will be displayed there.</p><p>Still Have Questions? We've got answers. Check out our <a target="_blank" rel="noopener noreferrer" href="https://www.groupon.com/faq">FAQs</a>.</p>`;
      } else {
        template = `<p><strong>1. Easy Redemption — No Booking Needed!</strong><br><strong>2.</strong> Show your Groupon voucher (either on your phone or a printout) upon arrival.<br><strong>3. That's it!</strong> You're all set.</p><p><em>Need help finding your redemption code? No problem! Here's how:</em></p><p>Groupon App: Go to 'My Stuff'<br>Desktop: Go to 'My Groupons' &gt; 'See Details'<br>Your redemption code will be displayed there.</p><p>Have Questions? Check out our <a target="_blank" rel="noopener noreferrer" href="https://www.groupon.com/faq">FAQs</a>!</p>`;
      }
      break;
    
    case "online":
      // For online redemption, check the type
      if (onlineRedemptionType === "direct-link") {
        // Direct redemption link - auto-apply code
        const merchantNameText = merchantName || "the merchant";
        template = `<p><strong>1. Click the Redeem Online button on your voucher.</strong><br><strong>2. You will be redirected to ${merchantNameText}'s website and your promo code will be automatically applied.</strong><br><strong>3. See below:</strong></p><p>Follow the instructions on their site to complete your booking or purchase.</p><p><em>Need help finding your redemption code? No problem! Here's how:</em></p><p>Groupon App: Go to 'My Stuff'<br>Desktop: Go to 'My Groupons' &gt; 'See Details'<br>You'll find your code there.</p><p>Have Questions? Check out our <a target="_blank" rel="noopener noreferrer" href="https://www.groupon.com/faq">FAQs</a>!</p>`;
      } else {
        // Enter code at checkout (default)
        template = `<p><strong>1. Visit the Website:</strong> Go to the redemption page <strong><a target="_blank" rel="noopener noreferrer" href="$booking_url">here</a></strong><br><strong>2. Enter Your Code:</strong> At checkout, enter your redemption code.<br><strong>3. Finalize Your Order:</strong> Complete your purchase or booking.<br><strong>4. You're All Set:</strong> Get ready to enjoy your experience!</p><p><em>Need help finding your redemption code? No problem! Here's how:</em></p><p>Groupon App: Go to 'My Stuff'<br>Desktop: Go to 'My Groupons' &gt; 'See Details'<br>You'll find your code there.</p><p>Have Questions? Check out our <a target="_blank" rel="noopener noreferrer" href="https://www.groupon.com/faq">FAQs</a>!</p>`;
      }
      break;
    
    case "at-customers-location":
      // Build contact methods array similar to at-location
      const contactMethodsCustomer = [];
      if (hasOnline && bookingUrl) {
        contactMethodsCustomer.push("book online at <strong><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"$booking_url\">$booking_url</a></strong>");
      }
      if (hasPhone) {
        contactMethodsCustomer.push("call them at <strong>$phone</strong>");
      }
      if (hasEmail) {
        contactMethodsCustomer.push("email them at <strong>$email</strong>");
      }

      let contactInstructionCustomer = "";
      if (contactMethodsCustomer.length === 0) {
        return ""; // Empty state trigger
      } else if (contactMethodsCustomer.length === 1) {
        contactInstructionCustomer = contactMethodsCustomer[0].charAt(0).toUpperCase() + contactMethodsCustomer[0].slice(1);
      } else if (contactMethodsCustomer.length === 2) {
        contactInstructionCustomer = contactMethodsCustomer[0].charAt(0).toUpperCase() + contactMethodsCustomer[0].slice(1) + " or " + contactMethodsCustomer[1];
      } else {
        const lastMethod = contactMethodsCustomer[contactMethodsCustomer.length - 1];
        const otherMethods = contactMethodsCustomer.slice(0, -1);
        contactInstructionCustomer = otherMethods[0].charAt(0).toUpperCase() + otherMethods[0].slice(1) + ", " + otherMethods.slice(1).join(", ") + ", or " + lastMethod;
      }
      
      template = `<p><strong>1. Schedule Your Appointment</strong><br>${contactInstructionCustomer} to schedule a time for the service professional to visit your location. Be sure to mention your Groupon voucher when booking.</p><p><strong>2. Confirm Your Details</strong><br>Provide your location address and any specific requirements or access instructions during booking.</p><p><strong>3. Service Day</strong><br>The service professional will arrive at your location at the scheduled time. Have your Groupon voucher ready to show (either on your phone or a printout).</p><p><strong>4. Enjoy Your Service!</strong><br>Sit back and let the professional take care of everything.</p><p><em>Need help finding your voucher? No problem! Here's how:</em></p><p>Groupon App: Go to 'My Stuff'<br>Desktop: Go to 'My Groupons' &gt; 'See Details'<br>Your voucher will be displayed there.</p><p>Have Questions? Check out our <a target="_blank" rel="noopener noreferrer" href="https://www.groupon.com/faq">FAQs</a>!</p>`;
      break;
    
    default:
      return "";
  }
  
  // Replace placeholders with actual values
  return replacePlaceholders(template, phone, email, bookingUrl);
};

interface RedemptionMethodSectionProps {
  redemptionMethod: RedemptionMethod;
  onRedemptionMethodChange: (method: RedemptionMethod) => void;
  redemptionInstructions: string;
  onRedemptionInstructionsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  originalRedemptionInstructions?: string;
  isRedemptionInstructionsAuto?: boolean;
  onIsRedemptionInstructionsAutoChange?: (isAuto: boolean) => void;
  // Online redemption type
  onlineRedemptionType?: OnlineRedemptionType;
  onOnlineRedemptionTypeChange?: (type: OnlineRedemptionType) => void;
  redemptionLinkUrl?: string;
  onRedemptionLinkUrlChange?: (url: string) => void;
  redemptionCodeParameter?: string;
  onRedemptionCodeParameterChange?: (param: string) => void;
  // Booking configuration for at-location
  bookingRequired?: boolean;
  bookingHoursAhead?: number;
  bookingMethodOnline?: boolean;
  bookingMethodPhone?: boolean;
  bookingMethodEmail?: boolean;
  bookingOnlineUrl?: string;
  bookingPhone?: string;
  bookingEmail?: string;
  onBookingRequiredChange?: (required: boolean) => void;
  onBookingHoursAheadChange?: (hours: number) => void;
  onBookingMethodOnlineChange?: (enabled: boolean) => void;
  onBookingMethodPhoneChange?: (enabled: boolean) => void;
  onBookingMethodEmailChange?: (enabled: boolean) => void;
  onBookingOnlineUrlChange?: (url: string) => void;
  onBookingPhoneChange?: (phone: string) => void;
  onBookingEmailChange?: (email: string) => void;
  // Merchant account defaults
  merchantWebsite?: string;
  merchantPhone?: string;
  merchantEmail?: string;
  merchantName?: string;
  // Custom URLs
  customBookingUrl?: string;
  customRedemptionUrl?: string;
  onCustomBookingUrlChange?: (url: string) => void;
  onCustomRedemptionUrlChange?: (url: string) => void;
  // Redemption dynamic values
  redemptionPhone?: string;
  redemptionEmail?: string;
  redemptionLocationAddress?: string;
  redemptionBusinessHours?: string;
  redemptionValidityDays?: number;
  onRedemptionPhoneChange?: (phone: string) => void;
  onRedemptionEmailChange?: (email: string) => void;
  onRedemptionLocationAddressChange?: (address: string) => void;
  onRedemptionBusinessHoursChange?: (hours: string) => void;
  onRedemptionValidityDaysChange?: (days: number) => void;
  changeCount?: number;
  instructionsChangeCount?: number;
}

const RedemptionMethodSection: React.FC<RedemptionMethodSectionProps> = ({
  redemptionMethod,
  onRedemptionMethodChange,
  redemptionInstructions,
  onRedemptionInstructionsChange,
  originalRedemptionInstructions,
  isRedemptionInstructionsAuto = true,
  onIsRedemptionInstructionsAutoChange,
  onlineRedemptionType = "checkout",
  onOnlineRedemptionTypeChange,
  redemptionLinkUrl = "",
  onRedemptionLinkUrlChange,
  redemptionCodeParameter = "code",
  onRedemptionCodeParameterChange,
  bookingRequired = false,
  bookingHoursAhead = 1,
  bookingMethodOnline = false,
  bookingMethodPhone = false,
  bookingMethodEmail = false,
  bookingOnlineUrl = "",
  bookingPhone = "",
  bookingEmail = "",
  onBookingRequiredChange,
  onBookingHoursAheadChange,
  onBookingMethodOnlineChange,
  onBookingMethodPhoneChange,
  onBookingMethodEmailChange,
  onBookingOnlineUrlChange,
  onBookingPhoneChange,
  onBookingEmailChange,
  merchantWebsite = "",
  merchantPhone = "",
  merchantEmail = "",
  merchantName = "",
  customBookingUrl: _customBookingUrl = "",
  customRedemptionUrl: _customRedemptionUrl = "",
  // onCustomBookingUrlChange and onCustomRedemptionUrlChange are not used in this component
  redemptionPhone: _redemptionPhone = "",
  redemptionEmail: _redemptionEmail = "",
  redemptionLocationAddress = "",
  redemptionBusinessHours = "",
  redemptionValidityDays: _redemptionValidityDays = 90,
  // onRedemptionPhoneChange, onRedemptionEmailChange, etc. are not used in this component
  changeCount = 0,
  instructionsChangeCount = 0,
}) => {
  const { token } = useToken();

  // Auto-update redemption instructions when method or booking requirement changes
  React.useEffect(() => {
    if (isRedemptionInstructionsAuto) {
      const newInstructions = getDefaultInstructions(
        redemptionMethod, 
        bookingRequired,
        bookingMethodPhone,
        bookingMethodEmail,
        bookingPhone || merchantPhone,
        bookingEmail || merchantEmail,
        bookingOnlineUrl || redemptionLinkUrl || merchantWebsite,
        bookingMethodOnline,
        onlineRedemptionType,
        merchantName
      );
      
      // Always update if in auto mode to ensure templates are current
      if (redemptionInstructions !== newInstructions) {
        onRedemptionInstructionsChange({
          target: { value: newInstructions }
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
    }
  }, [redemptionMethod, bookingRequired, isRedemptionInstructionsAuto, redemptionInstructions, bookingMethodOnline, bookingMethodPhone, bookingMethodEmail, bookingPhone, bookingEmail, bookingOnlineUrl, redemptionLinkUrl, merchantPhone, merchantEmail, merchantWebsite, merchantName, onlineRedemptionType]);

  const redemptionOptions = [
    {
      value: "at-location" as RedemptionMethod,
      label: "At merchant's location",
      icon: <Store size={14} />,
      description: "Customer redeems the deal at merchant's physical location",
    },
    {
      value: "online" as RedemptionMethod,
      label: "Online redemption",
      icon: <Globe size={14} />,
      description: "Online product or reservation system",
    },
    {
      value: "at-customers-location" as RedemptionMethod,
      label: "Redeem at customer's location",
      icon: <Truck size={14} />,
      description: "Merchant comes to customer's location (e.g., cleaning, repair services)",
    },
  ];

  const selectedOption = redemptionOptions.find((opt) => opt.value === redemptionMethod);

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong style={{ fontSize: 15 }}>
            Redemption Method
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
      style={{
        marginTop: 16,
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
      }}
      styles={{
        body: {
          padding: "16px 20px",
        },
      }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            Select how customers will redeem this deal
          </Text>
          <Row gutter={12}>
            {/* Calculate span based on number of inputs shown */}
            {(() => {
              let inputCount = 1; // Always have redemption method
              
              // Count additional inputs based on redemption method
              if (redemptionMethod === "at-location") {
                inputCount++; // Booking required dropdown
                if (bookingRequired) {
                  inputCount++; // Booking methods dropdown
                }
              } else if (redemptionMethod === "online") {
                inputCount++; // Online redemption type
              } else if (redemptionMethod === "at-customers-location") {
                inputCount++; // Contact methods dropdown
              }
              
              // Calculate span: 3 inputs = 8 each, 2 inputs = 12 each, 1 input = 12
              const spanSize = inputCount === 3 ? 8 : 12;
              
              return (
                <>
                  {/* Redemption Method */}
                  <Col xs={24} sm={24} md={spanSize}>
                    <Select
                      value={redemptionMethod}
                      onChange={(value) => {
                        // Switch to auto mode when redemption method changes
                        onIsRedemptionInstructionsAutoChange?.(true);
                        
                        // If switching to online, ensure bookingMethodOnline is true
                        if (value === "online") {
                          onBookingMethodOnlineChange?.(true);
                        }
                        
                        onRedemptionMethodChange(value);
                      }}
                      style={{ width: "100%" }}
                      size="large"
                      options={redemptionOptions.map((opt) => ({
                        value: opt.value,
                        label: (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {opt.icon}
                            <span>{opt.label}</span>
                          </div>
                        ),
                      }))}
                    />
                  </Col>

                  {/* Booking Required - Show for at-location */}
                  {redemptionMethod === "at-location" && (
                    <Col xs={24} sm={24} md={spanSize}>
                      <Select
                        value={bookingRequired ? "required" : "not-required"}
                        onChange={(value) => {
                          // Switch to auto mode when booking requirement changes
                          onIsRedemptionInstructionsAutoChange?.(true);
                          onBookingRequiredChange?.(value === "required");
                        }}
                        style={{ width: "100%" }}
                        size="large"
                        options={[
                          {
                            value: "not-required",
                            label: (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Store size={14} />
                                <span>Walk-in only</span>
                              </div>
                            ),
                          },
                          {
                            value: "required",
                            label: (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <CalendarClock size={14} />
                                <span>Booking required</span>
                              </div>
                            ),
                          },
                        ]}
                      />
                    </Col>
                  )}

                  {/* Online Redemption Type Dropdown */}
                  {redemptionMethod === "online" && (
                    <Col xs={24} sm={24} md={spanSize}>
                      <Select
                        value={onlineRedemptionType}
                        onChange={(value) => onOnlineRedemptionTypeChange?.(value)}
                        style={{ width: "100%" }}
                        size="large"
                        options={[
                          {
                            value: "checkout",
                            label: (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Globe size={14} />
                                <span>Enter code at checkout</span>
                              </div>
                            ),
                          },
                          {
                            value: "direct-link",
                            label: (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Link size={14} />
                                <span>Direct redemption link</span>
                              </div>
                            ),
                          },
                        ]}
                      />
                    </Col>
                  )}

                  {/* Booking Methods for At Customer's Location */}
                  {redemptionMethod === "at-customers-location" && (
                    <Col xs={24} sm={24} md={spanSize}>
                      <Select
                        mode="multiple"
                        value={[
                          ...(bookingMethodOnline ? ["online"] : []),
                          ...(bookingMethodPhone ? ["phone"] : []),
                          ...(bookingMethodEmail ? ["email"] : []),
                        ]}
                        onChange={(values) => {
                          onBookingMethodOnlineChange?.(values.includes("online"));
                          onBookingMethodPhoneChange?.(values.includes("phone"));
                          onBookingMethodEmailChange?.(values.includes("email"));
                        }}
                        style={{ width: "100%" }}
                        size="large"
                        placeholder="Choose one or more..."
                        maxTagCount="responsive"
                        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
                        showArrow
                        allowClear
                        menuItemSelectedIcon={null}
                        tagRender={(props) => {
                          const { label, closable, onClose } = props;
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0 8px",
                                height: 24,
                                fontSize: 14,
                                lineHeight: "22px",
                                background: token.colorBgContainer,
                                border: `1px solid ${token.colorBorder}`,
                                borderRadius: 4,
                                marginRight: 4,
                              }}
                            >
                              {label}
                              {closable && (
                                <span
                                  onClick={onClose}
                                  style={{
                                    marginLeft: 4,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                  }}
                                >
                                  ×
                                </span>
                              )}
                            </span>
                          );
                        }}
                        options={[
                          {
                            value: "online",
                            label: "Online form",
                          },
                          {
                            value: "phone",
                            label: "Phone",
                          },
                          {
                            value: "email",
                            label: "Email",
                          },
                        ]}
                      />
                    </Col>
                  )}

                  {/* Booking Methods - Show when booking required */}
                  {redemptionMethod === "at-location" && bookingRequired && (
                    <Col xs={24} sm={24} md={spanSize}>
                      <Select
                        mode="multiple"
                        value={[
                          ...(bookingMethodOnline ? ["online"] : []),
                          ...(bookingMethodPhone ? ["phone"] : []),
                          ...(bookingMethodEmail ? ["email"] : []),
                        ]}
                        onChange={(values) => {
                          onBookingMethodOnlineChange?.(values.includes("online"));
                          onBookingMethodPhoneChange?.(values.includes("phone"));
                          onBookingMethodEmailChange?.(values.includes("email"));
                        }}
                        style={{ width: "100%" }}
                        size="large"
                        placeholder="Choose one or more..."
                        maxTagCount="responsive"
                        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
                        showArrow
                        allowClear
                        menuItemSelectedIcon={null}
                        tagRender={(props) => {
                          const { label, closable, onClose } = props;
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0 8px",
                                height: 24,
                                fontSize: 14,
                                lineHeight: "22px",
                                background: token.colorBgContainer,
                                border: `1px solid ${token.colorBorder}`,
                                borderRadius: 4,
                                marginRight: 4,
                              }}
                            >
                              {label}
                              {closable && (
                                <span
                                  onClick={onClose}
                                  style={{
                                    marginLeft: 4,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                  }}
                                >
                                  ×
                                </span>
                              )}
                            </span>
                          );
                        }}
                        options={[
                          {
                            value: "online",
                            label: "Online form",
                          },
                          {
                            value: "phone",
                            label: "Phone",
                          },
                          {
                            value: "email",
                            label: "Email",
                          },
                        ]}
                        optionRender={(option) => {
                          const isSelected = [
                            ...(bookingMethodOnline ? ["online"] : []),
                            ...(bookingMethodPhone ? ["phone"] : []),
                            ...(bookingMethodEmail ? ["email"] : []),
                          ].includes(option.value as string);

                          return (
                            <Space>
                              <Checkbox checked={isSelected} />
                              {option.value === "online" && <Globe size={14} />}
                              {option.value === "phone" && <Phone size={14} />}
                              {option.value === "email" && <Mail size={14} />}
                              <span>{option.label}</span>
                            </Space>
                          );
                        }}
                      />
                    </Col>
                  )}
                </>
              );
            })()}
          </Row>

          {selectedOption && (
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
              {selectedOption.description}
            </Text>
          )}
        </div>

        {/* Online Redemption Type Selector - removed, now using dropdown in main redemption method row */}

        {/* Booking Details for Online Redemption */}
        {redemptionMethod === "online" && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 8,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 13,
                display: "block",
                marginBottom: 12,
                color: token.colorText,
              }}
            >
              {onlineRedemptionType === "direct-link" ? "Redemption Link Details" : "Booking Details"}
            </Text>

            <Row gutter={12}>
              {/* Show different fields based on redemption type */}
              {onlineRedemptionType === "direct-link" ? (
                <>
                  <Col span={16}>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                        <Link size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Redemption Link URL
                      </Text>
                      <Input
                        value={redemptionLinkUrl || merchantWebsite}
                        onChange={(e) => onRedemptionLinkUrlChange?.(e.target.value)}
                        placeholder={merchantWebsite || "https://merchant.com/redeem"}
                        prefix={<Link size={14} color={token.colorTextTertiary} />}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                        Code Parameter
                      </Text>
                      <Input
                        value={redemptionCodeParameter}
                        onChange={(e) => onRedemptionCodeParameterChange?.(e.target.value)}
                        placeholder="code"
                        style={{ width: "100%" }}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        e.g., "?code=" or "?promo="
                      </Text>
                    </div>
                  </Col>
                </>
              ) : (
                <>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                        <Globe size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Online Booking URL
                      </Text>
                      <Input
                        value={bookingOnlineUrl || merchantWebsite}
                        onChange={(e) => onBookingOnlineUrlChange?.(e.target.value)}
                        placeholder={merchantWebsite || "https://booking.example.com"}
                        prefix={<Link size={14} color={token.colorTextTertiary} />}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}

        {/* Booking Details - Show when booking is required and at least one method is selected */}
        {redemptionMethod === "at-location" && bookingRequired && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail) && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 8,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 13,
                display: "block",
                marginBottom: 12,
                color: token.colorText,
              }}
            >
              Booking Details
            </Text>

            <Row gutter={12}>
              {/* Advance Notice */}
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                    <Clock size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Advance notice
                  </Text>
                  <Select
                    value={bookingHoursAhead}
                    onChange={(value) => onBookingHoursAheadChange?.(value)}
                    style={{ width: "100%" }}
                    options={[
                      { value: 1, label: "1 day" },
                      { value: 2, label: "2 days" },
                      { value: 3, label: "3 days" },
                      { value: 5, label: "5 days" },
                      { value: 7, label: "1 week" },
                      { value: 14, label: "2 weeks" },
                      { value: 30, label: "1 month" },
                    ]}
                  />
                </div>
              </Col>

              {bookingMethodOnline && (
                <Col span={bookingMethodPhone || bookingMethodEmail ? 12 : 12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Globe size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Online Booking URL
                    </Text>
                    <Input
                      value={bookingOnlineUrl || merchantWebsite}
                      onChange={(e) => onBookingOnlineUrlChange?.(e.target.value)}
                      placeholder={merchantWebsite || "https://booking.example.com"}
                      prefix={<Link size={14} color={token.colorTextTertiary} />}
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}

              {bookingMethodPhone && (
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Phone size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Phone Number
                    </Text>
                    <Input
                      value={bookingPhone || merchantPhone}
                      onChange={(e) => onBookingPhoneChange?.(e.target.value)}
                      placeholder={merchantPhone || "(555) 123-4567"}
                      prefix={<Phone size={14} color={token.colorTextTertiary} />}
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}

              {bookingMethodEmail && (
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Mail size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Email Address
                    </Text>
                    <Input
                      value={bookingEmail || merchantEmail}
                      onChange={(e) => onBookingEmailChange?.(e.target.value)}
                      placeholder={merchantEmail || "bookings@example.com"}
                      prefix={<Mail size={14} color={token.colorTextTertiary} />}
                      type="email"
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}

        {/* Booking Details for At Customer's Location */}
        {redemptionMethod === "at-customers-location" && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail) && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 8,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 13,
                display: "block",
                marginBottom: 12,
                color: token.colorText,
              }}
            >
              Booking Details
            </Text>

            <Row gutter={12}>
              {/* Advance Notice */}
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                    <Clock size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Advance notice
                  </Text>
                  <Select
                    value={bookingHoursAhead}
                    onChange={(value) => onBookingHoursAheadChange?.(value)}
                    style={{ width: "100%" }}
                    options={[
                      { value: 1, label: "1 day" },
                      { value: 2, label: "2 days" },
                      { value: 3, label: "3 days" },
                      { value: 5, label: "5 days" },
                      { value: 7, label: "1 week" },
                      { value: 14, label: "2 weeks" },
                      { value: 30, label: "1 month" },
                    ]}
                  />
                </div>
              </Col>

              {bookingMethodOnline && (
                <Col span={bookingMethodPhone || bookingMethodEmail ? 12 : 12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Globe size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Online Booking URL
                    </Text>
                    <Input
                      value={bookingOnlineUrl || merchantWebsite}
                      onChange={(e) => onBookingOnlineUrlChange?.(e.target.value)}
                      placeholder={merchantWebsite || "https://booking.example.com"}
                      prefix={<Link size={14} color={token.colorTextTertiary} />}
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}

              {bookingMethodPhone && (
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Phone size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Phone Number
                    </Text>
                    <Input
                      value={bookingPhone || merchantPhone}
                      onChange={(e) => onBookingPhoneChange?.(e.target.value)}
                      placeholder={merchantPhone || "(555) 123-4567"}
                      prefix={<Phone size={14} color={token.colorTextTertiary} />}
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}

              {bookingMethodEmail && (
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      <Mail size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      Email Address
                    </Text>
                    <Input
                      value={bookingEmail || merchantEmail}
                      onChange={(e) => onBookingEmailChange?.(e.target.value)}
                      placeholder={merchantEmail || "bookings@example.com"}
                      prefix={<Mail size={14} color={token.colorTextTertiary} />}
                      type="email"
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}

        {/* Divider - only show if instructions will be shown */}
        {((redemptionMethod === "at-location" && !bookingRequired) ||
          (redemptionMethod === "at-location" && bookingRequired && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail)) ||
          redemptionMethod === "online" ||
          (redemptionMethod === "at-customers-location" && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail))) && (
          <Divider style={{ margin: "16px 0" }} />
        )}

        {/* Empty state when booking is required but no method is selected */}
        {((redemptionMethod === "at-location" && bookingRequired && !bookingMethodOnline && !bookingMethodPhone && !bookingMethodEmail) ||
          (redemptionMethod === "at-customers-location" && !bookingMethodOnline && !bookingMethodPhone && !bookingMethodEmail)) && (
          <div
            style={{
              padding: "32px 24px",
              textAlign: "center",
              border: `2px dashed ${token.colorBorder}`,
              borderRadius: 8,
              background: token.colorBgLayout,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <CalendarClock size={48} color={token.colorTextTertiary} strokeWidth={1.5} />
            </div>
            <Text strong style={{ display: "block", fontSize: 15, marginBottom: 8 }}>
              Select Booking Method
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Please select at least one booking method above to generate redemption instructions.
            </Text>
          </div>
        )}

        {/* Redemption Instructions Editor - only show when appropriate methods are selected */}
        {((redemptionMethod === "at-location" && !bookingRequired) ||
          (redemptionMethod === "at-location" && bookingRequired && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail)) ||
          redemptionMethod === "online" ||
          (redemptionMethod === "at-customers-location" && (bookingMethodOnline || bookingMethodPhone || bookingMethodEmail))) && (
          <RedemptionInstructionsEditor
            instructions={redemptionInstructions}
            originalInstructions={originalRedemptionInstructions}
            onInstructionsChange={onRedemptionInstructionsChange}
            changeCount={instructionsChangeCount}
            isAuto={isRedemptionInstructionsAuto}
            onIsAutoChange={onIsRedemptionInstructionsAutoChange}
            onUseAuto={() => {
              // Switch back to auto and generate new instructions
              onIsRedemptionInstructionsAutoChange?.(true);
              const newInstructions = getDefaultInstructions(
                redemptionMethod, 
                bookingRequired,
                bookingMethodPhone,
                bookingMethodEmail,
                bookingPhone || merchantPhone,
                bookingEmail || merchantEmail,
                bookingOnlineUrl || redemptionLinkUrl || merchantWebsite,
                bookingMethodOnline,
                onlineRedemptionType,
                merchantName
              );
              onRedemptionInstructionsChange({
                target: { value: newInstructions }
              } as React.ChangeEvent<HTMLTextAreaElement>);
            }}
            dynamicValues={{
              phone: bookingPhone || merchantPhone,
              email: bookingEmail || merchantEmail,
              locationAddress: redemptionLocationAddress,
              businessHours: redemptionBusinessHours,
              validityDays: bookingHoursAhead,
              website: merchantWebsite || "https://www.amazingspa.com",
              bookingUrl: bookingOnlineUrl || merchantWebsite,
            }}
          />
        )}
      </Space>
    </Card>
  );
};

export default RedemptionMethodSection;

