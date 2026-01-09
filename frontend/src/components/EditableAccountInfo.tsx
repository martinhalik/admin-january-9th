import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Descriptions,
  Input,
  Button,
  Space,
  message,
  Modal,
  List,
  Tag,
  Typography,
  Switch,
  Tooltip,
  Alert,
} from "antd";
import {
  Edit,
  Save,
  History,
  Undo,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
} from "lucide-react";
import { MerchantAccount } from "../data/merchantAccounts";
import { theme } from "antd";

const { Text } = Typography;
const { useToken } = theme;

interface AccountVersion {
  id: string;
  timestamp: number;
  data: Partial<MerchantAccount>;
  label?: string;
}

interface EditableAccountInfoProps {
  account: MerchantAccount;
  onAccountUpdate: (updatedAccount: MerchantAccount) => void;
}

const EditableAccountInfo: React.FC<EditableAccountInfoProps> = ({
  account,
  onAccountUpdate,
}) => {
  const { token } = useToken();
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<AccountVersion[]>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">(
    "saved"
  );

  // Editable fields
  const [editedAccount, setEditedAccount] = useState<MerchantAccount>(account);
  const [originalAccount, setOriginalAccount] =
    useState<MerchantAccount>(account);

  const renderCount = useRef(0);

  // Initialize versions from localStorage
  useEffect(() => {
    const savedVersions = localStorage.getItem(
      `account-versions-${account.id}`
    );
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }
  }, [account.id]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isSaving) return;

    const timer = setTimeout(() => {
      performSave(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [editedAccount, autoSaveEnabled, hasUnsavedChanges, isSaving]);

  // Mark content as changed
  useEffect(() => {
    renderCount.current += 1;

    // Skip the first few renders to allow initial setup
    if (renderCount.current <= 3) {
      return;
    }

    const hasChanges =
      JSON.stringify(editedAccount) !== JSON.stringify(originalAccount);
    setHasUnsavedChanges(hasChanges);

    if (hasChanges) {
      setSaveStatus("unsaved");
    }
  }, [editedAccount, originalAccount]);

  const performSave = async (isAutoSave: boolean = false) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      const savedAccounts = localStorage.getItem("merchant-accounts");
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        const accountIndex = accounts.findIndex(
          (a: MerchantAccount) => a.id === account.id
        );
        if (accountIndex !== -1) {
          accounts[accountIndex] = editedAccount;
          localStorage.setItem("merchant-accounts", JSON.stringify(accounts));
        }
      }

      // Update parent component
      onAccountUpdate(editedAccount);

      // Save version
      const newVersion: AccountVersion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        data: { ...editedAccount },
        label: isAutoSave ? undefined : "Manual save",
      };

      const updatedVersions = [newVersion, ...versions.slice(0, 9)]; // Keep last 10 versions
      setVersions(updatedVersions);
      localStorage.setItem(
        `account-versions-${account.id}`,
        JSON.stringify(updatedVersions)
      );

      setOriginalAccount(editedAccount);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      setSaveStatus("saved");

      if (!isAutoSave) {
        message.success("Account information saved successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("unsaved");
      message.error("Failed to save account information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof MerchantAccount, value: string) => {
    setEditedAccount((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    performSave(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAccount(originalAccount);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
  };

  const handleRevert = () => {
    Modal.confirm({
      title: "Revert to original?",
      content:
        "This will discard all unsaved changes and restore the original account information.",
      okText: "Revert",
      cancelText: "Cancel",
      onOk: () => {
        setEditedAccount(originalAccount);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setIsEditing(false);
        message.success("Reverted to original information");
      },
    });
  };

  const handleRestoreVersion = (version: AccountVersion) => {
    Modal.confirm({
      title: "Restore this version?",
      content: `This will replace your current information with the version from ${new Date(
        version.timestamp
      ).toLocaleString()}. Your current changes will be lost.`,
      okText: "Restore",
      cancelText: "Cancel",
      onOk: () => {
        setEditedAccount(version.data as MerchantAccount);
        setHasUnsavedChanges(true);
        setSaveStatus("unsaved");
        setShowHistory(false);
        message.success("Version restored");
      },
    });
  };

  const handleSaveVersion = () => {
    const newVersion: AccountVersion = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      data: { ...editedAccount },
      label: "Manual version",
    };

    const updatedVersions = [newVersion, ...versions];
    setVersions(updatedVersions);
    localStorage.setItem(
      `account-versions-${account.id}`,
      JSON.stringify(updatedVersions)
    );
    message.success("Version saved");
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case "saved":
        return token.colorSuccess;
      case "unsaved":
        return token.colorWarning;
      case "saving":
        return token.colorPrimary;
      default:
        return token.colorTextSecondary;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saved":
        return lastSaved
          ? `Saved ${formatTimeAgo(lastSaved)}`
          : "All changes saved";
      case "unsaved":
        return "Unsaved changes";
      case "saving":
        return "Saving...";
      default:
        return "";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Account Information</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Save Status Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {saveStatus === "saved" && (
                <CheckCircle size={14} color={getSaveStatusColor()} />
              )}
              {saveStatus === "unsaved" && (
                <AlertCircle size={14} color={getSaveStatusColor()} />
              )}
              {saveStatus === "saving" && (
                <Clock size={14} color={getSaveStatusColor()} />
              )}
              <Text style={{ fontSize: 12, color: getSaveStatusColor() }}>
                {getSaveStatusText()}
              </Text>
            </div>

            {/* Auto-save Toggle */}
            <Tooltip title="Enable/disable auto-save">
              <Switch
                size="small"
                checked={autoSaveEnabled}
                onChange={setAutoSaveEnabled}
                style={{ marginRight: 8 }}
              />
            </Tooltip>

            {/* Action Buttons */}
            <Space>
              {!isEditing ? (
                <>
                  <Button icon={<Edit size={14} />} onClick={handleEdit}>
                    Edit
                  </Button>
                  <Button
                    icon={<History size={14} />}
                    onClick={() => setShowHistory(true)}
                    disabled={versions.length === 0}
                  >
                    History
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    icon={<Save size={14} />}
                    type="primary"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={!hasUnsavedChanges}
                  >
                    Save
                  </Button>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button icon={<Undo size={14} />} onClick={handleRevert}>
                    Revert
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      {/* Auto-save Status Banner */}
      {hasUnsavedChanges && autoSaveEnabled && (
        <Alert
          message="Auto-save enabled"
          description="Your changes will be saved automatically in a few seconds."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Descriptions column={1}>
        <Descriptions.Item label="Business Type">
          {isEditing ? (
            <Input
              value={editedAccount.businessType}
              onChange={(e) =>
                handleFieldChange("businessType", e.target.value)
              }
              style={{ maxWidth: 300 }}
            />
          ) : (
            editedAccount.businessType
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Location">
          <Space>
            <MapPin size={14} />
            {isEditing ? (
              <Input
                value={editedAccount.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                style={{ maxWidth: 300 }}
              />
            ) : (
              editedAccount.location
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Contact">
          <Space direction="vertical" size={4}>
            <Space>
              <Phone size={14} />
              {isEditing ? (
                <Input
                  value={editedAccount.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  style={{ maxWidth: 200 }}
                />
              ) : (
                editedAccount.phone
              )}
            </Space>
            <Space>
              <Mail size={14} />
              {isEditing ? (
                <Input
                  value={editedAccount.contactEmail}
                  onChange={(e) =>
                    handleFieldChange("contactEmail", e.target.value)
                  }
                  style={{ maxWidth: 300 }}
                />
              ) : (
                editedAccount.contactEmail
              )}
            </Space>
            {editedAccount.website && (
              <Space>
                <Globe size={14} />
                {isEditing ? (
                  <Input
                    value={editedAccount.website}
                    onChange={(e) =>
                      handleFieldChange("website", e.target.value)
                    }
                    style={{ maxWidth: 300 }}
                  />
                ) : (
                  editedAccount.website
                )}
              </Space>
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Created">
          <Space>
            <Calendar size={14} />
            {new Date(editedAccount.createdDate).toLocaleDateString()}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* History Modal */}
      <Modal
        title="Account History"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={[
          <Button key="save" type="primary" onClick={handleSaveVersion}>
            Save Current as Version
          </Button>,
          <Button key="close" onClick={() => setShowHistory(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <List
          dataSource={versions}
          renderItem={(version) => (
            <List.Item
              actions={[
                <Button
                  key="restore"
                  type="link"
                  onClick={() => handleRestoreVersion(version)}
                >
                  Restore
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {new Date(version.timestamp).toLocaleString()}
                    </Text>
                    {version.label && <Tag color="blue">{version.label}</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">
                      Business Type: {version.data.businessType}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Location: {version.data.location}
                    </Text>
                    <br />
                    <Text type="secondary">Phone: {version.data.phone}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
};

export default EditableAccountInfo;

