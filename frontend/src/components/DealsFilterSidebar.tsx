import React from "react";
import {
  Select,
  Input,
  Typography,
  Space,
  theme,
  Divider,
  Button,
} from "antd";
import { Filter, X } from "lucide-react";

const { Text } = Typography;
const { useToken } = theme;

interface DealsFilterSidebarProps {
  // Filter states
  trendingFilter: string;
  tagFilter: string;
  merchandisingTagFilter: string;
  taxonomyCategoriesFilter: string;
  countryFilter: string;
  divisionsFilter: string;
  channelsFilter: string;
  subchannelFilter: string;
  marginsFilter: string;
  minPrice: string;
  maxPrice: string;
  minPurchases: string;
  maxPurchases: string;
  minActivations: string;
  maxActivations: string;
  merchantFilter: string;
  brandsFilter: string;

  // Setters
  setTrendingFilter: (value: string) => void;
  setTagFilter: (value: string) => void;
  setMerchandisingTagFilter: (value: string) => void;
  setTaxonomyCategoriesFilter: (value: string) => void;
  setCountryFilter: (value: string) => void;
  setDivisionsFilter: (value: string) => void;
  setChannelsFilter: (value: string) => void;
  setSubchannelFilter: (value: string) => void;
  setMarginsFilter: (value: string) => void;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  setMinPurchases: (value: string) => void;
  setMaxPurchases: (value: string) => void;
  setMinActivations: (value: string) => void;
  setMaxActivations: (value: string) => void;
  setMerchantFilter: (value: string) => void;
  setBrandsFilter: (value: string) => void;

  onClose?: () => void;
}

