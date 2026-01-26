// // import React, { createContext, useState, useEffect } from 'react';

// // export const AuthContext = createContext();

// // export const AuthProvider = ({ children }) => {
// //   const [user, setUser] = useState(null);

// //   // ✅ Load user from localStorage on refresh
// //   useEffect(() => {
// //     const email = localStorage.getItem('email');
// //     const firstName = localStorage.getItem('firstName');
// //     const lastName = localStorage.getItem('lastName');

// //     if (email) {
// //       const storedUser = { email, firstName, lastName };
// //       console.log("AuthContext loaded user:", storedUser); // 👈 debug log
// //       setUser(storedUser);
// //     }
// //   }, []);

// //   // ✅ login now accepts FULL user object
// //   const login = ({ email, firstName, lastName }) => {
// //     const loggedInUser = { email, firstName, lastName };
// //     console.log("AuthContext login user:", loggedInUser); // 👈 debug log
// //     setUser(loggedInUser);

// //     localStorage.setItem('email', email);
// //     localStorage.setItem('firstName', firstName);
// //     localStorage.setItem('lastName', lastName);
// //   };

// //   const logout = () => {
// //     console.log("AuthContext logout user:", user); // 👈 optional debug log
// //     setUser(null);
// //     localStorage.removeItem('email');
// //     localStorage.removeItem('firstName');
// //     localStorage.removeItem('lastName');
// //     localStorage.removeItem('token');
// //   };

// //   return (
// //     <AuthContext.Provider value={{ user, login, logout }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };


// import React, { createContext, useState, useEffect } from 'react';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   // Load user from localStorage on refresh
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const email = localStorage.getItem('email');
//     const firstName = localStorage.getItem('firstName');
//     const lastName = localStorage.getItem('lastName');

//     if (token && email && firstName && lastName) {
//       setUser({ token, email, firstName, lastName });
//     }
//   }, []);

//   // login now expects full user object
//   const login = ({ token, email, firstName, lastName }) => {
//     setUser({ token, email, firstName, lastName });

//     localStorage.setItem('token', token);
//     localStorage.setItem('email', email);
//     localStorage.setItem('firstName', firstName);
//     localStorage.setItem('lastName', lastName);
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('token');
//     localStorage.removeItem('email');
//     localStorage.removeItem('firstName');
//     localStorage.removeItem('lastName');
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on page refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');

    if (token && email && firstName && lastName) {
      setUser({ token, email, firstName, lastName });
    }
  }, []);

  // login expects a full user object
  const login = (userData) => {
    const { token, email, firstName, lastName } = userData;
    setUser({ token, email, firstName, lastName });

    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
