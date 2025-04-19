// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const savedLoginStatus = localStorage.getItem('isLoggedIn');
    const savedUserInfo = localStorage.getItem('user_info');

    if (savedLoginStatus === 'true') {
      setIsLoggedIn(true);
    }
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userInfo, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
