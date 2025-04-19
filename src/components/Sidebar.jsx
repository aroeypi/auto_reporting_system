import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  MdDashboard,
  MdEdit,
  MdInsertDriveFile,
  MdNotifications,
  MdSettings,
} from 'react-icons/md';

const Sidebar = () => {
  const navigate = useNavigate();

  const icons = [
    { icon: <MdDashboard />, label: 'Dashboard', route: '/' },
    { icon: <MdEdit />, label: 'Edit', route: '/edit' },
    { icon: <MdInsertDriveFile />, label: 'File', route: '/file' },
    { icon: <MdNotifications />, label: 'Alarm', route: '/alarm' },
    { icon: <MdSettings />, label: 'Settings', route: '/settings' },
  ];

  return (
    <div
      style={{
        width: 90,
        height: '100vh',
        background: 'rgba(246, 250, 253, 0.90)',
        borderRight: '1px solid #EAEEF4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        gap: 16,
        position: 'fixed',
        top: 90, // 헤더 아래로
        left: 0,
        zIndex: 100,
      }}
    >
      {icons.map((item, idx) => (
        <button
          key={idx}
          title={item.label}
          onClick={() => navigate(item.route)}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'white',
            border: '1px solid #EAEEF4',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#7E92A2',
            cursor: 'pointer',
          }}
        >
          {React.cloneElement(item.icon, { size: 20 })}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;


