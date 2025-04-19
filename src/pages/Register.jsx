// src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    department: '마케팅부',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 로컬 저장소 및 컨텍스트에 저장
    localStorage.setItem('user_info', JSON.stringify(form));
    localStorage.setItem('isLoggedIn', 'true');

    setUserInfo(form);
    setIsLoggedIn(true);

    console.log('회원가입 완료:', form);
    navigate('/');
  };

  return (
    <div
      style={{
        marginTop: 90,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#F6FAFD',
        minHeight: 'calc(100vh - 90px)',
        padding: '40px 20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: 'white',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ color: '#092C4C', marginBottom: 0 }}>회원가입</h2>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="김"
              style={{ ...inputStyle }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="눈송"
              style={{ ...inputStyle }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="noonsong@sookmyung.ac.kr"
              style={{ ...inputStyle }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1111-1111"
              style={{ ...inputStyle }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Department</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="부서를 입력하세요"
            style={{ ...inputStyle }}
          />
        </div>

        <div>
          <label style={labelStyle}>ID</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="아이디 입력"
            style={{ ...inputStyle }}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호 입력"
            style={{ ...inputStyle }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            background: '#514EF3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: 12,
          }}
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

const labelStyle = {
  color: '#092C4C',
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 8,
  display: 'block',
};

const inputStyle = {
  padding: '10px 20px',
  borderRadius: 8,
  background: '#EEF6FB',
  border: '1px solid #EAEEF4',
  fontSize: 16,
  color: '#092C4C',
  outline: 'none',
  width: '100%',
  maxWidth: '200px',
};

export default Register;

