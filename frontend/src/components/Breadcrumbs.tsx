import React from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Breadcrumb, Typography, theme, Tag } from "antd";
import { Building2, BadgePercent, ChevronRight, Sparkles } from "lucide-react";
import { getDealSync } from "../lib/api";
import { getMerchantAccount } from "../data/merchantAccounts";

const { Text } = Typography;
const { useToken } = theme;

interface BreadcrumbItem {
  title: string | React.ReactNode;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  className?: string;
}

const DynamicBreadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useToken();

  // Helper function to get deal status badge - shows deal stage/substage
  const getDealStatusBadge = (deal: any) => {
    const campaignStage = deal.campaignStage;
    const draftSubStage = deal.draftSubStage;
    const wonSubStage = deal.wonSubStage;
    const lostSubStage = deal.lostSubStage;

    // Draft stage - show substage
    if (campaignStage === "draft") {
      const substageMap: Record<string, { label: string; color: string }> = {
        prospecting: { label: "Prospecting", color: "default" },
        pre_qualification: { label: "Pre-qualification", color: "blue" },
        presentation: { label: "Presentation", color: "cyan" },
        appointment: { label: "Appointment", color: "cyan" },
        proposal: { label: "Proposal", color: "geekblue" },
        needs_assessment: { label: "Needs Assessment", color: "blue" },
        contract_sent: { label: "Contract Sent", color: "purple" },
        negotiation: { label: "Negotiation", color: "orange" },
        contract_signed: { label: "Contract Signed", color: "green" },
        approved: { label: "Approved", color: "success" },
      };
      const substage = substageMap[draftSubStage] || { label: "Draft", color: "default" };
      return <Tag color={substage.color} style={{ marginLeft: 8 }}>{substage.label.toUpperCase()}</Tag>;
    }

    // Won stage - show substage
    if (campaignStage === "won") {
      if (wonSubStage === "live") {
        return <Tag color="success" style={{ marginLeft: 8 }}>LIVE</Tag>;
      } else if (wonSubStage === "scheduled") {
        return <Tag color="processing" style={{ marginLeft: 8 }}>SCHEDULED</Tag>;
      } else if (wonSubStage === "paused") {
        return <Tag color="warning" style={{ marginLeft: 8 }}>PAUSED</Tag>;
      } else if (wonSubStage === "sold_out") {
        return <Tag color="purple" style={{ marginLeft: 8 }}>SOLD OUT</Tag>;
      } else if (wonSubStage === "ended") {
        return <Tag color="default" style={{ marginLeft: 8 }}>ENDED</Tag>;
      }
      return <Tag color="success" style={{ marginLeft: 8 }}>WON</Tag>;
    }

    // Lost stage - show substage
    if (campaignStage === "lost") {
      if (lostSubStage === "closed_lost" || lostSubStage === "archived") {
        return <Tag color="error" style={{ marginLeft: 8 }}>LOST</Tag>;
      }
      return <Tag color="error" style={{ marginLeft: 8 }}>LOST</Tag>;
    }

    return null;
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;

    // Don't show breadcrumbs on first-level pages
    if (
      path === "/" ||
      path === "/deals" ||
      path === "/accounts" ||
      path === "/tasks"
    ) {
      return [];
    }

    // Start with empty breadcrumbs for nested pages
    const breadcrumbs: BreadcrumbItem[] = [];

    if (path === "/deals/new") {
      breadcrumbs.push(
        {
          title: "Deals",
          path: "/deals",
          icon: <BadgePercent size={14} />,
        },
        {
          title: "New Deal",
          icon: <BadgePercent size={14} />,
        }
      );
      return breadcrumbs;
    }

    if (path === "/deals/ai-generator") {
      const accountId = searchParams.get("accountId");
      const account = accountId ? getMerchantAccount(accountId) : null;

      breadcrumbs.push(
        {
          title: "Deals",
          path: "/deals",
          icon: <BadgePercent size={14} />,
        },
        {
          title: account ? `AI Deal Generator - ${account.name}` : "AI Deal Generator",
          icon: <Sparkles size={14} />,
        }
      );
      return breadcrumbs;
    }

    // Check if path matches /accounts/:accountId/deals/:dealId
    const accountDealMatch = path.match(/^\/accounts\/([^/]+)\/deals\/([^/]+)/);
    if (accountDealMatch) {
      const [, accountId, dealId] = accountDealMatch;
      const account = getMerchantAccount(accountId);
      const deal = getDealSync(dealId);

      if (account && deal) {
        breadcrumbs.push(
          {
            title: "Accounts",
            path: "/accounts",
            icon: <Building2 size={14} />,
          },
          {
            title: account.name,
            path: `/accounts/${account.id}`,
            icon: <Building2 size={14} />,
          },
          {
            title: (
              <span>
                {deal.title.length > 50
                  ? `${deal.title.substring(0, 50)}...`
                  : deal.title}
                {" "}
                {getDealStatusBadge(deal)}
              </span>
            ),
            icon: <BadgePercent size={14} />,
          }
        );
      }
      return breadcrumbs;
    }

    // Check if path matches /deals/:id
    if (path.startsWith("/deals/") && params.id) {
      const dealId = params.id;
      const deal = getDealSync(dealId);

      if (deal) {
        // Get account information
        const account = deal.accountId ? getMerchantAccount(deal.accountId) : null;

        breadcrumbs.push(
          {
            title: "Deals",
            path: "/deals",
            icon: <BadgePercent size={14} />,
          }
        );

        // Add account breadcrumb if account exists
        if (account) {
          breadcrumbs.push({
            title: account.name,
            path: `/accounts/${account.id}`,
            icon: <Building2 size={14} />,
          });
        }

        // Add deal breadcrumb
        breadcrumbs.push({
          title: (
            <span>
              {deal.title.length > 50
                ? `${deal.title.substring(0, 50)}...`
                : deal.title}
              {" "}
              {getDealStatusBadge(deal)}
            </span>
          ),
          icon: <BadgePercent size={14} />,
        });
      }
      return breadcrumbs;
    }

    // Check if path matches /accounts/:id
    if (
      path.startsWith("/accounts/") &&
      params.id &&
      !path.includes("/deals/")
    ) {
      const accountId = params.id;
      const account = getMerchantAccount(accountId);

      if (account) {
        breadcrumbs.push(
          {
            title: "Accounts",
            path: "/accounts",
            icon: <Building2 size={14} />,
          },
          {
            title: account.name,
            icon: <Building2 size={14} />,
          }
        );
      }
      return breadcrumbs;
    }

    return breadcrumbs;
  };

  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const breadcrumbItems = generateBreadcrumbs();

  // Don't show breadcrumbs on homepage
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className={className}>
      <Breadcrumb
        className="responsive-breadcrumb"
        style={{
          fontSize: window.innerWidth < 768 ? token.fontSizeSM : token.fontSize,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
        separator={
          <span
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              color: token.colorTextTertiary,
            }}
          >
            <ChevronRight size={token.fontSizeSM} />
          </span>
        }
        items={breadcrumbItems.map((item, index) => ({
          title: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: token.marginXXS,
                cursor: item.path ? "pointer" : "default",
                transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
                padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                borderRadius: token.borderRadiusSM,
                maxWidth:
                  index === breadcrumbItems.length - 1 ? "none" : "300px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                background: "transparent",
              }}
              onClick={() => handleBreadcrumbClick(item.path)}
              onMouseEnter={(e) => {
                if (item.path) {
                  e.currentTarget.style.backgroundColor =
                    token.colorBgTextHover;
                  e.currentTarget.style.color = token.colorText;
                }
              }}
              onMouseLeave={(e) => {
                if (item.path) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = token.colorTextSecondary;
                }
              }}
            >
              {item.icon}
              <Text
                style={{
                  color: item.path ? token.colorTextSecondary : token.colorText,
                  fontSize: "inherit",
                  fontWeight: item.path ? 500 : 600,
                  transition: `color ${token.motionDurationMid} ${token.motionEaseInOut}`,
                }}
              >
                {item.title}
              </Text>
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default DynamicBreadcrumbs;
