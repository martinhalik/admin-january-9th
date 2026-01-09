import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getAllEmployees, getEmployeesByRole } from "../data/companyHierarchy";

export type UserRole =
  | "admin"
  | "bd"
  | "dsm"
  | "mm"
  | "md"
  | "executive"
  | "content-ops-staff"
  | "content-ops-manager";

export interface RoleInfo {
  id: UserRole;
  name: string;
  category: string;
}

export const AVAILABLE_ROLES: RoleInfo[] = [
  { id: "admin", name: "Admin", category: "Admin" },
  { id: "bd", name: "Business Development Representative (BD)", category: "Sales" },
  { id: "md", name: "Merchant Development Representative (MD)", category: "Sales" },
  { id: "dsm", name: "Divisional Sales Manager (DSM)", category: "Sales" },
  { id: "mm", name: "Market Manager (MM)", category: "Sales" },
  { id: "executive", name: "Executive", category: "Leadership" },
  { id: "content-ops-staff", name: "Content Operation Staff", category: "Content" },
  { id: "content-ops-manager", name: "Content Operation Manager", category: "Content" },
];

export interface SimulatedUser {
  employeeId: string;
  name: string;
  role: UserRole;
}

interface RoleViewContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  getRoleInfo: (roleId: UserRole) => RoleInfo | undefined;
  isAdmin: boolean;
  currentUser: SimulatedUser;
  setCurrentUser: (user: SimulatedUser) => void;
}

const RoleViewContext = createContext<RoleViewContextType | undefined>(undefined);

const STORAGE_KEY = "role-view-prototype";
const USER_STORAGE_KEY = "current-user-prototype";

// Default simulated user - Admin view
const DEFAULT_USER: SimulatedUser = {
  employeeId: 'emp-ceo-1',
  name: 'Robert Mitchell',
  role: 'admin',
};

export const RoleViewProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as UserRole) || "admin";
  });

  const [currentUser, setCurrentUserState] = useState<SimulatedUser>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    // Persist to localStorage whenever role changes
    localStorage.setItem(STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    // Persist to localStorage whenever user changes
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    
    // Find a realistic employee for this role from the hierarchy
    const employees = getAllEmployees();
    
    // If no employees loaded yet, just update role and keep default user
    if (employees.length === 0) {
      setCurrentUserState(prev => ({ ...prev, role }));
      return;
    }
    
    const employeesWithRole = employees.filter(emp => 
      emp.role === role && 
      emp.status === 'active' &&
      emp.id !== 'sf-0053c00000Bx01UAAR' // Skip ad-inventory services
    );
    
    if (employeesWithRole.length > 0) {
      // Pick the first employee with this role
      const selectedEmployee = employeesWithRole[0];
      setCurrentUserState({
        employeeId: selectedEmployee.id,
        name: selectedEmployee.name,
        role: role,
      });
    } else {
      // Fallback: just update the role
      setCurrentUserState(prev => ({ ...prev, role }));
    }
  };

  const setCurrentUser = (user: SimulatedUser) => {
    setCurrentUserState(user);
    setCurrentRole(user.role);
  };

  const getRoleInfo = (roleId: UserRole) => {
    return AVAILABLE_ROLES.find((role) => role.id === roleId);
  };

  const isAdmin = currentRole === "admin";

  return (
    <RoleViewContext.Provider
      value={{ currentRole, setRole, getRoleInfo, isAdmin, currentUser, setCurrentUser }}
    >
      {children}
    </RoleViewContext.Provider>
  );
};

export const useRoleView = () => {
  const context = useContext(RoleViewContext);
  if (context === undefined) {
    throw new Error("useRoleView must be used within a RoleViewProvider");
  }
  return context;
};



