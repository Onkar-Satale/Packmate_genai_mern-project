import React, { useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const getBpKeys = (storage) => Object.keys(storage).filter(k => k.startsWith('bp-') || k.startsWith('botpress'));

const clearBotpressStorage = () => {
  getBpKeys(localStorage).forEach(k => localStorage.removeItem(k));
  getBpKeys(sessionStorage).forEach(k => sessionStorage.removeItem(k));
};

const saveUserState = (email) => {
  if (!email) return;
  const state = { local: {}, session: {} };
  getBpKeys(localStorage).forEach(k => {
    state.local[k] = localStorage.getItem(k);
  });
  getBpKeys(sessionStorage).forEach(k => {
    state.session[k] = sessionStorage.getItem(k);
  });
  localStorage.setItem(`bp_state_${email}`, JSON.stringify(state));
};

const loadUserState = (email) => {
  if (!email) return;
  const stateStr = localStorage.getItem(`bp_state_${email}`);
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr);
      if (state.local) {
        Object.keys(state.local).forEach(k => localStorage.setItem(k, state.local[k]));
      } else {
        // legacy fallback from old backups
        Object.keys(state).forEach(k => localStorage.setItem(k, state[k]));
      }
      if (state.session) {
        Object.keys(state.session).forEach(k => sessionStorage.setItem(k, state.session[k]));
      }
    } catch (e) {
      console.error('Error parsing botpress state', e);
    }
  }
};

const BotpressChat = () => {
  const { user, loading } = useContext(AuthContext);
  const initialized = useRef(false);
  const location = useLocation();

  // 🖱️ Hide chat bot if clicking outside
  useEffect(() => {
    let hideAttempts = 0;

    // Aggressive hide function targeting both standard APIs and iframe postMessages
    const forceHideBot = () => {
      try {
        window.postMessage({ action: "hide", type: "botpress-webchat" }, "*");
        if (window.botpressWebChat && typeof window.botpressWebChat.sendEvent === 'function') {
          if (window.botpressWebChat?.isOpen?.()) {
            window.botpressWebChat.toggle();
          }
        }
        if (window.botpress) {
          if (typeof window.botpress.sendEvent === 'function') window.botpress.sendEvent({ type: "hide" });
          if (typeof window.botpress.close === 'function') window.botpress.close();
        }
      } catch (err) { }
    };

    const handleClickOutside = (e) => {
      forceHideBot();
    };

    // Capture phase (true) prevents event.stopPropagation() on elements from blocking the hide logic
    document.addEventListener("click", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, []);

  // Control Visibility strictly based on Authentication Routing
  useEffect(() => {
    const widget = document.getElementById("bp-web-widget") || document.getElementById("botpress-webchat");
    if (widget) {
      if (location.pathname === "/login" || location.pathname === "/signup") {
        widget.style.display = "none";
        try {
          window.postMessage({ action: "hide", type: "botpress-webchat" }, "*");
          if (window.botpress) window.botpress.close?.();
          if (window.botpressWebChat) window.botpressWebChat.sendEvent?.({ type: "hide" });
        } catch (e) { }
      } else {
        widget.style.display = "block";
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;

    const currentUser = user?.email || "";
    const lastUserRaw = localStorage.getItem("last_bp_user");
    const lastUser = lastUserRaw !== null ? lastUserRaw : "";

    let needsReinit = false;

    // Handle user change context
    if (lastUser !== currentUser) {
      if (lastUser) saveUserState(lastUser);
      clearBotpressStorage();
      if (currentUser) loadUserState(currentUser);
      localStorage.setItem("last_bp_user", currentUser);
      needsReinit = true;
    } else if (!initialized.current && !currentUser) {
      // Guest refresh scenario
      clearBotpressStorage();
      needsReinit = true;
    }

    const SCRIPT1_ID = "botpress-inject-js";
    const SCRIPT2_ID = "botpress-config-js";

    const loadBotpress = () => {
      // Complete teardown of active iframe and scripts
      const oldConfig = document.getElementById(SCRIPT2_ID);
      if (oldConfig) oldConfig.remove();

      const oldInject = document.getElementById(SCRIPT1_ID);
      if (oldInject) oldInject.remove();

      const widget = document.getElementById("bp-web-widget");
      if (widget) widget.remove();

      // Clear memory bindings to guarantee fresh state rendering
      delete window.botpressWebChat;
      delete window.botpress;

      // Pipeline re-injection
      const script1 = document.createElement("script");
      script1.id = SCRIPT1_ID;
      script1.src = process.env.REACT_APP_BOTPRESS_INJECT_JS;
      script1.async = true;
      script1.onload = () => {
        const script2 = document.createElement("script");
        script2.id = SCRIPT2_ID;
        script2.src = process.env.REACT_APP_BOTPRESS_CONFIG_JS;
        script2.async = true;
        script2.onload = () => {
          // Aggressively attempt to close botpress window locally off-screen automatically after initialize
          setTimeout(() => {
            try {
              window.postMessage({ action: "hide", type: "botpress-webchat" }, "*");
              if (window.botpress) window.botpress.close?.();
            } catch (e) { }
          }, 800);
        };
        document.body.appendChild(script2);
      };
      document.body.appendChild(script1);
    };

    if (needsReinit || !initialized.current) {
      loadBotpress();
    }

    initialized.current = true;

  }, [user, loading]);

  return <div id="botpress-webchat-container"></div>;
};

export default BotpressChat;
