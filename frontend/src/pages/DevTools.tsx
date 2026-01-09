import { Button, Card, Typography, Space, message, Input } from "antd";
import { Sparkles, RotateCcw, Trash2 } from "lucide-react";
import { deals as mockDeals } from "../data/mockDeals";
import { useState } from "react";

const { Title, Text } = Typography;

const DevTools = () => {
  const [dealId, setDealId] = useState("");

  const setAllDealsToAuto = () => {
    const STORAGE_KEY = "groupon_deals_storage";
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const data = JSON.parse(stored);
      let updateCount = 0;
      
      // First, ensure all mock deals are in localStorage with auto mode
      mockDeals.forEach((mockDeal) => {
        // Always set/overwrite with auto mode enabled
        data.deals[mockDeal.id] = {
          ...mockDeal,
          isRedemptionInstructionsAuto: true,
        };
        updateCount++;
      });
      
      // Update any remaining deals in localStorage
      for (const dealId in data.deals) {
        if (data.deals[dealId] && !mockDeals.find(d => d.id === dealId)) {
          data.deals[dealId].isRedemptionInstructionsAuto = true;
          updateCount++;
        }
      }
      
      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      message.success(`✅ Updated ${updateCount} deals to use auto-generated redemption instructions. Refreshing...`);
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      message.error('❌ No deals found in localStorage');
    }
  };

  const resetSpecificDeal = () => {
    if (!dealId) {
      message.error('Please enter a deal ID');
      return;
    }

    const STORAGE_KEY = "groupon_deals_storage";
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const data = JSON.parse(stored);
      const mockDeal = mockDeals.find(d => d.id === dealId);
      
      if (mockDeal) {
        // Reset to mock deal with auto mode
        data.deals[dealId] = {
          ...mockDeal,
          isRedemptionInstructionsAuto: true,
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        message.success(`✅ Reset deal ${dealId} to default with auto mode. Refreshing...`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        message.error(`❌ Deal ${dealId} not found in mock data`);
      }
    } else {
      message.error('❌ No deals found in localStorage');
    }
  };

  const clearAllStorage = () => {
    const STORAGE_KEY = "groupon_deals_storage";
    localStorage.removeItem(STORAGE_KEY);
    message.success('✅ Cleared all storage. Refreshing...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>Development Tools</Title>
      
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Title level={4}>Redemption Instructions</Title>
              <Text type="secondary">
                Set all deals to use Groupon's auto-generated redemption instructions
              </Text>
            </div>
            
            <Button
              type="primary"
              icon={<Sparkles size={16} />}
              onClick={setAllDealsToAuto}
              size="large"
            >
              Set All Deals to Auto Mode
            </Button>
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Title level={4}>Reset Specific Deal</Title>
              <Text type="secondary">
                Reset a single deal to its default state with auto mode enabled
              </Text>
            </div>
            
            <Space>
              <Input
                placeholder="Enter deal ID (e.g., 6)"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                style={{ width: 200 }}
                size="large"
              />
              <Button
                icon={<RotateCcw size={16} />}
                onClick={resetSpecificDeal}
                size="large"
              >
                Reset Deal
              </Button>
            </Space>
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Title level={4}>Clear All Storage</Title>
              <Text type="secondary">
                Remove all localStorage data. The app will reinitialize with default mock data
              </Text>
            </div>
            
            <Button
              danger
              icon={<Trash2 size={16} />}
              onClick={clearAllStorage}
              size="large"
            >
              Clear All Storage
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default DevTools;

