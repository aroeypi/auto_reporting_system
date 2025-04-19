import React from 'react';

const Rightbar = () => {
  return (
    <div
      style={{
        width: 417,
        background: 'rgba(238, 245, 251, 0.90)',
        position: 'fixed',
        top: 90,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '24px 24px 0 24px',
        borderLeft: '1px solid #EAEEF4',
      }}
    >
      {/* 상단 버튼들 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button style={{
          padding: '10px 16px',
          background: '#514EF3',
          color: 'white',
          borderRadius: 70,
          border: 'none',
          fontSize: 14,
          fontWeight: 500,
        }}>Add New +</button>

        <button style={{
          width: 50,
          height: 50,
          background: 'white',
          borderRadius: '50%',
          border: '1px solid #EAEEF4',
        }}>
          🔍
        </button>

        <div style={{ color: '#514EF3', fontWeight: 500, fontSize: 14 }}>LOGIN</div>
      </div>

      {/* Our Team */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 78 }}>
          <div style={{ fontSize: 18, fontWeight: '700', color: '#092C4C' }}>Our team</div>
          <div style={{ fontSize: 14, fontWeight: '500', color: '#514EF3' }}>View All</div>
        </div>

        <div style={{ background: '#EEF6FB', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 24, height: 24, background: '#7E92A2', borderRadius: 4 }}></div>
            <div style={{ color: '#7E92A2', fontSize: 14 }}>No customers found.</div>
          </div>
        </div>
      </div>

      {/* Tasks To Do */}
      <div style={{ marginTop: 24, background: '#F6FAFD', borderRadius: 12, border: '1px solid #EAEEF4', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: '700', color: '#092C4C' }}>Tasks To Do</div>
          <div style={{ fontSize: 14, fontWeight: '500', color: '#514EF3' }}>View All</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 24, height: 24, background: '#7E92A2', borderRadius: 4 }}></div>
          <div style={{ fontSize: 14, color: '#7E92A2' }}>No upcoming tasks found.</div>
        </div>

        <div style={{
          background: 'white',
          height: 62,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderTop: '1px solid #EAEEF4'
        }}>
          <div style={{ fontSize: 16, color: '#7E92A2' }}>Add new task</div>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#F6FAFD',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            ➕
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rightbar;
