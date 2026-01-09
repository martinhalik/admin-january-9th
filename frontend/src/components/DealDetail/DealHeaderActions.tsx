import React, { useState } from "react";
import { Button, Space, Typography, theme, Spin, message } from "antd";
import { RotateCcw, Upload as UploadIcon, CircleCheck, Send, Sparkles, Settings } from "lucide-react";
import { Deal } from "../../data/mockDeals";
import { UserRole } from "../../contexts/RoleViewContext";
import AIPrequalificationModal from "../AIPrequalificationModal";
import ShareWithMerchantModal from "../ShareWithMerchantModal";
import { AIReviewResult } from "../AIPrequalificationModal";
import { GrouponIcon } from "../icons";

const { Text } = Typography;
const { useToken } = theme;

interface DealHeaderActionsProps {
  deal: Deal;
  currentRole: UserRole;
  isNewDeal: boolean;
  isAIGenerating?: boolean;
  // Content autosave state
  contentHasUnsavedChanges: boolean;
  contentIsSaving: boolean;
  contentLastSaved: Date | null;
  contentPendingSave: boolean;
  contentUnpublishedCount: number;
  // Actions
  onPublish?: () => void;
  onPreview: () => void;
  onRevert: () => void;
  onDealUpdate: (updates: Partial<Deal>) => void;
  onManageOptions?: () => void;
  optionsCount?: number;
  showOptionsHeader?: boolean;
  optionsSidebarWidth?: number;
}

