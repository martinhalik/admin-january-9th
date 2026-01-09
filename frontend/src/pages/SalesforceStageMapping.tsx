import { Card, Typography, Table, Tag, theme, Statistic, Row, Col, Space, Alert } from 'antd';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DynamicBreadcrumbs from '../components/Breadcrumbs';
import { SimplePageHeader } from '../components/PageHeaders';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface StageCount {
  stage: string;
  count: number;
  subStages?: { name: string; count: number }[];
}

const SalesforceStageMapping = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [stageCounts, setStageCounts] = useState<StageCount[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);

  useEffect(() => {
    fetchStageCounts();
  }, []);

  const fetchStageCounts = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      
      // Fetch all deals
      const { data: allDeals, error } = await supabase
        .from('deals')
        .select('campaign_stage, draft_sub_stage, won_sub_stage, lost_sub_stage');
      
      if (error) throw error;
      if (!allDeals) return;

      setTotalDeals(allDeals.length);

      // Group by campaign_stage
      const stageMap = new Map<string, { count: number; subStages: Map<string, number> }>();

      for (const deal of allDeals) {
        const stage = deal.campaign_stage || 'unknown';
        
        if (!stageMap.has(stage)) {
          stageMap.set(stage, { count: 0, subStages: new Map() });
        }
        
        const stageData = stageMap.get(stage)!;
        stageData.count++;
        
        // Track sub-stages
        let subStage = '';
        if (stage === 'draft' && deal.draft_sub_stage) {
          subStage = deal.draft_sub_stage;
        } else if (stage === 'won' && deal.won_sub_stage) {
          subStage = deal.won_sub_stage;
        } else if (stage === 'lost' && deal.lost_sub_stage) {
          subStage = deal.lost_sub_stage;
        }
        
        if (subStage) {
          stageData.subStages.set(subStage, (stageData.subStages.get(subStage) || 0) + 1);
        } else {
          stageData.subStages.set('(no sub-stage)', (stageData.subStages.get('(no sub-stage)') || 0) + 1);
        }
      }

      // Convert to array
      const stages: StageCount[] = [];
      for (const [stage, data] of stageMap.entries()) {
        const subStages = Array.from(data.subStages.entries()).map(([name, count]) => ({
          name,
          count,
        })).sort((a, b) => b.count - a.count);

        stages.push({
          stage,
          count: data.count,
          subStages,
        });
      }

      // Sort by count
      stages.sort((a, b) => b.count - a.count);
      setStageCounts(stages);

    } catch (error) {
      console.error('Error fetching stage counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'draft': return 'blue';
      case 'won': return 'green';
      case 'lost': return 'red';
      default: return 'default';
    }
  };

  const getSubStageColor = (subStage: string) => {
    switch (subStage) {
      case 'live': return 'green';
      case 'scheduled': return 'cyan';
      case 'paused': return 'orange';
      case 'ended': return 'default';
      case 'sold_out': return 'purple';
      case 'closed_lost': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Campaign Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => (
        <Tag color={getStageColor(stage)} style={{ fontSize: token.fontSize, padding: '4px 12px' }}>
          {stage.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Total Count',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <Text strong>{count.toLocaleString()}</Text>,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_: any, record: StageCount) => {
        const percentage = ((record.count / totalDeals) * 100).toFixed(1);
        return <Text type="secondary">{percentage}%</Text>;
      },
    },
    {
      title: 'Sub-Stages',
      dataIndex: 'subStages',
      key: 'subStages',
      render: (subStages: { name: string; count: number }[]) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {subStages?.map((sub, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Tag color={getSubStageColor(sub.name)} style={{ minWidth: 120 }}>
                {sub.name}
              </Tag>
              <Text type="secondary">{sub.count.toLocaleString()}</Text>
            </div>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: token.marginSM }}>
        <DynamicBreadcrumbs />
      </div>

      <SimplePageHeader
        title="Salesforce Stage Mapping"
        subtitle="View how Salesforce opportunities are mapped to our campaign stages"
      />

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: token.marginLG }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deals"
              value={totalDeals}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Draft Stage"
              value={stageCounts.find(s => s.stage === 'draft')?.count || 0}
              valueStyle={{ color: token.colorInfo }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Won Stage"
              value={stageCounts.find(s => s.stage === 'won')?.count || 0}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lost Stage"
              value={stageCounts.find(s => s.stage === 'lost')?.count || 0}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
      </Row>

      {/* Mapping Legend */}
      <Alert
        message="Stage Mapping Logic"
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Paragraph style={{ marginBottom: 0 }}>
              <strong>Won Sub-Stages:</strong>
              <ul style={{ marginTop: 4, marginBottom: 0 }}>
                <li><Tag color="cyan">scheduled</Tag> = Go_Live_Date__c &gt; TODAY (406 deals in SF)</li>
                <li><Tag color="green">live</Tag> = Deal_Status__c = "Live" (729 deals in SF)</li>
                <li><Tag color="orange">paused</Tag> = Deal_Status__c = "Paused" (3,267 deals in SF)</li>
                <li><Tag color="default">ended</Tag> = StageName = "Closed Won" with Deal_Status__c = null (~2.9M deals in SF)</li>
                <li><Tag color="purple">sold_out</Tag> = Custom mapping (if applicable)</li>
              </ul>
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <strong>Draft Sub-Stages:</strong> prospecting, appointment, proposal, negotiation, contract_sent, approved
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <strong>Lost Sub-Stages:</strong> closed_lost, dnr, roi_capacity
            </Paragraph>
          </Space>
        }
        type="info"
        style={{ marginBottom: token.marginLG }}
      />

      {/* Stage Breakdown Table */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Stage Breakdown</Title>}
        style={{ borderRadius: token.borderRadiusLG }}
      >
        <Table
          columns={columns}
          dataSource={stageCounts}
          loading={loading}
          rowKey="stage"
          pagination={false}
        />
      </Card>

      {/* Salesforce Stage Distribution (for reference) */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Salesforce Stage Distribution (Reference)</Title>}
        style={{ marginTop: token.marginLG, borderRadius: token.borderRadiusLG }}
      >
        <Paragraph type="secondary">
          From Salesforce (US, 2023+):
        </Paragraph>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Closed Lost" value="653,244" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Closed Won" value="228,587" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Newly Assigned" value="86,367" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Prospecting" value="39,205" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Unqualified" value="40,217" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="Other Stages" value="~15,000" />
            </Card>
          </Col>
        </Row>
        
        <Alert
          message="Note"
          description="We currently sync ~50K deals (729 Live + 50K 2025 deals). Historical 'Closed Won' deals (~2.9M) are not synced unless marked as 'Live' or 'Paused'."
          type="warning"
          style={{ marginTop: token.marginLG }}
        />
      </Card>
    </div>
  );
};

export default SalesforceStageMapping;



