import { ReactNode } from "react";
import { Drawer, theme } from "antd";
import { X } from "lucide-react";

const { useToken } = theme;

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
}

const SettingsSidebar = ({
  open,
  onClose,
  title,
  children,
  width = 420,
}: SettingsSidebarProps) => {
  const { token } = useToken();

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={onClose}
      open={open}
      width={width}
      closeIcon={<X size={18} />}
      mask={false}
      styles={{
        body: { paddingTop: token.padding },
        wrapper: {
          boxShadow: token.boxShadow,
        },
      }}
      style={{
        position: "absolute",
      }}
    >
      {children}
    </Drawer>
  );
};

export default SettingsSidebar;
