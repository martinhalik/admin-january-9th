import React, { useState } from "react";
import { Modal, Input, Space, Typography, Button, theme, message, Alert } from "antd";
import { Mail, Copy, Send } from "lucide-react";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface ShareWithMerchantModalProps {
  open: boolean;
  dealId: string;
  dealTitle: string;
  onClose: () => void;
}

const ShareWithMerchantModal: React.FC<ShareWithMerchantModalProps> = ({
  open,
  dealId,
  dealTitle,
  onClose,
}) => {
  const { token } = useToken();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Generate preview link
  const previewLink = `${window.location.origin}/preview/${dealId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewLink);
    message.success("Preview link copied to clipboard!");
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      message.error("Please enter recipient email");
      return;
    }

    setIsSending(true);
    
    // Simulate sending email (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSending(false);
    message.success(`Preview sent to ${recipientEmail}`);
    onClose();
  };

  const defaultMessage = `Hi,

I'd like to share a preview of the deal we've been working on: "${dealTitle}"

Please review and let me know if you have any questions or feedback.

Preview link: ${previewLink}

Best regards`;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
      centered
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ marginBottom: token.marginXS }}>
            Share with Merchant
          </Title>
          <Text type="secondary">
            Send a preview link to the merchant for review
          </Text>
        </div>

        {/* Preview Link */}
        <Alert
          type="info"
          message="Preview Link"
          description={
            <div>
              <Text code style={{ fontSize: token.fontSizeSM }}>
                {previewLink}
              </Text>
              <div style={{ marginTop: token.marginSM }}>
                <Button
                  size="small"
                  icon={<Copy size={14} />}
                  onClick={handleCopyLink}
                >
                  Copy Link
                </Button>
              </div>
            </div>
          }
        />

        {/* Email Form */}
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong style={{ display: "block", marginBottom: token.marginXS }}>
              Recipient Email
            </Text>
            <Input
              size="large"
              placeholder="merchant@example.com"
              prefix={<Mail size={16} />}
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <Text strong style={{ display: "block", marginBottom: token.marginXS }}>
              Message (Optional)
            </Text>
            <TextArea
              rows={8}
              placeholder={defaultMessage}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM, display: "block", marginTop: token.marginXXS }}>
              Leave empty to use default message
            </Text>
          </div>
        </Space>

        {/* Actions */}
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<Send size={16} />}
            onClick={handleSendEmail}
            loading={isSending}
          >
            Send Preview
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};

export default ShareWithMerchantModal;


