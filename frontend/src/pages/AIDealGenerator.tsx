import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { theme, Spin } from "antd";
import AIGenerationFlow from "../components/AIGenerationFlow";
import DynamicBreadcrumbs from "../components/Breadcrumbs";
import { getMerchantAccount } from "../data/accountOwnerAssignments";
import { MerchantAccount } from "../data/merchantAccounts";
import { fetchMerchantAccountById } from "../lib/supabaseData";

const { useToken } = theme;

const AIDealGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useToken();
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [preSelectedAccount, setPreSelectedAccount] = useState<MerchantAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  const accountId = searchParams.get("accountId");

  useEffect(() => {
    // If no account ID, redirect back to deals
    if (!accountId) {
      navigate("/deals");
      return;
    }

    // Fetch the account from Supabase
    const loadAccount = async () => {
      setIsLoadingAccount(true);
      
      try {
        // First try to get from local cache (for the first 5000 accounts)
        let account = getMerchantAccount(accountId);
        
        // If not in cache, fetch directly from Supabase (for accounts beyond first 5000)
        if (!account) {
          console.log(`[AIDealGenerator] Account ${accountId} not in cache, fetching from Supabase...`);
          const supabaseAccount = await fetchMerchantAccountById(accountId);
          
          if (supabaseAccount) {
            // Convert Supabase format to MerchantAccount format
            account = {
              id: supabaseAccount.id,
              name: supabaseAccount.name,
              permalink: supabaseAccount.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              businessType: supabaseAccount.business_type || 'Unknown',
              location: supabaseAccount.location || '',
              contactName: '',
              contactEmail: '',
              phone: '',
              description: '',
              status: supabaseAccount.status as any || 'active',
              dealsCount: supabaseAccount.deals_count || 0,
              createdDate: supabaseAccount.created_at || new Date().toISOString(),
              potential: supabaseAccount.potential as any || 'mid',
              potentialAnalysis: {
                overall: supabaseAccount.potential as any || 'mid',
                score: 50,
                factors: {
                  marketDemand: { score: 50, notes: 'No data' },
                  historicalPerformance: { score: 50, notes: 'No data' },
                  competitivePosition: { score: 50, notes: 'No data' },
                  growthTrend: { score: 50, notes: 'No data' },
                  customerSatisfaction: { score: 50, notes: 'No data' },
                },
                recommendations: [],
                insights: 'No analysis available',
              },
              accountOwner: supabaseAccount.owner_name ? {
                id: supabaseAccount.account_owner_id || '',
                name: supabaseAccount.owner_name,
                email: supabaseAccount.owner_email || '',
                role: supabaseAccount.owner_role || '',
                avatar: supabaseAccount.owner_avatar,
              } : undefined,
            };
          }
        }
        
        setPreSelectedAccount(account);
      } catch (error) {
        console.error('[AIDealGenerator] Error loading account:', error);
        setPreSelectedAccount(null);
      } finally {
        setIsLoadingAccount(false);
      }
    };

    loadAccount();
  }, [accountId, navigate]);

  // Show loading spinner while account is being loaded
  if (isLoadingAccount && accountId) {
    return (
      <>
        {/* Breadcrumb Header - Fixed, Full Width */}
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            zIndex: 99,
            background: token.colorBgContainer,
            padding: `${token.paddingXXS}px ${token.paddingLG}px`,
            display: "flex",
            alignItems: "center",
            gap: token.marginSM,
            flexWrap: "wrap",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          }}
        >
          <DynamicBreadcrumbs />
        </div>

        {/* Loading State */}
        <div
          style={{
            minHeight: "calc(100vh - 102px)",
            marginTop: 38,
            padding: 24,
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin size="large" tip="Loading merchant account..." />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb Header - Fixed, Full Width */}
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          zIndex: 99,
          background: token.colorBgContainer,
          padding: `${token.paddingXXS}px ${token.paddingLG}px`,
          display: "flex",
          alignItems: "center",
          gap: token.marginSM,
          flexWrap: "wrap",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <DynamicBreadcrumbs />
      </div>

      {/* Main Content */}
      <div
        style={{
          minHeight: "calc(100vh - 102px)",
          marginTop: 38,
          padding: 24,
          paddingRight: sidebarWidth > 0 ? 0 : 24,
          background: '#fafafa',
          transition: "padding-right 0.3s ease",
        }}
      >
        <AIGenerationFlow
          preSelectedAccount={preSelectedAccount}
          onCancel={() => navigate("/deals")}
          onSidebarWidthChange={setSidebarWidth}
        />
      </div>
    </>
  );
};

export default AIDealGenerator;