const DealsFilterSidebar: React.FC<DealsFilterSidebarProps> = ({
  trendingFilter,
  tagFilter,
  merchandisingTagFilter,
  taxonomyCategoriesFilter,
  countryFilter,
  divisionsFilter,
  channelsFilter,
  subchannelFilter,
  marginsFilter,
  minPrice,
  maxPrice,
  minPurchases,
  maxPurchases,
  minActivations,
  maxActivations,
  merchantFilter,
  brandsFilter,
  setTrendingFilter,
  setTagFilter,
  setMerchandisingTagFilter,
  setTaxonomyCategoriesFilter,
  setCountryFilter,
  setDivisionsFilter,
  setChannelsFilter,
  setSubchannelFilter,
  setMarginsFilter,
  setMinPrice,
  setMaxPrice,
  setMinPurchases,
  setMaxPurchases,
  setMinActivations,
  setMaxActivations,
  setMerchantFilter,
  setBrandsFilter,
  onClose,
}) => {
  const { token } = useToken();

  const handleClearAll = () => {
    setTrendingFilter("");
    setTagFilter("");
    setMerchandisingTagFilter("");
    setTaxonomyCategoriesFilter("");
    setCountryFilter("United States");
    setDivisionsFilter("");
    setChannelsFilter("");
    setSubchannelFilter("");
    setMarginsFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinPurchases("");
    setMaxPurchases("");
    setMinActivations("");
    setMaxActivations("");
    setMerchantFilter("all");
    setBrandsFilter("");
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "auto",
        background: token.colorBgContainer,
        borderLeft: `1px solid ${token.colorBorder}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: token.paddingLG,
          borderBottom: `1px solid ${token.colorBorder}`,
          position: "sticky",
          top: 0,
          background: token.colorBgContainer,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Filter size={20} style={{ color: token.colorPrimary }} />
            <Text strong style={{ fontSize: token.fontSizeLG }}>
              Filters
            </Text>
          </Space>
          <Button
            type="text"
            icon={<X size={20} />}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
        <Button
          type="link"
          onClick={handleClearAll}
          style={{ padding: 0, marginTop: token.marginXS }}
        >
          Clear all filters
        </Button>
      </div>

      {/* Filters Content */}
      <div style={{ padding: token.paddingLG }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Performance Filters */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              PERFORMANCE
            </Text>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Select
                placeholder="Trending"
                value={trendingFilter || undefined}
                onChange={setTrendingFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "trending_up", label: "Trending Up" },
                  { value: "trending_down", label: "Trending Down" },
                  { value: "stable", label: "Stable" },
                ]}
              />

              <Select
                placeholder="Margins"
                value={marginsFilter || undefined}
                onChange={setMarginsFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "high", label: "High (>30%)" },
                  { value: "medium", label: "Medium (15-30%)" },
                  { value: "low", label: "Low (<15%)" },
                ]}
              />
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Price Range */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              PRICE RANGE
            </Text>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Input
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                type="number"
                prefix="$"
              />
              <Input
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                type="number"
                prefix="$"
              />
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Volume Metrics */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              VOLUME
            </Text>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Input
                placeholder="Min purchases"
                value={minPurchases}
                onChange={(e) => setMinPurchases(e.target.value)}
                type="number"
              />
              <Input
                placeholder="Max purchases"
                value={maxPurchases}
                onChange={(e) => setMaxPurchases(e.target.value)}
                type="number"
              />
              <Input
                placeholder="Min activations"
                value={minActivations}
                onChange={(e) => setMinActivations(e.target.value)}
                type="number"
              />
              <Input
                placeholder="Max activations"
                value={maxActivations}
                onChange={(e) => setMaxActivations(e.target.value)}
                type="number"
              />
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Categories & Tags */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              CATEGORIES & TAGS
            </Text>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Select
                placeholder="Customer taxonomy"
                value={taxonomyCategoriesFilter || undefined}
                onChange={setTaxonomyCategoriesFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "food_drink", label: "Food & Drink" },
                  { value: "health_beauty", label: "Health & Beauty" },
                  { value: "activities", label: "Activities & Entertainment" },
                  { value: "travel", label: "Travel & Lodging" },
                ]}
              />

              <Select
                placeholder="Tag"
                value={tagFilter || undefined}
                onChange={setTagFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "featured", label: "Featured" },
                  { value: "new", label: "New" },
                  { value: "popular", label: "Popular" },
                  { value: "seasonal", label: "Seasonal" },
                ]}
              />

              <Select
                placeholder="Merchandising tag"
                value={merchandisingTagFilter || undefined}
                onChange={setMerchandisingTagFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "premium", label: "Premium" },
                  { value: "value", label: "Value" },
                  { value: "exclusive", label: "Exclusive" },
                ]}
              />
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Location & Distribution */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              LOCATION & DISTRIBUTION
            </Text>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Select
                placeholder="Country"
                value={countryFilter || undefined}
                onChange={setCountryFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "United States", label: "United States" },
                  { value: "Canada", label: "Canada" },
                  { value: "United Kingdom", label: "United Kingdom" },
                  { value: "Australia", label: "Australia" },
                ]}
              />

              <Select
                placeholder="Divisions"
                value={divisionsFilter || undefined}
                onChange={setDivisionsFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "local", label: "Local" },
                  { value: "goods", label: "Goods" },
                  { value: "travel", label: "Travel" },
                ]}
              />

              <Select
                placeholder="Channels"
                value={channelsFilter || undefined}
                onChange={setChannelsFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "web", label: "Web" },
                  { value: "mobile", label: "Mobile" },
                  { value: "email", label: "Email" },
                ]}
              />

              <Select
                placeholder="Subchannel"
                value={subchannelFilter || undefined}
                onChange={setSubchannelFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "app", label: "App" },
                  { value: "web", label: "Web" },
                  { value: "partner", label: "Partner" },
                ]}
              />
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Merchant & Brand */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                display: "block",
                marginBottom: token.marginXS,
              }}
            >
              MERCHANT & BRAND
            </Text>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Select
                placeholder="Merchant"
                value={merchantFilter === "all" ? undefined : merchantFilter}
                onChange={(value) => setMerchantFilter(value || "all")}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "merchant1", label: "Merchant 1" },
                  { value: "merchant2", label: "Merchant 2" },
                  { value: "merchant3", label: "Merchant 3" },
                ]}
              />

              <Select
                placeholder="Brands"
                value={brandsFilter || undefined}
                onChange={setBrandsFilter}
                style={{ width: "100%" }}
                allowClear
                options={[
                  { value: "brand1", label: "Brand 1" },
                  { value: "brand2", label: "Brand 2" },
                  { value: "brand3", label: "Brand 3" },
                ]}
              />
            </Space>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default DealsFilterSidebar;

