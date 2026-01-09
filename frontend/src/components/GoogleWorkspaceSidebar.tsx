import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Typography, theme, Tooltip } from 'antd';
import { ChevronLeft, PanelRightClose, PanelRightOpen, LucideIcon, X } from 'lucide-react';

const { Text } = Typography;
const { useToken } = theme;

// Constants for sidebar behavior
export const SIDEBAR_CONSTANTS = {
  TAB_BAR_WIDTH: 56,
  TABLET_BREAKPOINT: 1024,
  RESIZE_HANDLE_WIDTH: 8,
  RESIZE_INDICATOR_WIDTH: 2,
  RESIZE_HANDLE_OPACITY: 0.5,
  TRANSITION_DURATION: '0.3s',
  FADE_DURATION: '0.2s',
  Z_INDEX_HANDLE: 11,
  Z_INDEX_HEADER: 10,
  ICON_SIZE_LARGE: 18,
  ICON_SIZE_MEDIUM: 16,
  TITLE_FONT_SIZE: 20,
} as const;

export interface TabConfig {
  icon: LucideIcon;
  label: string;
  value: string;
  tooltip?: string;
}

interface GoogleWorkspaceSidebarProps {
  tabs: TabConfig[];
  activeTab: string | null; // null = closed
  onTabChange: (tab: string | null) => void;
  children: ReactNode;
  title?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  width?: number;
  topOffset?: number;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  onWidthChange?: (width: number) => void;
  onResizingChange?: (resizing: boolean) => void;
  zIndex?: number;
  showHeader?: boolean;
  extraIcon?: {
    icon: LucideIcon;
    label: string;
    tooltip?: string;
    onClick?: () => void;
    onClose?: () => void; // Callback to close/remove the shortcut
    active?: boolean; // Whether this icon should show the active indicator
  };
}

/**
 * Google Workspace-style sidebar with vertical tab bar
 * Features a persistent tab bar (56px) with expandable content panel
 */
