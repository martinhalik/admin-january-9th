import React, { useState } from "react";
import { Collapse, Space, Typography, Badge, Button, Card, Avatar, message, theme, Divider, Segmented, Tag } from "antd";
import { Plus, Check, ChevronRight, Eye, Paperclip, FileText, PanelRightClose, Compass, Briefcase, Clock } from "lucide-react";
import { Deal } from "../../data/mockDeals";
import { generatedMockDeals } from "../../data/generatedMockDeals";
import { MerchantAccount } from "../../data/merchantAccounts";
import SimilarDealsMap from "../SimilarDealsMap";
import MerchantInfoCard from "../MerchantInfoCard";
import MerchantSnapshotCard from "../MerchantSnapshotCard";
import { mockLocations } from "../../data/locationData";
import { generateAvatar } from "../../lib/avatarGenerator";
import { useRoleView } from "../../contexts/RoleViewContext";
import { getEmployeeById } from "../../data/companyHierarchy";

const { Text, Paragraph } = Typography;
const { useToken } = theme;

interface DefaultSidebarContentProps {
  isNewDeal: boolean;
  deal?: Deal | null;
  selectedMerchantAccount?: MerchantAccount | null;
  expectations?: {
    totalProjectedRevenue: number;
    totalProjectedOrders: number;
    marketDemand?: string;
    confidence?: number;
    seasonality?: string;
  } | null;
  activeTab?: string;
  onPersonClick?: (personId: string) => void;
}

