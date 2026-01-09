import React from 'react';
import { Button, Space, Typography, Flex } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

// Google SVG logo component
const GoogleLogo: React.FC = () => (
  <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
    <title>Google logo</title>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Groupon IQ Logo component
const GrouponIQLogo: React.FC = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="200" height="200" rx="48" fill="#007C1F" />
    <g filter="url(#filter0_d_4003_644)">
      <path
        d="M110.866 106.75H128.613L135.022 114.756L145.868 127.009L160 144H139.788L129.764 132.4L123.026 122.761L110.866 106.75ZM159.836 95.9677C159.836 105.28 158.014 113.136 154.372 119.535C150.729 125.906 145.813 130.739 139.623 134.034C133.434 137.302 126.532 138.935 118.918 138.935C111.249 138.935 104.32 137.288 98.1303 133.993C91.9679 130.671 87.0655 125.825 83.4228 119.453C79.8076 113.054 78 105.226 78 95.9677C78 86.6553 79.8076 78.8133 83.4228 72.4417C87.0655 66.0428 91.9679 61.2096 98.1303 57.9421C104.32 54.6474 111.249 53 118.918 53C126.532 53 133.434 54.6474 139.623 57.9421C145.813 61.2096 150.729 66.0428 154.372 72.4417C158.014 78.8133 159.836 86.6553 159.836 95.9677ZM136.337 95.9677C136.337 90.9575 135.666 86.737 134.324 83.3061C133.009 79.848 131.051 77.234 128.449 75.4641C125.874 73.667 122.697 72.7684 118.918 72.7684C115.138 72.7684 111.948 73.667 109.346 75.4641C106.771 77.234 104.813 79.848 103.471 83.3061C102.156 86.737 101.499 90.9575 101.499 95.9677C101.499 100.978 102.156 105.212 103.471 108.67C104.813 112.101 106.771 114.715 109.346 116.512C111.948 118.282 115.138 119.167 118.918 119.167C122.697 119.167 125.874 118.282 128.449 116.512C131.051 114.715 133.009 112.101 134.324 108.67C135.666 105.212 136.337 100.978 136.337 95.9677Z"
        fill="white"
      />
      <path d="M73.3171 53.1738V139.061H50V53.1738H73.3171Z" fill="white" />
    </g>
    <defs>
      <filter
        id="filter0_d_4003_644"
        x="26"
        y="33"
        width="158"
        height="139"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="12" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.0486719 0 0 0 0 0.444543 0 0 0 0 0.14764 0 0 0 1 0"
        />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4003_644" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4003_644" result="shape" />
      </filter>
    </defs>
  </svg>
);

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        padding: '16px',
      }}
    >
      <Space direction="vertical" size="large" align="center" style={{ maxWidth: '448px', width: '100%' }}>
        <GrouponIQLogo />
        
        <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
          Groupon IQ: Testing Deal Creation Designs
        </Title>

        <Button
          size="large"
          onClick={signInWithGoogle}
          icon={<GoogleLogo />}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
          }}
        >
          Continue with Google
        </Button>
      </Space>
    </Flex>
  );
};

export default LoginPage;

