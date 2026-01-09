import React from "react";
import { Typography, theme } from "antd";
import AccountSelector from "../AccountSelector";
import { MerchantAccount } from "../../data/merchantAccounts";

const { Title, Paragraph } = Typography;
const { useToken } = theme;

interface AccountSelectorSidebarContentProps {
  selectedAccountId?: string;
  onSelect: (account: MerchantAccount) => void;
}

const AccountSelectorSidebarContent: React.FC<AccountSelectorSidebarContentProps> = ({
  selectedAccountId,
  onSelect,
}) => {
  const { token } = useToken();

  return (
    <div style={{ padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px` }}>
      <Title level={5} style={{ marginBottom: token.margin }}>
        Select Merchant Account
      </Title>
      <Paragraph
        type="secondary"
        style={{ marginBottom: token.margin, fontSize: 13 }}
      >
        Choose the merchant account for this deal to continue
      </Paragraph>
      <AccountSelector onSelect={onSelect} selectedAccountId={selectedAccountId} />
    </div>
  );
};

export default AccountSelectorSidebarContent;

