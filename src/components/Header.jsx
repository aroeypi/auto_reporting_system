import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // 경로 확인

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext); // ✅ 로그인 상태 불러오기

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div
      style={{
        height: 90,
        width: '100%',
        background: '#F6FAFD',
        borderBottom: '1px solid #EAEEF4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        paddingRight: 441,
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 90,
        right: 0,
        zIndex: 100,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 24, color: '#092C4C' }}>Dashboard</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/edit')}
          style={{
            padding: '10px 16px',
            background: '#514EF3',
            color: 'white',
            border: 'none',
            borderRadius: 70,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Add New +
        </button>

        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              background: 'white',
              borderRadius: 35,
              border: '1px solid #514EF3',
              color: '#514EF3',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              background: 'white',
              borderRadius: 35,
              border: '1px solid #514EF3',
              color: '#514EF3',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
