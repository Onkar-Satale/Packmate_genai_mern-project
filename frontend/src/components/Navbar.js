// // import './Navbar.css';
// // import React, { useState, useContext } from 'react';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { AuthContext } from '../context/AuthContext';

// // const Navbar = () => {
// //   const [linkHover, setLinkHover] = useState(null);
// //   const [btnHover, setBtnHover] = useState(null);
// //   const { user, logout } = useContext(AuthContext);
// //   const navigate = useNavigate();

// //   const handleLinkHover = (index, isHovering) => {
// //     setLinkHover(isHovering ? index : null);
// //   };

// //   const handleBtnHover = (btn, isHovering) => {
// //     setBtnHover(isHovering ? btn : null);
// //   };

// //   const handleLogoClick = () => {
// //     if (user) navigate('/account'); // go to account if logged in
// //     else navigate('/login');         // otherwise go to login
// //   };

// //   return (
// //     <div style={styles.navbar}>
// //       <div className="navbar-left" style={styles.logo}>
// //         {/* Only circle is clickable */}
// //         <span
// //           style={styles.avatarCircle}
// //           onClick={handleLogoClick}   // ✅ Clickable circle
// //         >
// //           {user ? user[0].toUpperCase() : ''}
// //         </span>

// //         {/* Website name is not clickable now */}
// //         <span className="website-name" style={{ cursor: 'default' }}>PackMate</span>
// //       </div>


// //       <div className="navbar-center" style={styles.navLinks}>
// //         {['Home', 'How it works', 'Features', 'About Us', 'Contact Us'].map((text, index) => {
// //           const linkTo = text === 'Home' ? '/' : `/${text.toLowerCase().replace(/\s+/g, '-')}`;
// //           return (
// //             <Link
// //               key={index}
// //               to={linkTo}
// //               style={linkHover === index ? styles.linkHovered : styles.link}
// //               onMouseEnter={() => handleLinkHover(index, true)}
// //               onMouseLeave={() => handleLinkHover(index, false)}
// //             >
// //               {text}
// //             </Link>
// //           );
// //         })}
// //       </div>

// //       <div style={{ display: 'flex', gap: '10px' }}>
// //         {!user && (
// //           <>
// //             <Link to="/login">
// //               <button
// //                 style={btnHover === 'login' ? styles.loginButtonHovered : styles.loginButton}
// //                 onMouseEnter={() => handleBtnHover('login', true)}
// //                 onMouseLeave={() => handleBtnHover('login', false)}
// //               >
// //                 Login
// //               </button>
// //             </Link>
// //             <Link to="/signup">
// //               <button
// //                 style={btnHover === 'signup' ? styles.loginButtonHovered : styles.loginButton}
// //                 onMouseEnter={() => handleBtnHover('signup', true)}
// //                 onMouseLeave={() => handleBtnHover('signup', false)}
// //               >
// //                 Sign Up
// //               </button>
// //             </Link>
// //           </>
// //         )}

// //         {user && (
// //           <button
// //             style={btnHover === 'logout' ? styles.loginButtonHovered : styles.loginButton}
// //             onClick={logout}
// //             onMouseEnter={() => handleBtnHover('logout', true)}
// //             onMouseLeave={() => handleBtnHover('logout', false)}
// //           >
// //             Logout
// //           </button>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // const styles = {
// //   navbar: {
// //     display: 'flex',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     margin: '0 20px',
// //     marginTop: '20px',
// //     padding: '20px 30px',
// //     borderRadius: '25px',
// //     border: '1px solid #ccc',
// //     backgroundColor: '#f8f8f8',
// //     position: 'sticky',
// //     top: '0',
// //     zIndex: '1000',
// //   },
// //   logo: { display: 'flex', alignItems: 'center', fontSize: '24px', fontWeight: 'bold', gap: '20px' },
// //   avatarCircle: {
// //     width: '30px',
// //     height: '30px',
// //     borderRadius: '50%',
// //     backgroundColor: 'grey',
// //     color: 'white',
// //     display: 'flex',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     fontSize: '14px',
// //     cursor: 'pointer',          // <-- hand cursor

