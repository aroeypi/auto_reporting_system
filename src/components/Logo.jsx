// src/components/Logo.jsx
import React from 'react';

const Logo = () => {
  return (
    <div style={{
      height: 90,
      background: '#F6FAFD',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: '1px solid #EAEEF4'
    }}>
      <div style={{ width: 46, height: 46, background: '#092C4C', borderRadius: 4 }} />
    </div>
  );
};

export default Logo;
