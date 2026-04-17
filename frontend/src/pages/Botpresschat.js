import React, { useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";

const BotpressChat = () => {
  const { user, loading } = useContext(AuthContext);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (loading) return; // Wait until Auth context has fully resolved user state

    const currentUser = user?.email || ''; 
    const lastUser = localStorage.getItem('last_bp_user') || '';

    let didSwap = false;
    
    // Compare current true user to what Botpress is currently configured for
    if (lastUser !== currentUser) {
        const botpressKeys = () => Object.keys(localStorage).filter(k => k.startsWith('bp-') || k.startsWith('botpress'));
        
        if (lastUser) {
           const oldState = {};
           botpressKeys().forEach(k => {
             oldState[k] = localStorage.getItem(k);
             localStorage.removeItem(k);
           });
           localStorage.setItem(`bp_state_${lastUser}`, JSON.stringify(oldState));
        } else {
           // Previous was guest - flush data instantly!
           botpressKeys().forEach(k => localStorage.removeItem(k));
        }

        // Restore new user's state
        if (currentUser) {
           const newStateStr = localStorage.getItem(`bp_state_${currentUser}`);
           if (newStateStr) {
             const newStateObj = JSON.parse(newStateStr);
             Object.keys(newStateObj).forEach(k => {
               localStorage.setItem(k, newStateObj[k]);
             });
           }
        }

        localStorage.setItem('last_bp_user', currentUser);
        didSwap = true;
    }

    const SCRIPT1_ID = "botpress-inject-js";
    const SCRIPT2_ID = "botpress-config-js";

    const loadConfig = () => {
      const oldConfig = document.getElementById(SCRIPT2_ID);
      if (oldConfig) oldConfig.remove();

      const script2 = document.createElement("script");
      script2.id = SCRIPT2_ID;
      script2.src = process.env.REACT_APP_BOTPRESS_CONFIG_JS;
      script2.async = true;
      document.body.appendChild(script2);
    };

    if (didSwap && !isFirstMount.current) {
      // Rebuild Botpress UI seamlessly by removing old widget container
      const widget = document.getElementById('bp-web-widget');
      if (widget) widget.remove();

      // If Botpress is already injected, reload config to rebuild it!
      if (document.getElementById(SCRIPT1_ID) || window.botpress) {
          loadConfig();
      }
    } else {
      // Normal flow if we didn't swap or if it's the very first page load
      let injected1 = !!document.getElementById(SCRIPT1_ID);

      if (!injected1) {
        const script1 = document.createElement("script");
        script1.id = SCRIPT1_ID;
        script1.src = process.env.REACT_APP_BOTPRESS_INJECT_JS;
        script1.async = true;
        script1.onload = () => {
          loadConfig();
        };
        document.body.appendChild(script1);
      } else if (window.botpress || window.botpressWebChat) {
          // If inject is already there, but config isn't or we just swapped on first mount
          if (!document.getElementById(SCRIPT2_ID) || didSwap) {
             loadConfig();
          }
      }
    }
    
    isFirstMount.current = false;

  }, [user, loading]);

  // Clean guest data fully on hard unmount
  useEffect(() => {
    return () => {
      if (!user) {
        const bpStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('bp-') || k.startsWith('botpress'));
        bpStorageKeys.forEach(k => localStorage.removeItem(k));
        const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('bp-') || k.startsWith('botpress'));
        sessionKeys.forEach(k => sessionStorage.removeItem(k));
      }
    };
  }, [user]);

  return <div id="botpress-webchat-container"></div>;
};

export default BotpressChat;