const GoogleWorkspaceSidebar: React.FC<GoogleWorkspaceSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  title,
  showBackButton = false,
  onBack,
  width = 420,
  topOffset = 102,
  resizable = false,
  minWidth = 320,
  maxWidth = 700,
  storageKey,
  onWidthChange,
  onResizingChange,
  zIndex = 10,
  showHeader = true,
  extraIcon,
}) => {
  const { token } = useToken();
  const [customWidth, setCustomWidth] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`sidebar-width-${storageKey}`);
      return saved ? parseInt(saved, 10) : width;
    }
    return width;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExtraHovered, setIsExtraHovered] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Notify parent of width changes
  useEffect(() => {
    const totalWidth = activeTab ? customWidth + SIDEBAR_CONSTANTS.TAB_BAR_WIDTH : SIDEBAR_CONSTANTS.TAB_BAR_WIDTH;
    onWidthChange?.(totalWidth);
  }, [activeTab, customWidth, onWidthChange]);

  // Notify parent of resizing state changes
  useEffect(() => {
    onResizingChange?.(isResizing);
  }, [isResizing, onResizingChange]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, resizeStartWidth.current + deltaX)
      );
      setCustomWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth]
  );

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      if (storageKey) {
        localStorage.setItem(`sidebar-width-${storageKey}`, customWidth.toString());
      }
      onWidthChange?.(customWidth + SIDEBAR_CONSTANTS.TAB_BAR_WIDTH);
    }
  }, [isResizing, customWidth, storageKey, onWidthChange]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable || !activeTab) return;
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = customWidth;
  };

  // Add/remove mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const totalWidth = activeTab ? customWidth + SIDEBAR_CONSTANTS.TAB_BAR_WIDTH : SIDEBAR_CONSTANTS.TAB_BAR_WIDTH;

  return (
    <div
      style={{
        width: totalWidth,
        flexShrink: 0,
        position: 'fixed',
        right: 0,
        top: topOffset,
        height: `calc(100vh - ${topOffset}px)`,
        zIndex: zIndex,
        transition: isResizing ? 'none' : `width ${SIDEBAR_CONSTANTS.TRANSITION_DURATION} ease`,
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Content Panel - Only visible when activeTab is set */}
      {activeTab && (
        <div
          style={{
            width: customWidth,
            position: 'relative',
            transition: isResizing ? 'none' : `width ${SIDEBAR_CONSTANTS.TRANSITION_DURATION} ease`,
          }}
        >
          {/* Resize Handle */}
          {resizable && (
            <div
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setIsDraggingOver(true)}
              onMouseLeave={() => setIsDraggingOver(false)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: SIDEBAR_CONSTANTS.RESIZE_HANDLE_WIDTH,
                cursor: 'col-resize',
                zIndex: SIDEBAR_CONSTANTS.Z_INDEX_HANDLE,
                background: isDraggingOver || isResizing ? token.colorPrimary : 'transparent',
                transition: `background ${SIDEBAR_CONSTANTS.FADE_DURATION} ease`,
                opacity: isDraggingOver || isResizing ? SIDEBAR_CONSTANTS.RESIZE_HANDLE_OPACITY : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: SIDEBAR_CONSTANTS.RESIZE_INDICATOR_WIDTH,
                  height: '100%',
                  background: token.colorPrimary,
                  opacity: isDraggingOver || isResizing ? 1 : 0,
                  transition: `opacity ${SIDEBAR_CONSTANTS.FADE_DURATION} ease`,
                }}
              />
            </div>
          )}

          <Card
            style={{
              background: token.colorBgContainer,
              borderLeft: `1px solid ${token.colorBorder}`,
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              borderRadius: 0,
            }}
            styles={{
              header: {
                position: 'sticky',
                top: 0,
                zIndex: SIDEBAR_CONSTANTS.Z_INDEX_HEADER,
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorder}`,
                marginBottom: 0,
                padding: `${token.padding}px ${token.paddingLG}px`,
                display: showHeader ? 'block' : 'none',
              },
              body: {
                flex: 1,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
            title={
              showHeader ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS, flex: 1, minWidth: 0 }}>
                    {showBackButton && onBack && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ChevronLeft size={SIDEBAR_CONSTANTS.ICON_SIZE_MEDIUM} />}
                        onClick={onBack}
                      />
                    )}
                    {typeof title === 'string' ? (
                      <Text strong style={{ 
                        fontSize: showBackButton ? token.fontSize : SIDEBAR_CONSTANTS.TITLE_FONT_SIZE, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {title}
                      </Text>
                    ) : (
                      title
                    )}
                  </div>
                </div>
              ) : undefined
            }
          >
            {children}
          </Card>
        </div>
      )}

      {/* Tab Bar - Always visible on the right */}
      <div
        style={{
          width: SIDEBAR_CONSTANTS.TAB_BAR_WIDTH,
          background: token.colorBgContainer,
          borderLeft: `1px solid ${token.colorBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: token.paddingSM,
          paddingLeft: 4,
          paddingRight: 4,
          gap: 4,
        }}
      >
        {/* Collapse/Expand button - always visible */}
        <Tooltip title={activeTab ? "Close sidebar" : "Open sidebar"} placement="left">
          <div
            onClick={() => {
              if (activeTab) {
                onTabChange(null);
              } else {
                // Open the first tab by default
                onTabChange(tabs[0]?.value || null);
              }
            }}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 6,
              background: 'transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = token.colorBgTextHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {activeTab ? (
              <PanelRightClose 
                size={SIDEBAR_CONSTANTS.ICON_SIZE_LARGE} 
                style={{ 
                  color: token.colorText,
                  strokeWidth: 2
                }} 
              />
            ) : (
              <PanelRightOpen 
                size={SIDEBAR_CONSTANTS.ICON_SIZE_LARGE} 
                style={{ 
                  color: token.colorText,
                  strokeWidth: 2
                }} 
              />
            )}
          </div>
        </Tooltip>
        
        {/* Separator */}
        <div
          style={{
            width: '80%',
            height: 1,
            background: token.colorBorder,
            margin: '4px 0',
          }}
        />
        
        {tabs.map((tab) => {
          const [isHovered, setIsHovered] = React.useState(false);
          const isActive = activeTab === tab.value;
          // Show indicator only if this tab is active AND extraIcon is not active
          const showIndicator = isActive && !extraIcon?.active;
          
          return (
            <Tooltip key={tab.value} title={tab.tooltip || tab.label} placement="left">
              <div
                onClick={() => {
                  // Toggle: if already active, close it; otherwise open it
                  onTabChange(isActive ? null : tab.value);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  background: !isActive && isHovered ? token.colorBgTextHover : 'transparent',
                  transition: 'all 0.2s',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {/* Connected left border indicator - touches the tab bar border */}
                {showIndicator && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -5,
                      top: 0,
                      width: 3,
                      height: 'calc(100% - 4px)',
                      background: token.colorPrimary,
                      borderRadius: '0 2px 2px 0',
                      transition: 'all 0.2s',
                    }}
                  />
                )}
                {React.createElement(tab.icon, { 
                  size: SIDEBAR_CONSTANTS.ICON_SIZE_LARGE,
                  style: { 
                    color: isActive ? token.colorText : token.colorTextSecondary,
                    transition: 'color 0.2s'
                  }
                })}
                <Text 
                  style={{ 
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? token.colorText : token.colorTextSecondary,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    transition: 'color 0.2s',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tab.label}
                </Text>
              </div>
          </Tooltip>
        );
        })}
        
        {/* Extra icon section - shown when specific views are active */}
        {extraIcon && (
          <>
            {/* Separator */}
            <div
              style={{
                width: '80%',
                height: 1,
                background: token.colorBorder,
                margin: '8px 0 4px 0',
              }}
            />
            
            <Tooltip title={extraIcon.tooltip || extraIcon.label} placement="left">
              <div
                onMouseEnter={() => setIsExtraHovered(true)}
                onMouseLeave={() => setIsExtraHovered(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '8px 4px',
                  cursor: extraIcon.onClick ? 'pointer' : 'default',
                  borderRadius: 6,
                  background: !extraIcon.active && isExtraHovered ? token.colorBgTextHover : 'transparent',
                  transition: 'all 0.2s',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {/* Active indicator for extra icon */}
                {extraIcon.active && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -5,
                      top: 0,
                      width: 3,
                      height: 'calc(100% - 4px)',
                      background: token.colorPrimary,
                      borderRadius: '0 2px 2px 0',
                      transition: 'all 0.2s',
                    }}
                  />
                )}
                
                {/* Close button - only show when not active and has onClose */}
                {!extraIcon.active && extraIcon.onClose && isExtraHovered && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      extraIcon.onClose?.();
                    }}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 1,
                    }}
                  >
                    <X 
                      size={10} 
                      style={{ 
                        color: token.colorTextSecondary,
                        strokeWidth: 3
                      }} 
                    />
                  </div>
                )}
                
                <div
                  onClick={extraIcon.onClick}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                  }}
                >
                  {React.createElement(extraIcon.icon, { 
                    size: SIDEBAR_CONSTANTS.ICON_SIZE_LARGE,
                    style: { 
                      color: token.colorPrimary,
                      transition: 'color 0.2s'
                    }
                  })}
                  <Text 
                    style={{ 
                      fontSize: 11,
                      fontWeight: 600,
                      color: token.colorPrimary,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      transition: 'color 0.2s',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {extraIcon.label}
                  </Text>
                </div>
              </div>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleWorkspaceSidebar;
