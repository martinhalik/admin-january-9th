import React, { useState } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Card,
  Form,
  InputNumber,
  Alert,
  Typography,
  theme,
  Spin,
} from "antd";
import { Sparkles } from "lucide-react";
import { MerchantAccount } from "../data/merchantAccounts";
import { generateCustomOption, GeneratedOption } from "../lib/aiRecommendations";

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface CustomOptionBuilderProps {
  open: boolean;
  onClose: () => void;
  onAdd: (option: GeneratedOption) => void;
  merchant: MerchantAccount;
  categoryId: string;
}

const CustomOptionBuilder: React.FC<CustomOptionBuilderProps> = ({
  open,
  onClose,
  onAdd,
  merchant,
  categoryId,
}) => {
  const { token } = useToken();
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedOption, setGeneratedOption] = useState<GeneratedOption | null>(
    null
  );
  const [form] = Form.useForm();

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;

    setGenerating(true);

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const option = generateCustomOption(customPrompt, merchant, categoryId);
    
    if (option) {
      setGeneratedOption(option);
      // Pre-fill form with generated values
      form.setFieldsValue({
        name: option.name,
        regularPrice: option.regularPrice,
        grouponPrice: option.grouponPrice,
        discount: option.discount,
      });
    }

    setGenerating(false);
  };

  const handleAdd = () => {
    if (!generatedOption) return;

    const values = form.getFieldsValue();
    
    // Update generated option with form values
    const finalOption: GeneratedOption = {
      ...generatedOption,
      name: values.name,
      regularPrice: values.regularPrice,
      grouponPrice: values.grouponPrice,
      discount: Math.round(
        ((values.regularPrice - values.grouponPrice) / values.regularPrice) * 100
      ),
    };

    onAdd(finalOption);
    handleClose();
  };

  const handleClose = () => {
    setCustomPrompt("");
    setGeneratedOption(null);
    form.resetFields();
    onClose();
  };

  // Calculate discount when prices change
  const handlePriceChange = () => {
    const values = form.getFieldsValue();
    if (values.regularPrice && values.grouponPrice) {
      const discount = Math.round(
        ((values.regularPrice - values.grouponPrice) / values.regularPrice) * 100
      );
      form.setFieldsValue({ discount });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `${token.colorPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            <Sparkles size={18} />
          </div>
          <span>Build Custom Option with AI</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={700}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Prompt Input */}
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Describe Your Option
          </Text>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Tell AI what kind of deal option you want to create
          </Text>
          <TextArea
            placeholder="e.g., 'Family dinner for 4 with appetizers and desserts' or '$50 spa package with massage and facial'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 5 }}
            style={{ fontSize: 15 }}
            onPressEnter={(e) => {
              if (e.shiftKey) return; // Allow new lines with Shift+Enter
              e.preventDefault();
              handleGenerate();
            }}
          />
          <div style={{ marginTop: 12 }}>
            <Button
              type="primary"
              loading={generating}
              onClick={handleGenerate}
              icon={<Sparkles size={16} />}
              size="large"
              disabled={!customPrompt.trim()}
              block
            >
              {generating ? "Generating..." : "Generate Option with AI"}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {generating && (
          <Card style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                AI is analyzing your request and generating optimal pricing...
              </Text>
            </div>
          </Card>
        )}

        {/* Generated Option Form */}
        {generatedOption && !generating && (
          <Card
            title="AI Generated Option"
            extra={
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: "normal",
                }}
              >
                Confidence: {Math.round(generatedOption.confidence * 100)}%
              </Text>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {/* AI Reasoning */}
              <Alert
                message="AI Recommendation"
                description={generatedOption.reasoning}
                type="info"
                showIcon
                icon={<Sparkles size={16} />}
                style={{ marginBottom: 8 }}
              />

              {/* Editable Form */}
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  name: generatedOption.name,
                  regularPrice: generatedOption.regularPrice,
                  grouponPrice: generatedOption.grouponPrice,
                  discount: generatedOption.discount,
                }}
              >
                <Form.Item
                  label="Option Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter option name" },
                  ]}
                >
                  <Input size="large" placeholder="e.g., $50 Dining Experience" />
                </Form.Item>

                <Space size="large" style={{ width: "100%" }}>
                  <Form.Item
                    label="Regular Price"
                    name="regularPrice"
                    rules={[
                      { required: true, message: "Required" },
                      { type: "number", min: 1, message: "Must be positive" },
                    ]}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <InputNumber
                      prefix="$"
                      size="large"
                      style={{ width: "100%" }}
                      onChange={handlePriceChange}
                      min={1}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Groupon Price"
                    name="grouponPrice"
                    rules={[
                      { required: true, message: "Required" },
                      { type: "number", min: 1, message: "Must be positive" },
                    ]}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <InputNumber
                      prefix="$"
                      size="large"
                      style={{ width: "100%" }}
                      onChange={handlePriceChange}
                      min={1}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Discount"
                    name="discount"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <InputNumber
                      suffix="%"
                      size="large"
                      style={{ width: "100%" }}
                      disabled
                      min={0}
                      max={100}
                    />
                  </Form.Item>
                </Space>
              </Form>

              {/* Additional Info */}
              <Card size="small" style={{ background: token.colorBgTextHover }}>
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Target Audience
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      {generatedOption.targetAudience}
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Projected Sales
                    </Text>
                    <Text strong style={{ fontSize: 12 }}>
                      {generatedOption.projectedSales} units
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Est. Margin
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 12, color: token.colorSuccess }}
                    >
                      ${generatedOption.margin}
                    </Text>
                  </div>
                </Space>
              </Card>

              {/* Actions */}
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setGeneratedOption(null)}>
                  Generate Again
                </Button>
                <Button type="primary" onClick={handleAdd} size="large">
                  Add This Option
                </Button>
              </Space>
            </Space>
          </Card>
        )}

        {/* Example Prompts */}
        {!generatedOption && !generating && (
          <Card size="small" title="Example Prompts" style={{ marginTop: 8 }}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Try these examples to get started:
              </Text>
              {[
                "Family dinner for 4 people with drinks",
                "$75 couples spa day with massage",
                "Group fitness class pass for 10 sessions",
                "Weekend brunch for two with mimosas",
              ].map((example, index) => (
                <Button
                  key={index}
                  type="text"
                  size="small"
                  onClick={() => setCustomPrompt(example)}
                  style={{
                    textAlign: "left",
                    height: "auto",
                    padding: "4px 8px",
                    whiteSpace: "normal",
                  }}
                >
                  <Text style={{ fontSize: 12, color: token.colorPrimary }}>
                    • {example}
                  </Text>
                </Button>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};

export default CustomOptionBuilder;

