import React, { useState } from "react";
import {
  Card,
  Button,
  Descriptions,
  Select,
  DatePicker,
  Checkbox,
  Space,
  Input,
  Tag,
  Typography,
  theme,
  Tooltip,
} from "antd";
import { Settings, Search } from "lucide-react";
import dayjs from "dayjs";
import { Deal } from "../../data/mockDeals";
import {
  QUALITY_OPTIONS,
  DIVISION_OPTIONS,
  CATEGORY_OPTIONS,
  filterSelectOption,
} from "./constants.tsx";
import { SearchableServiceSelector } from "../SearchableServiceSelector";

const { Text } = Typography;
const { useToken } = theme;

export interface DealSummaryCardProps {
  deal: Deal;
  isEditing: boolean;
  onToggleEdit: () => void;
  hasUnsavedChanges: boolean;
  countChanges: () => number;
  // Edit state
  editableQuality: string;
  setEditableQuality: (quality: string) => void;
  launchDate: dayjs.Dayjs | null;
  setLaunchDate: (date: dayjs.Dayjs | null) => void;
  endDate: dayjs.Dayjs | null;
  setEndDate: (date: dayjs.Dayjs | null) => void;
  isContinuous: boolean;
  setIsContinuous: (continuous: boolean) => void;
  editableDivision: string;
  setEditableDivision: (division: string) => void;
  editableCategorySubcategoryPos: string;
  setEditableCategorySubcategoryPos: (category: string) => void;
  editableWeb: string;
  setEditableWeb: (web: string) => void;
}

const DealSummaryCard: React.FC<DealSummaryCardProps> = ({
  deal,
  isEditing,
  onToggleEdit,
  hasUnsavedChanges,
  countChanges,
  editableQuality,
  setEditableQuality,
  launchDate,
  setLaunchDate,
  endDate,
  setEndDate,
  isContinuous,
  setIsContinuous,
  editableDivision,
  setEditableDivision,
  editableCategorySubcategoryPos,
  setEditableCategorySubcategoryPos,
  editableWeb,
  setEditableWeb,
}) => {
  const { token } = useToken();
  const [serviceSelectorOpen, setServiceSelectorOpen] = useState(false);

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Summary</span>
          {hasUnsavedChanges && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 6px",
                background: token.colorWarningBg,
                border: `1px solid ${token.colorWarningBorder}`,
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: token.colorWarning,
                  animation: "pulse 1.5s infinite",
                }}
              />
              <Text style={{ color: token.colorWarningText, fontSize: 11 }}>
                {countChanges()} change{countChanges() !== 1 ? "s" : ""}
              </Text>
            </div>
          )}
        </div>
      }
      extra={
        <Button
          type="text"
          icon={<Settings size={14} />}
          onClick={onToggleEdit}
          style={{
            background: isEditing
              ? token.colorWarningBg
              : token.colorFillSecondary,
            color: isEditing ? token.colorWarningText : token.colorTextSecondary,
            borderRadius: 6,
          }}
        >
          Edit
        </Button>
      }
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Deal quality">
          {isEditing ? (
            <Select
              value={editableQuality}
              onChange={setEditableQuality}
              style={{ width: 200 }}
              placeholder="Select quality"
              options={QUALITY_OPTIONS}
            />
          ) : (
            <Tag
              color={
                editableQuality === "Ace"
                  ? "green"
                  : editableQuality === "Good"
                  ? "blue"
                  : editableQuality === "Fair"
                  ? "orange"
                  : "red"
              }
            >
              {deal.quality}
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Deal start">
          {isEditing ? (
            <DatePicker
              value={launchDate}
              onChange={(date) => setLaunchDate(date)}
              format="DD. M. YYYY"
              style={{ width: 200 }}
              placeholder="Select launch date"
            />
          ) : (
            <Text>{deal.dealStart || "Not set"}</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Deal end">
          {isEditing ? (
            <Space direction="vertical" size="small" style={{ width: 200 }}>
              <Checkbox
                checked={isContinuous}
                onChange={(e) => {
                  setIsContinuous(e.target.checked);
                  if (e.target.checked) {
                    setEndDate(null);
                  }
                }}
              >
                Continuous (no end date)
              </Checkbox>
              {!isContinuous && (
                <DatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  format="DD. M. YYYY"
                  style={{ width: "100%" }}
                  placeholder="Select end date"
                />
              )}
            </Space>
          ) : (
            <Text>{deal.dealEnd || "Continuous"}</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Division">
          {isEditing ? (
            <Select
              value={editableDivision}
              onChange={setEditableDivision}
              style={{ width: 200 }}
              placeholder="Select division"
              showSearch
              filterOption={filterSelectOption}
              options={DIVISION_OPTIONS}
            />
          ) : (
            <Text>{deal.division}</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          {isEditing ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button
                icon={<Search size={14} />}
                onClick={() => setServiceSelectorOpen(true)}
                style={{ width: 300 }}
              >
                {editableCategorySubcategoryPos || 'Search services...'}
              </Button>
              {editableCategorySubcategoryPos && (
                <Space size={4} wrap>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Selected:
                  </Text>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    {editableCategorySubcategoryPos.split(' > ')[0] || deal.category}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                  <Tag color="cyan" style={{ fontSize: 11 }}>
                    {editableCategorySubcategoryPos.split(' > ')[1] || deal.subcategory}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                  <Tag color="purple" style={{ fontSize: 11 }}>
                    {editableCategorySubcategoryPos.split(' > ')[2] || deal.pos}
                  </Tag>
                </Space>
              )}
            </Space>
          ) : (
            <Tooltip title={`${deal.category} > ${deal.subcategory} > ${deal.pos}`}>
              <Space size={4} wrap>
                <Tag color="blue">{deal.category}</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                <Tag color="cyan">{deal.subcategory}</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                <Tag color="purple">{deal.pos}</Tag>
              </Space>
            </Tooltip>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Web">
          {isEditing ? (
            <Input
              value={editableWeb}
              onChange={(e) => setEditableWeb(e.target.value)}
              style={{ width: 200 }}
              placeholder="Enter web"
            />
          ) : (
            <Text copyable>{deal.web}</Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Service Selector Modal */}
      <SearchableServiceSelector
        open={serviceSelectorOpen}
        onClose={() => setServiceSelectorOpen(false)}
        onSelect={(service) => {
          // Format: "Category > Subcategory > Service"
          const fullPath = `${service.category_name} > ${service.subcategory_name} > ${service.service_name}`;
          setEditableCategorySubcategoryPos(fullPath);
        }}
        currentValue={editableCategorySubcategoryPos}
        dealId={deal.id}
      />
    </Card>
  );
};

export default DealSummaryCard;