const DefaultSidebarContent: React.FC<DefaultSidebarContentProps> = ({ 
  isNewDeal, 
  deal, 
  selectedMerchantAccount,
  expectations,
  activeTab = 'discovery',
  onPersonClick,
}) => {
  const { token } = useToken();
  const { currentUser } = useRoleView();
  
  // Get current user as account owner
  const currentEmployee = getEmployeeById(currentUser.employeeId);
  const accountOwnerInitials = currentUser.name.split(' ').map(n => n[0]).join('');

  // Check if deal is in draft stage to show AI advisory content
  const isDraftStage = deal?.campaignStage === 'draft';

  // Get location data for the merchant (if available)
  const merchantLocations = selectedMerchantAccount ? mockLocations[selectedMerchantAccount.id] : [];
  const primaryLocation = merchantLocations && merchantLocations.length > 0 ? merchantLocations[0] : selectedMerchantAccount?.locationData;

  // Build Discovery tab items (Merchant Info)
  const discoveryItems = [];
  
  // ALWAYS show Merchant Info section when merchant account is available
  if (selectedMerchantAccount) {
      discoveryItems.push({
        key: 'merchant-info',
        label: <Text strong style={{ fontSize: 16 }}>Merchant Info</Text>,
        children: (
          <div style={{ padding: '16px 0 20px 0' }}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <MerchantSnapshotCard
                merchant={selectedMerchantAccount}
                showCard={false}
                compact={true}
                showPotentialScore={true}
              />

              {/* Opening Hours and Popular Times */}
              {primaryLocation && (
                <>
                  <Divider style={{ margin: "8px 0" }} />
                  <MerchantInfoCard 
                    merchant={selectedMerchantAccount}
                    location={primaryLocation}
                    showBusyTimes={true}
                    showCard={false}
                  />
                </>
              )}
            </Space>
          </div>
        ),
      });
  }

  // Build Work tab items (Tasks, Changes, Roles, Notes)
  const workItems = [];
  workItems.push(
        {
          key: 'tasks',
          label: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              paddingRight: 16,
            }}>
              <Text strong style={{ fontSize: 16 }}>Tasks</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge 
                  count={3} 
                  style={{ 
                    backgroundColor: token.colorBgTextHover,
                    color: token.colorText,
                    fontWeight: 500,
                    fontSize: 12,
                  }} 
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Plus size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info('Add task clicked');
                  }}
                />
              </div>
            </div>
          ),
          children: !isNewDeal ? (
            <div style={{ padding: '0 0 20px 0' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={0}>
                {/* Completed Task 1 */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 12,
                    padding: '12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorBgTextActive;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                >
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: token.colorText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <Check size={14} color="white" strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      style={{ 
                        textDecoration: 'line-through',
                        color: token.colorTextTertiary,
                        fontSize: 14,
                      }}
                    >
                      Writer completed
                    </Text>
                    <div style={{ 
                      fontSize: 12, 
                      color: token.colorTextTertiary, 
                      marginTop: 2 
                    }}>
                      Aug 29, 11:47 PM
                    </div>
                  </div>
                </div>
                
                {/* Completed Task 2 */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 12,
                    padding: '12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    transition: 'all 0.2s',
                    marginTop: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorBgTextActive;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                >
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: token.colorText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <Check size={14} color="white" strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      style={{ 
                        textDecoration: 'line-through',
                        color: token.colorTextTertiary,
                        fontSize: 14,
                      }}
                    >
                      Image Ready
                    </Text>
                    <div style={{ 
                      fontSize: 12, 
                      color: token.colorTextTertiary, 
                      marginTop: 2 
                    }}>
                      Aug 29, 11:47 PM
                    </div>
                  </div>
                </div>
                
                {/* Uncompleted Task */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 12,
                    padding: '12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    transition: 'all 0.2s',
                    marginTop: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorBgTextActive;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                >
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    border: `2px solid ${token.colorBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, display: 'block' }}>
                      Other
                    </Text>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: 12,
                        display: 'block',
                        marginTop: 2,
                      }}
                    >
                      City Planner
                    </Text>
                    <div style={{ 
                      fontSize: 12, 
                      color: token.colorTextTertiary, 
                      marginTop: 2 
                    }}>
                      Nov 10, 12:00 PM
                    </div>
                  </div>
                  <div style={{ 
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <Eye size={16} color={token.colorTextTertiary} />
                  </div>
                </div>
              </Space>
            </div>
          ) : (
            <div style={{ padding: '0 0 16px 0', textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>No tasks yet</Text>
            </div>
          ),
        },
        {
          key: 'roles',
          label: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              paddingRight: 16,
            }}>
              <Text strong style={{ fontSize: 16 }}>Roles</Text>
              <Badge 
                count={4} 
                style={{ 
                  backgroundColor: token.colorBgTextHover,
                  color: token.colorText,
                  fontWeight: 500,
                  fontSize: 12,
                }} 
              />
            </div>
          ),
          children: (
            <div style={{ padding: '0 0 16px 0' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* Account Owner */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: token.colorBgTextHover,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorBgTextActive;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                  onClick={() => onPersonClick?.(currentUser.employeeId)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar 
                      size={32} 
                      style={{ background: '#4CAF50', flexShrink: 0 }}
                      src={currentEmployee?.avatar}
                    >
                      {accountOwnerInitials}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                        Account Owner
                      </div>
                      <Text strong style={{ fontSize: 13 }}>{currentUser.name}</Text>
                    </div>
                    <ChevronRight size={14} color={token.colorTextTertiary} />
                  </div>
                </div>

                {/* Deal Owner */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: token.colorBgTextHover,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorBgTextActive;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                  onClick={() => onPersonClick?.('kn-001')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar size={32} style={{ background: '#2196F3', flexShrink: 0 }}>
                      KN
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                        Deal Owner
                      </div>
                      <Text strong style={{ fontSize: 13 }}>Kamila Novak</Text>
                    </div>
                    <ChevronRight size={14} color={token.colorTextTertiary} />
                  </div>
                </div>

                {/* See More for secondary roles */}
                <Collapse
                  ghost
                  bordered={false}
                  style={{ 
                    background: 'transparent',
                    marginTop: 4,
                  }}
                  expandIcon={({ isActive }) => (
                    <ChevronRight 
                      size={14} 
                      style={{ 
                        transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }} 
                    />
                  )}
                  items={[
                    {
                      key: 'more-roles',
                      label: <Text type="secondary" style={{ fontSize: 12 }}>See more roles (2)</Text>,
                      children: (
                        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
                          {/* Content Editor */}
                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: token.colorBgContainer,
                              border: `1px solid ${token.colorBorder}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = token.colorBgTextHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = token.colorBgContainer;
                            }}
                            onClick={() => onPersonClick?.('mr-001')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar size={24} style={{ background: '#FF9800', fontSize: 11 }}>
                                MR
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, color: token.colorTextTertiary }}>
                                  Content Editor
                                </div>
                                <Text style={{ fontSize: 12 }}>Maria Rodriguez</Text>
                              </div>
                              <ChevronRight size={12} color={token.colorTextTertiary} />
                            </div>
                          </div>

                          {/* Image Editor */}
                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: token.colorBgContainer,
                              border: `1px solid ${token.colorBorder}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = token.colorBgTextHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = token.colorBgContainer;
                            }}
                            onClick={() => onPersonClick?.('dl-001')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar size={24} style={{ background: '#9C27B0', fontSize: 11 }}>
                                DL
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, color: token.colorTextTertiary }}>
                                  Image Editor
                                </div>
                                <Text style={{ fontSize: 12 }}>David Lee</Text>
                              </div>
                              <ChevronRight size={12} color={token.colorTextTertiary} />
                            </div>
                          </div>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Space>
            </div>
          ),
        },
        {
          key: 'notes',
          label: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              paddingRight: 16,
            }}>
              <Text strong style={{ fontSize: 16 }}>Notes</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge 
                  count={3} 
                  style={{ 
                    backgroundColor: token.colorBgTextHover,
                    color: token.colorText,
                    fontWeight: 500,
                    fontSize: 12,
                  }} 
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Plus size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info('Add note clicked');
                  }}
                />
              </div>
            </div>
          ),
          children: !isNewDeal ? (
            <div style={{ padding: '0 0 16px 0' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Avatar
                      size="small"
                      src={generateAvatar("Claudia", { type: "avataaars" })}
                    />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 12 }}>Claudia Maggio</Text>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        5h ago
                      </Text>
                      <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        Please add more photos from exterior
                      </Paragraph>
                    </div>
                  </div>
                </Card>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Avatar
                      size="small"
                      src={generateAvatar("Jan", { type: "avataaars" })}
                    />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 12 }}>Jan Stromek</Text>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        May 23
                      </Text>
                      <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        Please add more photos from exterior
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </Space>
            </div>
          ) : (
            <div style={{ padding: '0 0 16px 0', textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>No notes yet</Text>
            </div>
          ),
        },
  );

  // Build Files tab items (Attachments, Contract Agreements)
  const filesItems = [];
  filesItems.push(
        {
          key: 'attachments',
          label: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              paddingRight: 16,
            }}>
              <Text strong style={{ fontSize: 16 }}>Attachments</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge 
                  count={33} 
                  style={{ 
                    backgroundColor: token.colorBgTextHover,
                    color: token.colorText,
                    fontWeight: 500,
                    fontSize: 12,
                  }} 
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Plus size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info('Add attachment clicked');
                  }}
                />
              </div>
            </div>
          ),
          children: (
            <div style={{ padding: '0 0 16px 0' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Paperclip size={16} style={{ color: token.colorTextSecondary }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13 }}>merchant-contract.pdf</Text>
                      <div style={{ fontSize: 11, color: token.colorTextTertiary }}>
                        2.3 MB
                      </div>
                    </div>
                  </div>
                </Card>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Paperclip size={16} style={{ color: token.colorTextSecondary }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13 }}>deal-images.zip</Text>
                      <div style={{ fontSize: 11, color: token.colorTextTertiary }}>
                        15.8 MB
                      </div>
                    </div>
                  </div>
                </Card>
              </Space>
            </div>
          ),
        },
        {
          key: 'contract',
          label: <Text strong style={{ fontSize: 16 }}>Contract Agreements</Text>,
          children: (
            <div style={{ padding: '0 0 16px 0' }}>
              <Card size="small" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={16} style={{ color: token.colorTextSecondary }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13 }}>Master Agreement 2024</Text>
                    <div style={{ fontSize: 11, color: token.colorTextTertiary }}>
                      Signed on Jan 15, 2024
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ),
        },
  );

  // Build History tab items (Changes, Activity Log)
  const historyItems = [
    {
      key: 'changes',
      label: <Text strong style={{ fontSize: 16 }}>Changes</Text>,
      children: (
        <div style={{ padding: '0 0 16px 0', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>No changes</Text>
        </div>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'discovery' && (
          <>
            {/* Merchant Info Section - shown when merchant account is available */}
            {discoveryItems.length > 0 && (
              <Collapse
                defaultActiveKey={['merchant-info']}
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
                items={discoveryItems}
              />
            )}

            {/* Similar Deals Map - shown when deal and merchant account are available */}
            {deal && selectedMerchantAccount && (
              <SimilarDealsMap
                currentDeal={{
                  id: deal.id,
                  category: deal.category,
                  subcategory: deal.subcategory,
                  accountId: deal.accountId,
                  title: deal.title,
                }}
                allDeals={generatedMockDeals}
                defaultRadius={10}
              />
            )}

            {/* Nearby Competitors - shown below the map */}
            {selectedMerchantAccount && selectedMerchantAccount.nearbyCompetitors && selectedMerchantAccount.nearbyCompetitors.length > 0 && (
              <Collapse
                defaultActiveKey={['nearby-competitors']}
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
                    key: 'nearby-competitors',
                    label: <Text strong style={{ fontSize: 16 }}>Nearby Competitors</Text>,
                    children: (
                      <div style={{ padding: '0 0 20px 0' }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {selectedMerchantAccount.nearbyCompetitors.slice(0, 5).map((comp, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: token.colorFillQuaternary,
                              borderRadius: token.borderRadius,
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 12, fontWeight: 500, display: 'block' }}>
                                  {comp.name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {comp.distance} • {comp.type}
                                </Text>
                              </div>
                              <Tag color={comp.rating >= 4.0 ? 'green' : 'orange'} style={{ margin: 0 }}>
                                {comp.rating}★
                              </Tag>
                            </div>
                          ))}
                        </Space>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </>
        )}

        {activeTab === 'work' && (
          <Collapse
            defaultActiveKey={['tasks', 'roles', 'notes']}
            ghost
            expandIconPosition="start"
            bordered={false}
            style={{ 
              background: 'transparent',
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
            items={workItems}
          />
        )}

        {activeTab === 'files' && (
          <Collapse
            defaultActiveKey={['attachments', 'contract']}
            ghost
            expandIconPosition="start"
            bordered={false}
            style={{ 
              background: 'transparent',
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
            items={filesItems}
          />
        )}

        {activeTab === 'history' && (
          <Collapse
            defaultActiveKey={['changes']}
            ghost
            expandIconPosition="start"
            bordered={false}
            style={{ 
              background: 'transparent',
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
            items={historyItems}
          />
        )}
      </div>
    </div>
  );
};

// Export tabs component for use in RightSidebar title
export const DefaultSidebarTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <Segmented
      value={activeTab}
      onChange={onTabChange}
      options={[
        {
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Compass size={16} />
              <span>Research</span>
            </div>
          ),
          value: 'discovery',
        },
        {
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={16} />
              <span>Work</span>
            </div>
          ),
          value: 'work',
        },
        {
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} />
              <span>Files</span>
            </div>
          ),
          value: 'files',
        },
        {
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} />
              <span>History</span>
            </div>
          ),
          value: 'history',
        },
      ]}
      style={{
        background: 'transparent',
      }}
    />
  );
};

export default DefaultSidebarContent;

