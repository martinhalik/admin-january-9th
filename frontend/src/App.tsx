import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider, theme, App as AntApp } from "antd";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import DealDetail from "./pages/DealDetail";
import DevTools from "./pages/DevTools";
import NewDeal from "./pages/NewDeal";
import Tasks from "./pages/Tasks";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import AIDealGenerator from "./pages/AIDealGenerator";
import RedemptionTemplates from "./pages/RedemptionTemplates";
import TaxonomyAdmin from "./pages/TaxonomyAdmin";
import SalesforceStageMapping from "./pages/SalesforceStageMapping";
import CampaignStageManagement from "./pages/CampaignStageManagement";
import OrganizationHierarchy from "./pages/OrganizationHierarchy";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { RecentlyViewedProvider } from "./contexts/RecentlyViewedContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { AuthProvider } from "./contexts/AuthContext";
import DataLoader from "./components/DataLoader";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // Detect system preference on initial load
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme as "light" | "dark";
    }
    // Default to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme() === "dark");

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#007C1F",
          borderRadius: 6,
          borderRadiusXS: 2,
          // Override success text colors for better readability (using green-7 shade)
          colorSuccessText: "#237804",        // Darker green for text (green-7)
          colorSuccessTextHover: "#135200",   // Even darker for hover (green-8)
          colorSuccessTextActive: "#092b00",  // Darkest for active (green-9)
          // Override warning text colors for better readability (using orange-7 shade)
          colorWarningText: "#AD4E00",        // Darker orange for text (orange-7)
          colorWarningTextHover: "#873800",   // Even darker for hover (orange-8)
          colorWarningTextActive: "#612500",  // Darkest for active (orange-9)
        },
        components: {
          Tag: {
            borderRadiusXS: 2,
          },
        },
      }}
    >
      <AntApp>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public route - Login page */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes - require authentication */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <UserPreferencesProvider>
                      <RoleViewProvider>
                        <FavoritesProvider>
                          <NavigationProvider>
                            <RecentlyViewedProvider>
                              <DataLoader>
                                <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
                                  <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/deals" element={<Deals />} />
                                    <Route path="/deals/new" element={<NewDeal />} />
                                    <Route path="/deals/:id" element={<DealDetail />} />
                                    <Route path="/deals/:id/:view" element={<DealDetail />} />
                                    <Route path="/dev-tools" element={<DevTools />} />
                                    <Route
                                      path="/deals/ai-generator"
                                      element={<AIDealGenerator />}
                                    />
                                    <Route path="/tasks" element={<Tasks />} />
                                    <Route path="/accounts" element={<Accounts />} />
                                    <Route path="/accounts/:id" element={<AccountDetail />} />
                                    <Route
                                      path="/accounts/:accountId/deals/:dealId"
                                      element={<DealDetail />}
                                    />
                                    <Route
                                      path="/accounts/:accountId/deals/:dealId/:view"
                                      element={<DealDetail />}
                                    />
                                    <Route path="/templates" element={<RedemptionTemplates />} />
                                    <Route path="/admin/taxonomy" element={<TaxonomyAdmin />} />
                                    <Route path="/admin/salesforce-mapping" element={<SalesforceStageMapping />} />
                                    <Route path="/admin/campaign-stages" element={<CampaignStageManagement />} />
                                    <Route path="/admin/organization" element={<OrganizationHierarchy />} />
                                  </Routes>
                                </Layout>
                              </DataLoader>
                            </RecentlyViewedProvider>
                          </NavigationProvider>
                        </FavoritesProvider>
                      </RoleViewProvider>
                    </UserPreferencesProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
