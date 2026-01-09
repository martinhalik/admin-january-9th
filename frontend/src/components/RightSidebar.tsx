import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Typography, theme } from 'antd';
import { ChevronLeft, X, PanelRightClose, PanelRightOpen, LucideIcon } from 'lucide-react';

const { Text } = Typography;
const { useToken } = theme;

// Constants for sidebar behavior
const SIDEBAR_CONSTANTS = {
  COLLAPSED_WIDTH: 48,
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
  TOGGLE_BUTTON_PADDING: 4,
} as const;

export interface TabShortcut {
  icon: LucideIcon;
  label: string;
  value: string;
  active: boolean;
}

interface RightSidebarProps {
  open: boolean;
  title: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  children: ReactNode;
  width?: number | string;
  topOffset?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsed?: boolean; // Controlled collapsed state
  onCollapsedChange?: (collapsed: boolean) => void; // Callback when collapsed state changes
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  onWidthChange?: (width: number) => void;
  onResizingChange?: (isResizing: boolean) => void;
  zIndex?: number; // For stacking multiple sidebars
  rightOffset?: number; // Push sidebar left by this amount (for side-by-side sidebars)
  showHeader?: boolean; // Hide header completely
  noBorder?: boolean; // Remove left border
  collapsedIcon?: LucideIcon; // Icon to show when collapsed
  collapsedLabel?: string; // Label to show when collapsed
  collapsedTabs?: TabShortcut[]; // Tab shortcuts to show when collapsed
  onCollapsedTabChange?: (tabValue: string) => void; // Callback when tab is clicked in collapsed state
}

/**
 * Universal right sidebar component used across the application.
 * Appears below headers and stays fixed on the right side of the screen.
 * 
 * Usage:
 * <RightSidebar
 *   open={sidebarOpen}
 *   title="Edit Template"
 *   showBackButton={true}
 *   onBack={() => setSidebarOpen(false)}
 *   onClose={() => setSidebarOpen(false)}
 *   collapsible={true}
 *   resizable={true}
 * >
 *   <YourSidebarContent />
 * </RightSidebar>
 */
