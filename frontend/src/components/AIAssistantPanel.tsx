import React, { useState } from 'react';
import { Input, Button, Space, Typography, theme, message } from 'antd';
import { Sparkles, Send } from 'lucide-react';

const { Text } = Typography;
const { useToken } = theme;

interface AIAssistantPanelProps {
  context?: {
    dealId?: string;
    dealTitle?: string;
    merchant?: string;
    category?: string;
    [key: string]: any;
  };
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ context }) => {
  const { token } = useToken();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;

    const userMessage = aiPrompt.trim();
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      // Call the AI API endpoint
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          conversationHistory: aiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI response');
      }

      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again or check your connection.' 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAISubmit();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
    }}>
      {/* Chat Messages */}
      {aiMessages.length > 0 ? (
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: token.paddingLG,
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {aiMessages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? token.colorPrimaryBg : token.colorBgTextHover,
                  border: `1px solid ${msg.role === 'user' ? token.colorPrimaryBorder : token.colorBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {msg.role === 'assistant' && <Sparkles size={14} style={{ color: token.colorPrimary }} />}
                  <Text strong style={{ fontSize: 12 }}>
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </Text>
                </div>
                <Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
              </div>
            ))}
            {aiLoading && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: token.colorBgTextHover,
                border: `1px solid ${token.colorBorder}`,
              }}>
                <Space size="small">
                  <Sparkles size={14} style={{ color: token.colorPrimary }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>AI is thinking...</Text>
                </Space>
              </div>
            )}
          </Space>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: token.paddingLG,
          textAlign: 'center',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: token.colorPrimaryBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: token.marginLG,
          }}>
            <Sparkles size={32} style={{ color: token.colorPrimary }} />
          </div>
          <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>
            AI Assistant
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Ask me anything about deals, pricing, content,<br />
            categories, or get help with your work
          </Text>
        </div>
      )}
      
      {/* Fixed Input Area */}
      <div style={{
        borderTop: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        padding: token.paddingLG,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Input.TextArea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AI anything... (Press Enter to send)"
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ 
              fontSize: 13,
              flex: 1,
            }}
          />
          <Button 
            type="primary"
            icon={<Send size={16} />}
            onClick={handleAISubmit}
            loading={aiLoading}
            disabled={!aiPrompt.trim()}
            size="large"
            style={{
              height: 'auto',
              minHeight: 40,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;







