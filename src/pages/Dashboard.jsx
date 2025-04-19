import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 예시 콘텐츠 */}
      <div style={{

        marginTop: 90,
        background: '#514EF3',
        borderRadius: 12,
        padding: 24,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        width: '100%',
        maxWidth: 600,
      }}>
        Welcome to your Dashboard ✨
      </div>

      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: 600,
        fontSize: 16,
        color: '#092C4C'
      }}>
        📊 You can add your widgets, summaries, recent activity, etc. here!
      </div>
    </div>
  );
};

export default Dashboard;