const RightSidebar = ({
  open,
  title,
  showBackButton = false,
  onBack,
  onClose,
  children,
  width = 600,
  topOffset = 164, // Default offset below headers (64px nav + 47px breadcrumb + 53px tabs)
  collapsible = false,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  resizable = false,
  minWidth = 300,
  maxWidth = 800,
  storageKey,
  onWidthChange,
  onResizingChange,
  zIndex = SIDEBAR_CONSTANTS.Z_INDEX_HEADER,
  rightOffset = 0,
  showHeader = true,
  noBorder = false,
  collapsedIcon,
  collapsedLabel,
  collapsedTabs,
  onCollapsedTabChange,
}: RightSidebarProps) => {
  const { token } = useToken();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  
  // Use controlled collapsed state if provided, otherwise use internal state
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const setCollapsed = (value: boolean) => {
    if (controlledCollapsed !== undefined) {
      // Controlled mode - call the callback
      onCollapsedChange?.(value);
    } else {
      // Uncontrolled mode - update internal state
      setInternalCollapsed(value);
    }
  };
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [customWidth, setCustomWidth] = useState<number>(() => {
    // Load saved width from localStorage if storageKey is provided
    if (storageKey) {
      const saved = localStorage.getItem(`sidebar-width-${storageKey}`);
      return saved ? parseInt(saved, 10) : (typeof width === 'number' ? width : 600);
    }
    return typeof width === 'number' ? width : 600;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set default collapsed state based on screen size (only in uncontrolled mode)
  useEffect(() => {
    // Skip if controlled mode (parent controls collapsed state)
    if (controlledCollapsed !== undefined) return;
    
    // Tablet and smaller: collapsed by default
    // Desktop: expanded by default
    const shouldBeCollapsed = windowWidth < SIDEBAR_CONSTANTS.TABLET_BREAKPOINT;
    setCollapsed(shouldBeCollapsed);
  }, [windowWidth, controlledCollapsed]);

  // Notify parent of width changes
  useEffect(() => {
    const actualWidth = collapsed ? SIDEBAR_CONSTANTS.COLLAPSED_WIDTH : customWidth;
    onWidthChange?.(actualWidth);
  }, [collapsed, customWidth, onWidthChange]);

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
      onWidthChange?.(newWidth);
    },
    [isResizing, minWidth, maxWidth, onWidthChange]
  );

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onResizingChange?.(false);
      // Save to localStorage if storageKey is provided
      if (storageKey) {
        localStorage.setItem(`sidebar-width-${storageKey}`, customWidth.toString());
      }
    }
  }, [isResizing, customWidth, storageKey, onResizingChange]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
    onResizingChange?.(true);
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

  if (!open) return null;

  const actualWidth = collapsed ? SIDEBAR_CONSTANTS.COLLAPSED_WIDTH : (typeof width === 'string' ? width : customWidth);

  return (
    <div
      style={{
        width: actualWidth,
        flexShrink: 0,
        position: 'fixed',
        right: rightOffset,
        top: topOffset,
        height: `calc(100vh - ${topOffset}px)`,
        zIndex: zIndex,
        transition: isResizing ? 'none' : `all ${SIDEBAR_CONSTANTS.TRANSITION_DURATION} ease`,
      }}
    >
      {/* Resize Handle */}
      {resizable && !collapsed && (
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
          {/* Visual indicator line */}
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
          background: 'unset',
          backgroundImage: 'none',
          borderLeft: noBorder ? 'none' : `1px solid ${token.colorBorder}`,
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
            background: 'unset',
            backgroundImage: 'none',
            borderBottom: 'none',
            marginBottom: 0,
            padding: collapsed 
              ? `0px 0px` 
              : `0px 0px`,
            transition: `padding ${SIDEBAR_CONSTANTS.TRANSITION_DURATION} ease`,
            display: showHeader ? 'block' : 'none',
            height: 'fit-content',
          },
          body: {
            flex: 1,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: collapsed ? 0 : 1,
            transition: `opacity ${SIDEBAR_CONSTANTS.FADE_DURATION} ease`,
          },
        }}
        title={
          collapsed ? (
            // Collapsed state - show expand button at top, then tabs
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              width: '100%',
              gap: 0,
            }}>
              {/* Expand button at the top */}
              {collapsible && (
                <Button
                  type="text"
                  size="small"
                  icon={<PanelRightOpen size={SIDEBAR_CONSTANTS.ICON_SIZE_LARGE} />}
                  onClick={() => setCollapsed(false)}
                  style={{ 
                    minWidth: 32,
                    minHeight: 32,
                    width: 32,
                    height: 32,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: token.marginXS,
                  }}
                />
              )}
              
              {/* Full-width separator */}
              <div style={{
                width: SIDEBAR_CONSTANTS.COLLAPSED_WIDTH,
                height: 1,
                background: token.colorBorder,
                marginBottom: token.marginSM,
              }} />
              
              {collapsedTabs && collapsedTabs.length > 0 ? (
                // Show all tab shortcuts
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                }}>
                  {collapsedTabs.map((tab) => (
                    <div
                      key={tab.value}
                      onClick={() => {
                        onCollapsedTabChange?.(tab.value);
                        setCollapsed(false); // Expand when clicking a tab
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        minHeight: 32,
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        background: 'transparent',
                        transition: 'all 0.2s',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = token.colorBgTextHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {React.createElement(tab.icon, { 
                        size: 18, 
                        style: { color: token.colorTextSecondary } 
                      })}
                      <Text 
                        style={{ 
                          fontSize: 10,
                          fontWeight: 500,
                          color: token.colorTextSecondary,
                          textAlign: 'center',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          width: '100%',
                        }}
                      >
                        {tab.label}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : collapsedIcon ? (
                // Show single icon/label (fallback for non-tab sidebars)
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {React.createElement(collapsedIcon, { 
                    size: 20, 
                    style: { color: token.colorPrimary } 
                  })}
                  {collapsedLabel && (
                    <Text 
                      style={{ 
                        fontSize: 10,
                        fontWeight: 600,
                        color: token.colorTextSecondary,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        transform: 'rotate(0deg)',
                      }}
                    >
                      {collapsedLabel}
                    </Text>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            // Expanded state - show full header
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
              <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
                {collapsible && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PanelRightClose size={SIDEBAR_CONSTANTS.ICON_SIZE_LARGE} />}
                    onClick={() => setCollapsed(true)}
                    style={{ marginLeft: token.marginXS }}
                  />
                )}
                {!showBackButton && onClose && (
                  <Button
                    type="text"
                    size="small"
                    icon={<X size={SIDEBAR_CONSTANTS.ICON_SIZE_LARGE} />}
                    onClick={onClose}
                    style={{ marginLeft: token.marginXS }}
                  />
                )}
              </div>
            </div>
          )
        }
      >
        {!collapsed && children}
      </Card>
    </div>
  );
};

export default RightSidebar;

