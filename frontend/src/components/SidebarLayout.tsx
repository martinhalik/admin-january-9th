import { ReactNode, useState, useEffect } from "react";
import { theme } from "antd";

const { useToken } = theme;

interface SidebarLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  sidebarWidth?: number;
  minScreenWidth?: number;
}

/**
 * Universal layout component that shrinks content when a sidebar is open.
 * Works like Google Workspace and Asana - pushes content to the left smoothly.
 *
 * Usage:
 * <SidebarLayout sidebarOpen={isSettingsOpen} sidebarWidth={420}>
 *   <YourMainContent />
 * </SidebarLayout>
 */
const SidebarLayout = ({
  children,
  sidebarOpen,
  sidebarWidth = 420,
  minScreenWidth = 1200,
}: SidebarLayoutProps) => {
  const { token } = useToken();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldShrink = sidebarOpen && windowWidth >= minScreenWidth;

  return (
    <div
      style={{
        transition: `margin-right ${token.motionDurationMid} ${token.motionEaseInOut}`,
        marginRight: shouldShrink ? sidebarWidth : 0,
      }}
    >
      {children}
    </div>
  );
};

export default SidebarLayout;