// //   },
// //   navLinks: { display: 'flex', gap: '20px', marginLeft: '30px' },
// //   link: { fontSize: '20px', fontWeight: '500', cursor: 'pointer', padding: '5px 10px', transition: 'color 0.3s' },
// //   linkHovered: { fontSize: '20px', fontWeight: '500', cursor: 'pointer', padding: '5px 10px', color: 'blue', transition: 'color 0.3s' },
// //   loginButton: { backgroundColor: 'blue', color: 'white', border: 'none', padding: '12px 20px', cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.3s, color 0.3s' },
// //   loginButtonHovered: { backgroundColor: 'white', color: 'blue', border: '1px solid blue', padding: '12px 20px', cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.3s, color 0.3s' },
// // };

// // export default Navbar;

// import './Navbar.css';
// import React, { useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';

// const Navbar = () => {
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const handleLogoClick = () => {
//     user ? navigate('/account') : navigate('/login');
//   };

//   return (
//     <div className="navbar">

//       {/* 🔥 TOP ROW (LOGO + BUTTONS SAME LINE) */}
//       <div className="navbar-top">
//         <div className="navbar-left">
//           <span className="avatar-circle" onClick={handleLogoClick}>
//             {user?.firstName
//               ? user.firstName.charAt(0).toUpperCase()
//               : user?.email
//                 ? user.email.charAt(0).toUpperCase()
//                 : ''}
//           </span>
//           <span className="website-name">PackMate</span>
//         </div>

//         <div className="navbar-right">
//           {!user ? (
//             <>
//               <Link to="/login"><button className="auth-btn">Login</button></Link>
//               <Link to="/signup"><button className="auth-btn">Sign Up</button></Link>
//             </>
//           ) : (
//             <button className="auth-btn" onClick={logout}>Logout</button>
//           )}
//         </div>
//       </div>

//       {/* 🔽 LINKS ROW */}
//       <div className="navbar-center">
//         {['Home', 'How it works', 'Features', 'About Us', 'Contact Us'].map((text, i) => (
//           <Link
//             key={i}
//             to={text === 'Home' ? '/' : `/${text.toLowerCase().replace(/\s+/g, '-')}`}
//             className="nav-link"
//           >
//             {text}
//           </Link>
//         ))}
//       </div>

//     </div>
//   );
// };

// export default Navbar;











import './Navbar.css';
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    user ? navigate('/account') : navigate('/login');
  };

  return (
    <div className="navbar">

      {/* 🔥 TOP ROW (LOGO + BUTTONS SAME LINE) */}
      <div className="navbar-top">
        <div className="navbar-left">
          <span className="avatar-circle" onClick={handleLogoClick}>
            {user?.firstName
              ? user.firstName.charAt(0).toUpperCase()
              : user?.email
                ? user.email.charAt(0).toUpperCase()
                : ''}
          </span>
          <span className="website-name">PackMate</span>
        </div>

        <div className="navbar-right">
          {!user ? (
            <>
              <Link to="/login"><button className="auth-btn">Login</button></Link>
              <Link to="/signup"><button className="auth-btn">Sign Up</button></Link>
            </>
          ) : (
            <button className="auth-btn" onClick={logout}>Logout</button>
          )}
        </div>
      </div>

      {/* 🔽 LINKS ROW */}
      <div className="navbar-center">
        {['Home', 'How it works', 'Features', 'About Us', 'Contact Us'].map((text, i) => (
          <Link
            key={i}
            to={text === 'Home' ? '/' : `/${text.toLowerCase().replace(/\s+/g, '-')}`}
            className="nav-link"
          >
            {text}
          </Link>
        ))}
      </div>

    </div>
  );
};

export default Navbar;
