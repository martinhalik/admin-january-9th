import React from 'react';
import { Space, Typography, Avatar, Button, Card, Divider, theme } from 'antd';
import { Mail, Calendar, MessageSquare, Video, Phone, MapPin, Clock } from 'lucide-react';

const { Text, Title } = Typography;
const { useToken } = theme;

interface PersonDetailContentProps {
  person: {
    id: string;
    name: string;
    title: string;
    role: string;
    avatar: string;
    initials: string;
    color: string;
    email?: string;
    phone?: string;
    location?: string;
    timezone?: string;
    localTime?: string;
    managers?: Array<{
      id: string;
      name: string;
      title: string;
      avatar?: string;
      initials: string;
      color: string;
    }>;
    reports?: Array<{
      id: string;
      name: string;
      title: string;
      avatar?: string;
      initials: string;
      color: string;
    }>;
  };
  onPersonClick?: (personId: string) => void;
}

const PersonDetailContent: React.FC<PersonDetailContentProps> = ({ person, onPersonClick }) => {
  const { token } = useToken();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <div style={{ padding: token.paddingLG }}>
        <div style={{ textAlign: 'center', marginBottom: token.marginLG }}>
          <Avatar
            size={80}
            style={{
              background: person.color,
              fontSize: 32,
              fontWeight: 600,
              marginBottom: token.marginMD,
            }}
          >
            {person.initials}
          </Avatar>
          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
            {person.name}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {person.title}
          </Text>
          {person.role && (
            <>
              <Text type="secondary" style={{ fontSize: 13 }}> • </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {person.role}
              </Text>
            </>
          )}
        </div>

        {/* Local Time */}
        {person.localTime && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: token.colorBgTextHover,
              borderRadius: 20,
              marginBottom: token.marginLG,
            }}
          >
            <Clock size={14} color={token.colorTextSecondary} />
            <Text style={{ fontSize: 12 }}>
              Local time - {person.localTime} {person.timezone}
            </Text>
          </div>
        )}

        {/* Quick Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: token.marginLG,
          }}
        >
          <Button
            type="text"
            icon={<Mail size={20} />}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: token.colorPrimaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => person.email && window.location.assign(`mailto:${person.email}`)}
          />
          <Button
            type="text"
            icon={<Calendar size={20} />}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: token.colorPrimaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Button
            type="text"
            icon={<MessageSquare size={20} />}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: token.colorPrimaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Button
            type="text"
            icon={<Video size={20} />}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: token.colorPrimaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: token.paddingLG }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Contact Details */}
          <div>
            <Title level={5} style={{ fontSize: 14, marginBottom: token.marginMD }}>
              Contact details
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {person.email && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Mail size={18} color={token.colorTextSecondary} style={{ marginTop: 2 }} />
                  <div>
                    <a href={`mailto:${person.email}`} style={{ fontSize: 14 }}>
                      {person.email}
                    </a>
                  </div>
                </div>
              )}
              {person.phone && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Phone size={18} color={token.colorTextSecondary} style={{ marginTop: 2 }} />
                  <div>
                    <a href={`tel:${person.phone}`} style={{ fontSize: 14 }}>
                      {person.phone}
                    </a>
                  </div>
                </div>
              )}
              {person.location && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <MapPin size={18} color={token.colorTextSecondary} style={{ marginTop: 2 }} />
                  <div>
                    <Text style={{ fontSize: 14 }}>{person.location}</Text>
                    <div style={{ fontSize: 12, color: token.colorTextTertiary }}>Work</div>
                  </div>
                </div>
              )}
            </Space>
          </div>

          {/* Managers */}
          {person.managers && person.managers.length > 0 && (
            <div>
              <Title level={5} style={{ fontSize: 14, marginBottom: token.marginMD }}>
                Managers
              </Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {person.managers.map((manager) => (
                  <Card
                    key={manager.id}
                    size="small"
                    hoverable
                    onClick={() => onPersonClick?.(manager.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar size={40} style={{ background: manager.color }}>
                        {manager.initials}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {manager.name}
                        </Text>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          {manager.title}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          {/* Reports */}
          {person.reports && person.reports.length > 0 && (
            <div>
              <Title level={5} style={{ fontSize: 14, marginBottom: token.marginMD }}>
                Reports
              </Title>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                {person.reports.length} Direct reports
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {person.reports.map((report) => (
                  <div
                    key={report.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      cursor: 'pointer',
                    }}
                    onClick={() => onPersonClick?.(report.id)}
                  >
                    <Avatar size={32} style={{ background: report.color }}>
                      {report.initials}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {report.name}
                      </Text>
                      <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        {report.title}
                      </div>
                    </div>
                  </div>
                ))}
              </Space>
            </div>
          )}
        </Space>
      </div>
    </div>
  );
};

export default PersonDetailContent;







