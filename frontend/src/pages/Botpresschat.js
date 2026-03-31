import { useEffect } from "react";

const BotpressChat = () => {
  useEffect(() => {
    const SCRIPT1_ID = "botpress-inject-js";
    const SCRIPT2_ID = "botpress-config-js";

    let injected1 = !!document.getElementById(SCRIPT1_ID);
    let injected2 = !!document.getElementById(SCRIPT2_ID);

    if (!injected1) {
      const script1 = document.createElement("script");
      script1.id = SCRIPT1_ID;
      script1.src = process.env.REACT_APP_BOTPRESS_INJECT_JS || "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
      script1.async = true;
      script1.onload = () => {
        // Only load config AFTER inject script is fully loaded
        if (!document.getElementById(SCRIPT2_ID)) {
          const script2 = document.createElement("script");
          script2.id = SCRIPT2_ID;
          script2.src = process.env.REACT_APP_BOTPRESS_CONFIG_JS || "https://files.bpcontent.cloud/2025/01/30/11/20250130110557-KVB0O0BH.js";
          script2.async = true;
          script2.onerror = (e) => console.error("Failed to load Botpress config script", e);
          document.body.appendChild(script2);
        }
      };
      script1.onerror = (e) => console.error("Failed to load Botpress inject script", e);
      document.body.appendChild(script1);
    } else if (window.botpress) {
        // If inject is already there, check if config needs to be loaded
        if (!injected2) {
          const script2 = document.createElement("script");
          script2.id = SCRIPT2_ID;
          script2.src = process.env.REACT_APP_BOTPRESS_CONFIG_JS || "https://files.bpcontent.cloud/2025/01/30/11/20250130110557-KVB0O0BH.js";
          script2.async = true;
          script2.onerror = (e) => console.error("Failed to load Botpress config script", e);
          document.body.appendChild(script2);
        }
    }

    return () => {
      // Do not remove scripts on unmount to keep chat persistent
    };
  }, []);

  return <div id="botpress-webchat-container"></div>;
};

export default BotpressChat;
