import React, { useState, useMemo } from "react";
import { Card, Input, InputNumber, Switch, Divider, Select, Space, Typography, theme, Button, Modal, Tag } from "antd";
import { X, Info } from "lucide-react";
import { VALIDITY_PERIOD_OPTIONS } from "./constants.tsx";
import { DealOptionDetailsContentProps } from "./types";

const { Text } = Typography;
const { useToken } = theme;

const DealOptionDetailsContent: React.FC<DealOptionDetailsContentProps> = ({
  option,
  onUpdate,
  onRemove,
  onClose,
  useDecimals = false,
}) => {
  const { token } = useToken();
  
  // State for Promotion section
  const [merchantPaysMax, setMerchantPaysMax] = useState<number>(option.merchantPaysMax || 20);
  const [promotionDiscount, setPromotionDiscount] = useState<number>(option.promotionDiscount || 10);

  // Helper to round based on decimal setting
  const roundValue = (val: number) => {
    return useDecimals ? Math.round(val * 100) / 100 : Math.round(val);
  };

  const calculateDiscount = (
    regularPrice: number,
    grouponPrice: number
  ): number => {
    if (regularPrice === 0) return 0;
    return Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
  };

  const calculateGrouponPrice = (
    regularPrice: number,
    discount: number
  ): number => {
    return roundValue(regularPrice * (1 - discount / 100));
  };

  const precision = useDecimals ? 2 : 0;
  const step = useDecimals ? 0.01 : 1;

  // Calculate Promotion section values
  const promotionCalculations = useMemo(() => {
    const regularPrice = option.regularPrice || 0;
    
    // Merchant pays max amount (percentage of regular price)
    // This is the maximum amount merchant pays, which determines their minimum payout
    const merchantPaysMaxAmount = roundValue((regularPrice * merchantPaysMax) / 100);
    
    // Promotion discount amount
    const promotionDiscountAmount = roundValue((regularPrice * promotionDiscount) / 100);
    
    // Promotion split - Merchant pays portion (merchant pays max % of promotion discount)
    const promotionSplitMerchantPays = roundValue((promotionDiscountAmount * merchantPaysMax) / 100);
    
    // Promotion split - Groupon covers portion (remaining)
    const promotionSplitGrouponCovers = roundValue(promotionDiscountAmount - promotionSplitMerchantPays);
    
    // Unit price with promotion
    const unitPriceWithPromotion = roundValue(regularPrice - promotionDiscountAmount);
    
    // Merchant gets calculation with promotion discount
    // Merchant gets = regular price - merchant pays max amount - (promotion discount portion that Groupon covers)
    const merchantGetsWithPromotion = roundValue(regularPrice - merchantPaysMaxAmount - promotionSplitGrouponCovers);
    
    // Groupon gets = unit price with promotion - merchant gets
    const grouponGets = roundValue(unitPriceWithPromotion - merchantGetsWithPromotion);
    
    // Merchant gets min (at 20% promo discount)
    const promoDiscount20Amount = roundValue((regularPrice * 20) / 100);
    const promoSplitMerchant20 = roundValue((promoDiscount20Amount * merchantPaysMax) / 100);
    const promoSplitGroupon20 = roundValue(promoDiscount20Amount - promoSplitMerchant20);
    const merchantGetsMin = roundValue(regularPrice - merchantPaysMaxAmount - promoSplitGroupon20);
    
    // Calculate payouts for different promo discount percentages
    const promoDiscountOptions = [5, 10, 15, 20];
    const payoutsByPromoDiscount = promoDiscountOptions.map((discountPercent) => {
      const discountAmount = roundValue((regularPrice * discountPercent) / 100);
      const promoSplitMerchant = roundValue((discountAmount * merchantPaysMax) / 100);
      const promoSplitGroupon = roundValue(discountAmount - promoSplitMerchant);
      const merchantPayout = roundValue(regularPrice - merchantPaysMaxAmount - promoSplitGroupon);
      return {
        discountPercent,
        payout: merchantPayout,
      };
    });
    
    return {
      merchantPaysMaxAmount,
      merchantGetsMin,
      promotionDiscountAmount,
      promotionSplitMerchantPays,
      promotionSplitGrouponCovers,
      unitPriceWithPromotion,
      merchantGets: merchantGetsWithPromotion,
      grouponGets,
      payoutsByPromoDiscount,
    };
  }, [option.regularPrice, merchantPaysMax, promotionDiscount, useDecimals, roundValue]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {/* Close button at the top */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <Button
            type="text"
            size="small"
            icon={<X size={16} />}
            onClick={onClose}
            style={{ color: token.colorTextSecondary }}
          />
        </div>
      )}
      
      {/* Option Name */}
      <div>
        <Text
          type="secondary"
          style={{
            fontSize: token.fontSizeSM,
            display: "block",
            marginBottom: token.marginXS,
          }}
        >
          Option Name *
        </Text>
        <Input
          value={option.name}
          onChange={(e) => onUpdate("name", e.target.value)}
          size="large"
        />
      </div>

      {/* Pricing - 2 Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Original Price *
          </Text>
          <InputNumber
            value={option.regularPrice}
            onChange={(value) => {
              const newRegularPrice = value || 0;
              onUpdate("regularPrice", newRegularPrice);
              const newDiscount = calculateDiscount(
                newRegularPrice,
                option.grouponPrice
              );
              onUpdate("discount", newDiscount);
            }}
            prefix="$"
            size="large"
            style={{ width: "100%" }}
            min={0}
            step={step}
            precision={precision}
          />
        </div>

        <div>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Groupon Price *
          </Text>
          <InputNumber
            value={option.grouponPrice}
            onChange={(value) => {
              const newGrouponPrice = value || 0;
              onUpdate("grouponPrice", newGrouponPrice);
              const newDiscount = calculateDiscount(
                option.regularPrice,
                newGrouponPrice
              );
              onUpdate("discount", newDiscount);
              // Recalculate merchant payout based on groupon margin
              const grouponMargin = option.grouponMargin !== undefined ? option.grouponMargin : 50;
              const merchantMargin = 100 - grouponMargin;
              const merchantPayout = roundValue(
                (newGrouponPrice * merchantMargin) / 100
              );
              onUpdate("merchantPayout", merchantPayout);
            }}
            prefix="$"
            size="large"
            style={{ width: "100%" }}
            min={0}
            step={step}
            precision={precision}
          />
        </div>
      </div>

      {/* Discount and Monthly Capacity - 2 Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Discount *
          </Text>
          <InputNumber
            value={option.discount}
            onChange={(value) => {
              const newDiscount = value || 0;
              onUpdate("discount", newDiscount);
              const newGrouponPrice = calculateGrouponPrice(
                option.regularPrice,
                newDiscount
              );
              onUpdate("grouponPrice", newGrouponPrice);
              // Recalculate merchant payout based on groupon margin
              const grouponMargin = option.grouponMargin !== undefined ? option.grouponMargin : 50;
              const merchantMargin = 100 - grouponMargin;
              const merchantPayout = roundValue(
                (newGrouponPrice * merchantMargin) / 100
              );
              onUpdate("merchantPayout", merchantPayout);
            }}
            suffix="%"
            size="large"
            style={{ width: "100%" }}
            min={0}
            max={100}
            step={1}
            precision={0}
          />
          <Text
            type="secondary"
            style={{ fontSize: 11, marginTop: 4, display: "block" }}
          >
            Save ${roundValue(option.regularPrice - option.grouponPrice)}
          </Text>
        </div>

        <div>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Monthly Capacity
          </Text>
          <InputNumber
            value={option.monthlyCapacity || 100}
            onChange={(value) => onUpdate("monthlyCapacity", value || 100)}
            size="large"
            style={{ width: "100%" }}
            min={1}
            max={10000}
            step={10}
            precision={0}
          />
        </div>
        

      </div>
      {/* Validity Period */}
      <div>
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 8 }}
        >
          Validity Period
        </Text>
        <Select
          value={option.validity}
          onChange={(value) => onUpdate("validity", value)}
          size="large"
          style={{ width: "100%" }}
          options={VALIDITY_PERIOD_OPTIONS}
        />
      </div>

      {/* Optional Details */}
      {/* <div style={{ display: "none" }}>
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 8 }}
        >
          Subtitle
        </Text>
        <Input
          value={option.subtitle || ""}
          onChange={(e) => onUpdate("subtitle", e.target.value)}
          size="large"
          placeholder="e.g., Most Popular, Best Value"
        />
      </div>

      <div style={{ display: "none" }}>
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 8 }}
        >
          Details
        </Text>
        <Input.TextArea
          value={option.details || ""}
          onChange={(e) => onUpdate("details", e.target.value)}
          rows={3}
          placeholder="Enter additional details..."
        />
      </div> */}


      <Divider style={{ margin: 0 }} />

      {/* Revenue Split */}
      <div>
        <Text
          strong
          style={{ fontSize: 13, display: "block", marginBottom: 12 }}
        >
          Revenue Split
        </Text>

        {/* Groupon Margin */}
        <div
          style={{
            marginBottom: 16,
          }}
        >
          <div>
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
            >
              Groupon Margin %
            </Text>
            <InputNumber
              value={option.grouponMargin !== undefined ? option.grouponMargin : 50}
              onChange={(value) => {
                const grouponMargin = value !== null && value !== undefined ? value : 50;
                onUpdate("grouponMargin", grouponMargin);
                // Calculate merchant margin: if Groupon gets X%, merchant gets (100-X)%
                const merchantMargin = 100 - grouponMargin;
                onUpdate("merchantMargin", merchantMargin);
                // Recalculate merchant payout: merchant gets (100 - grouponMargin)% of groupon price
                const merchantPayout = roundValue(
                  (option.grouponPrice * merchantMargin) / 100
                );
                onUpdate("merchantPayout", merchantPayout);
              }}
              suffix="%"
              size="large"
              style={{ width: "100%" }}
              min={0}
              max={100}
              step={1}
              precision={0}
            />
          </div>
        </div>

        {/* Revenue Summary */}
        <Card size="small" style={{ background: token.colorFillSecondary }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, fontSize: 13 }}
          >
            Summary
          </Text>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Customer pays</Text>
              <Text strong style={{ fontSize: 14 }}>
                ${Math.round(option.grouponPrice)}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Merchant gets</Text>
              <Text strong style={{ fontSize: 14 }}>
                $
                {Math.round(
                  (option.grouponPrice * (100 - (option.grouponMargin !== undefined ? option.grouponMargin : 50))) / 100
                )}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Merchant margin</Text>
              <Text strong style={{ fontSize: 14 }}>
                {100 - (option.grouponMargin !== undefined ? option.grouponMargin : 50)}%
              </Text>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Groupon gets</Text>
              <Text strong style={{ fontSize: 14 }}>
                $
                {Math.round(
                  (option.grouponPrice * (option.grouponMargin !== undefined ? option.grouponMargin : 50)) / 100
                )}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Groupon margin</Text>
              <Text strong style={{ fontSize: 14 }}>
                {option.grouponMargin !== undefined ? option.grouponMargin : 50}%
              </Text>
            </div>
          </Space>
        </Card>
      </div>

      {/* Revenue Split with Promotion */}
      <div>
        <Text
          strong
          style={{ fontSize: 13, display: "block", marginBottom: 12 }}
        >
          Revenue Split with Promotion
        </Text>

        {/* Merchant pays max and Promotion discount - Side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12 }}
              >
                Merchant pays max
              </Text>
              <Info size={12} style={{ color: token.colorTextTertiary }} />
            </div>
            <Select
              value={merchantPaysMax}
              onChange={(value) => {
                setMerchantPaysMax(value);
                onUpdate("merchantPaysMax", value);
              }}
              size="large"
              style={{ width: "100%" }}
              options={[
                { label: "5%", value: 5 },
                { label: "10%", value: 10 },
                { label: "15%", value: 15 },
                { label: "20%", value: 20 },
              ]}
            />
          </div>

          <div>
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
            >
              Promotion discount
            </Text>
            <Select
              value={promotionDiscount}
              onChange={(value) => {
                const newValue = value !== null && value !== undefined ? value : 10;
                setPromotionDiscount(newValue);
                onUpdate("promotionDiscount", newValue);
              }}
              size="large"
              style={{ width: "100%" }}
              options={[
                { label: "5%", value: 5 },
                { label: "10%", value: 10 },
                { label: "15%", value: 15 },
                { label: "20%", value: 20 },
              ]}
            />
          </div>
        </div>

        {/* Revenue Summary with Promotion */}
        <Card size="small" style={{ background: token.colorFillSecondary }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, fontSize: 13 }}
          >
            Summary
          </Text>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 13 }}>Merchant pays max</Text>
                <Info size={12} style={{ color: token.colorTextTertiary }} />
              </div>
              <Text strong style={{ fontSize: 14 }}>
                <Tag style={{ color: token.colorTextSecondary }}>
                  {merchantPaysMax}%
                </Tag>
                &nbsp;&nbsp;${promotionCalculations.merchantPaysMaxAmount}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 13 }}>Merchant gets min</Text>
                <Info size={12} style={{ color: token.colorTextTertiary }} />
              </div>
              <Text strong style={{ fontSize: 14 }}>
                ${promotionCalculations.merchantGetsMin}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Promotion discount</Text>
              <Text strong style={{ fontSize: 14 }}>
                {promotionDiscount}% ${promotionCalculations.promotionDiscountAmount}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Text
                  style={{
                    fontSize: 13,
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    verticalAlign: "bottom",
                  }}
                  title="Promotion split (Merchant pays)"
                >Promotion split (Merchant pays)</Text>
                <Info size={12} style={{ color: token.colorTextTertiary }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Tag style={{ color: token.colorTextSecondary }}>
                  {merchantPaysMax}%
                </Tag>
                <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
                  ${promotionCalculations.promotionSplitMerchantPays}
                </Text>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: token.marginLG }}>
                <Text
                  style={{
                    fontSize: 13,
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    verticalAlign: "bottom",
                  }}
                  title="Promotion split (Groupon covers)"
                >
                  Promotion split (Groupon covers)
                </Text>
                <Info size={12} style={{ color: token.colorTextTertiary }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Tag style={{ color: token.colorTextSecondary }}>
                  {100 - merchantPaysMax}%
                </Tag>
                <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
                  ${promotionCalculations.promotionSplitGrouponCovers}
                </Text>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 13 }}>Unit price (with promotion)</Text>
                <Info size={12} style={{ color: token.colorTextTertiary }} />
              </div>
              <Text strong style={{ fontSize: 14 }}>
                ${promotionCalculations.unitPriceWithPromotion}
              </Text>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Merchant gets</Text>
              <Text strong style={{ fontSize: 14 }}>
                ${promotionCalculations.merchantGets}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13 }}>Groupon gets</Text>
              <Text strong style={{ fontSize: 14 }}>
                ${promotionCalculations.grouponGets}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Payout by Promo discount % */}
        <Card size="small" style={{ background: token.colorFillSecondary, marginTop: 16 }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, fontSize: 13 }}
          >
            Payout by Promo discount %
          </Text>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {promotionCalculations.payoutsByPromoDiscount.map((payout) => (
              <div
                key={payout.discountPercent}
                style={{
                  flex: 1,
                  minWidth: "60px",
                  padding: "12px",
                  background: token.colorBgContainer,
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorBorder}`,
                  textAlign: "center",
                }}
              >
                <Text strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                  {payout.discountPercent}%
                </Text>
                <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                  ${payout.payout}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Status */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text strong style={{ display: "block" }}>
              Active Status
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Make this option available for purchase
            </Text>
          </div>
          <Switch
            checked={option.enabled}
            onChange={(checked) => onUpdate("enabled", checked)}
          />
        </div>
      </div>

      {/* Remove Option Button */}
      <Button
        danger
        block
        icon={<X size={16} />}
        onClick={() => {
          Modal.confirm({
            title: "Remove Option",
            content: `Are you sure you want to remove "${option.name}"? This action cannot be undone.`,
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: onRemove,
          });
        }}
      >
        Remove Option
      </Button>
    </Space>
  );
};

export default DealOptionDetailsContent;

