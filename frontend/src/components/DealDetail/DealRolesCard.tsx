import React from "react";
import {
  Card,
  Button,
  Descriptions,
  Select,
  Space,
  Avatar,
  Tag,
  Typography,
  theme,
} from "antd";
import { Settings } from "lucide-react";
import { Deal } from "../../data/mockDeals";
import { PERSONNEL_OPTIONS, filterSelectOption } from "./constants.tsx";
import { generateAvatar } from "../../lib/avatarGenerator";
import { useRoleView } from "../../contexts/RoleViewContext";
import { getEmployeeById } from "../../data/companyHierarchy";

const { Text } = Typography;
const { useToken } = theme;

export interface DealRolesCardProps {
  deal: Deal;
  isEditing: boolean;
  onToggleEdit: () => void;
  hasUnsavedChanges: boolean;
  countChanges: () => number;
  // Edit state
  editableAccountOwner: string;
  setEditableAccountOwner: (owner: string) => void;
  editableWriter: string;
  setEditableWriter: (writer: string) => void;
  editableImageDesigner: string;
  setEditableImageDesigner: (designer: string) => void;
  editableOpportunityOwner: string;
  setEditableOpportunityOwner: (owner: string) => void;
}

const DealRolesCard: React.FC<DealRolesCardProps> = ({
  deal,
  isEditing,
  onToggleEdit,
  hasUnsavedChanges,
  countChanges,
  editableAccountOwner,
  setEditableAccountOwner,
  editableWriter,
  setEditableWriter,
  editableImageDesigner,
  setEditableImageDesigner,
  editableOpportunityOwner,
  setEditableOpportunityOwner,
}) => {
  const { token } = useToken();
  const { currentUser } = useRoleView();
  const currentEmployee = getEmployeeById(currentUser.employeeId);
  
  // Use current user if account owner or opportunity owner is unassigned
  const displayAccountOwner = deal.roles.accountOwner === "Unassigned" ? currentUser.name : deal.roles.accountOwner;
  const displayOpportunityOwner = deal.roles.opportunityOwner === "Unassigned" ? currentUser.name : deal.roles.opportunityOwner;

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
          <span>Roles</span>
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
        <Descriptions.Item label="Account owner">
          {isEditing ? (
            <Select
              value={editableAccountOwner}
              onChange={setEditableAccountOwner}
              style={{ width: 200 }}
              placeholder="Select account owner"
              showSearch
              filterOption={filterSelectOption}
              options={PERSONNEL_OPTIONS}
            />
          ) : (
            <Space>
              <Avatar
                size="small"
                src={currentEmployee?.avatar || generateAvatar(displayAccountOwner, { type: "avataaars" })}
              >
                {!currentEmployee?.avatar && deal.roles.accountOwner === "Unassigned" 
                  ? currentUser.name.split(' ').map(n => n[0]).join('')
                  : undefined
                }
              </Avatar>
              <Text>{displayAccountOwner}</Text>
            </Space>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Writer">
          {isEditing ? (
            <Select
              value={editableWriter}
              onChange={setEditableWriter}
              style={{ width: 200 }}
              placeholder="Select writer"
              showSearch
              filterOption={filterSelectOption}
              options={PERSONNEL_OPTIONS}
            />
          ) : (
            <Space>
              <Avatar
                size="small"
                src={generateAvatar(deal.roles.writer, { type: "avataaars" })}
              />
              <Text>{deal.roles.writer}</Text>
            </Space>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Image designer">
          {isEditing ? (
            <Select
              value={editableImageDesigner}
              onChange={setEditableImageDesigner}
              style={{ width: 200 }}
              placeholder="Select image designer"
              showSearch
              filterOption={filterSelectOption}
              options={PERSONNEL_OPTIONS}
            />
          ) : (
            <Space>
              <Avatar
                size="small"
                src={generateAvatar(deal.roles.imageDesigner, { type: "avataaars" })}
              />
              <Text>{deal.roles.imageDesigner}</Text>
            </Space>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Opportunity owner">
          {isEditing ? (
            <Select
              value={editableOpportunityOwner}
              onChange={setEditableOpportunityOwner}
              style={{ width: 200 }}
              placeholder="Select opportunity owner"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                {
                  value: "Aanya Kublikova",
                  label: "Aanya Kublikova",
                },
                { value: "James Brown", label: "James Brown" },
                {
                  value: "Sofia Andersson",
                  label: "Sofia Andersson",
                },
                { value: "Kevin Zhang", label: "Kevin Zhang" },
                { value: "Rachel Green", label: "Rachel Green" },
              ]}
            />
          ) : (
            <Space>
              <Avatar
                size="small"
                src={deal.roles.opportunityOwner === "Unassigned" && currentEmployee?.avatar 
                  ? currentEmployee.avatar 
                  : generateAvatar(displayOpportunityOwner, { type: "avataaars" })}
              >
                {!currentEmployee?.avatar && deal.roles.opportunityOwner === "Unassigned"
                  ? currentUser.name.split(' ').map(n => n[0]).join('')
                  : undefined
                }
              </Avatar>
              <Text>{displayOpportunityOwner}</Text>
            </Space>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default DealRolesCard;