const DealHeaderActions: React.FC<DealHeaderActionsProps> = ({
  deal,
  currentRole,
  isNewDeal,
  isAIGenerating = false,
  contentHasUnsavedChanges,
  contentIsSaving,
  contentLastSaved,
  contentPendingSave,
  contentUnpublishedCount,
  onPublish,
  onPreview,
  onRevert,
  onDealUpdate,
  onManageOptions,
  optionsCount = 0,
  showOptionsHeader = false,
  optionsSidebarWidth = 0,
}) => {
  const { token } = useToken();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isDraftStage = deal.campaignStage === "draft";
  const isProspecting = deal.campaignStage === "draft" && deal.draftSubStage === "prospecting";
  const isPreQualification = deal.campaignStage === "draft" && deal.draftSubStage === "pre_qualification";
  const isPresentation = deal.campaignStage === "draft" && deal.draftSubStage === "presentation";
  
  const isBD = currentRole === "bd";
  const isMM = currentRole === "mm";
  const isAdmin = currentRole === "admin";

  const handleAISuccess = (result: AIReviewResult) => {
    // Move to pre-qualification stage
    onDealUpdate({
      draftSubStage: "pre_qualification",
      aiReviewResult: result,
    });
    message.success("AI pre-qualification approved! Moving to Pre-qualification stage.");
  };

  const handleAIFail = (result: AIReviewResult) => {
    // Stay in prospecting, but save the AI review result
    onDealUpdate({
      aiReviewResult: result,
      escalationReason: "Deal escalated by Sales Rep after AI review failure",
    });
    message.info("Deal escalated to Market Manager for review.");
  };

  return (
    <>
      {/* Fixed Status Header Bar - For all stages */}
      <div
        style={{
          position: "sticky",
          top: 164,
          zIndex: 52,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
          marginBottom: 80, // Increased to accommodate sticky header height
          marginLeft: -token.paddingLG,
          marginRight: showOptionsHeader ? -(optionsSidebarWidth + token.paddingLG) : 0,
          marginTop: -token.paddingMD,
          paddingLeft: token.paddingLG,
          paddingRight: token.paddingLG,
          height: 'fit-content',
        }}
      >
        <div
          style={{
            padding: `${token.padding}px 0`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
            {/* Left Side - Status Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Unsaved badge - only when pending or saving */}
              {(contentPendingSave || contentIsSaving) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: token.colorWarningBg,
                    border: `1px solid ${token.colorWarningBorder}`,
                    borderRadius: 16,
                  }}
                >
                  {contentIsSaving ? (
                    <Spin size="small" style={{ fontSize: 10 }} />
                  ) : (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: token.colorWarning,
                      }}
                    />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: 500, color: token.colorWarningText }}>
                    Unsaved
                  </Text>
                </div>
              )}

              {/* Saved badge - when not pending/saving and has been saved */}
              {!contentPendingSave && !contentIsSaving && contentLastSaved && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    background: token.colorSuccessBg,
                    border: `1px solid ${token.colorSuccessBorder}`,
                    borderRadius: 6,
                  }}
                >
                  <CircleCheck size={14} color={token.colorSuccessText} strokeWidth={2} />
                  <Text style={{ fontSize: 12, fontWeight: 500, color: token.colorSuccessText }}>
                    Saved
                  </Text>
                </div>
              )}

              {/* Separator */}
              {!contentPendingSave && !contentIsSaving && contentLastSaved && contentHasUnsavedChanges && contentUnpublishedCount > 0 && (
                <div style={{ height: 16, width: 1, background: token.colorBorder }} />
              )}

              {/* Unpublished count - with pulsing amber dot */}
              {contentHasUnsavedChanges && contentUnpublishedCount > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: token.colorWarning,
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0.5; }
                    }
                  `}</style>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                    {contentUnpublishedCount} unpublished
                  </Text>
                </div>
              ) : (
                /* All published badge - when no unpublished changes */
                !contentPendingSave && !contentIsSaving && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      background: token.colorSuccessBg,
                      border: `1px solid ${token.colorSuccessBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <CircleCheck size={14} color={token.colorSuccessText} strokeWidth={2} />
                    <Text style={{ fontSize: 12, fontWeight: 500, color: token.colorSuccessText }}>
                      All published
                    </Text>
                  </div>
                )
              )}
            </div>

            {/* Right Side - Action Buttons (aligned to right) */}
            <div style={{ marginLeft: "auto" }}>
              <Space size="small">
                <Button
                  size="middle"
                  icon={<RotateCcw size={14} />}
                  onClick={onRevert}
                  disabled={!contentHasUnsavedChanges || isAIGenerating}
                >
                  Revert
                </Button>
                <Button
                  size="middle"
                  icon={<GrouponIcon size={14} />}
                  onClick={onPreview}
                  disabled={isAIGenerating}
                >
                  View Deal
                </Button>
                {/* Only show Publish button for Won/Lost stages */}
                {!isDraftStage && (
                  <Button
                    type="primary"
                    size="middle"
                    icon={<UploadIcon size={14} />}
                    onClick={onPublish}
                    disabled={!contentHasUnsavedChanges || isAIGenerating}
                  >
                    Publish
                  </Button>
                )}
                {/* Show Save button for Draft stages */}
                {isDraftStage && (
                  <Button
                    type="primary"
                    size="middle"
                    icon={<UploadIcon size={14} />}
                    onClick={onPublish}
                    disabled={!contentHasUnsavedChanges || isAIGenerating}
                  >
                    Save
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </div>

      {/* Action Buttons for Draft Stage - Stage-specific buttons */}
      {isDraftStage && (
        <div style={{ marginBottom: token.margin, display: "flex", justifyContent: "flex-end" }}>
          <Space size="small">
            {/* Prospecting Stage (BD) */}
            {isProspecting && isBD && (
              <Button
                type="primary"
                size="middle"
                icon={<Sparkles size={14} />}
                onClick={() => setAiModalOpen(true)}
              >
                Submit for Pre-qualification
              </Button>
            )}

            {/* Pre-qualification Stage - Waiting for approval */}
            {isPreQualification && isBD && (
              <Button
                size="middle"
                disabled
              >
                Waiting for Manager Approval
              </Button>
            )}

            {/* Presentation+ Stage (BD) - Can share with merchant */}
            {(isPresentation || (deal.draftSubStage && !isProspecting && !isPreQualification)) && isBD && (
              <Button
                type="primary"
                size="middle"
                icon={<Send size={14} />}
                onClick={() => setShareModalOpen(true)}
              >
                Share with merchant
              </Button>
            )}

            {/* Admin/MM always has access to all actions */}
            {(isMM || isAdmin) && isPresentation && (
              <Button
                type="primary"
                size="middle"
                icon={<Send size={14} />}
                onClick={() => setShareModalOpen(true)}
              >
                Share with merchant
              </Button>
            )}
          </Space>
        </div>
      )}

      {/* AI Pre-qualification Modal */}
      <AIPrequalificationModal
        open={aiModalOpen}
        dealId={deal.id}
        dealData={deal}
        onClose={() => setAiModalOpen(false)}
        onSuccess={handleAISuccess}
        onFail={handleAIFail}
      />

      {/* Share with Merchant Modal */}
      <ShareWithMerchantModal
        open={shareModalOpen}
        dealId={deal.id}
        dealTitle={deal.title}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
};

export default DealHeaderActions;

