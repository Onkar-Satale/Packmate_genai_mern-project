import { useEffect } from "react";

const BotpressChat = () => {
  useEffect(() => {
    const SCRIPT1_ID = "botpress-inject-js";
    const SCRIPT2_ID = "botpress-config-js";

    let injected1 = !!document.getElementById(SCRIPT1_ID);
    let injected2 = !!document.getElementById(SCRIPT2_ID);

    let script1Loaded = injected1;
    let script2Loaded = injected2;

    const initChat = () => {
      if (
        script1Loaded &&
        script2Loaded &&
        window.botpressWebChat &&
        !window.botpressWebChat.__initialized
      ) {
        window.botpressWebChat.init({
          botId: process.env.REACT_APP_BOTPRESS_BOT_ID || "de44be2c-3d50-4adb-a5d1-94ac064a7381",
          host: process.env.REACT_APP_BOTPRESS_HOST || "https://cdn.botpress.cloud/webchat",
          // stylesheet property removed since it was invalid/unused
          theme: {
            color: "#0066ff",
            background: "#ffffff",
            fontColor: "#000000"
          },
          useSessionStorage: true
        });
        window.botpressWebChat.__initialized = true;
      }
    };

    if (!injected1) {
      const script1 = document.createElement("script");
      script1.id = SCRIPT1_ID;
      script1.src = process.env.REACT_APP_BOTPRESS_INJECT_JS || "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
      script1.async = true;
      script1.onload = () => {
        script1Loaded = true;
        initChat();
      };
      script1.onerror = (e) => console.error("Failed to load Botpress inject script", e);
      document.body.appendChild(script1);
    }

    if (!injected2) {
      const script2 = document.createElement("script");
      script2.id = SCRIPT2_ID;
      script2.src = process.env.REACT_APP_BOTPRESS_CONFIG_JS || "https://files.bpcontent.cloud/2025/01/30/11/20250130110557-KVB0O0BH.js";
      script2.async = true;
      script2.onload = () => {
        script2Loaded = true;
        initChat();
      };
      script2.onerror = (e) => console.error("Failed to load Botpress config script", e);
      document.body.appendChild(script2);
    }

    // Call init anyway just in case both scripts already existed and fired their load events previously
    if (injected1 && injected2) {
      initChat();
    }

    return () => {
      // Do not remove scripts on unmount to keep chat persistent
    };
  }, []);

  return <div id="botpress-webchat-container"></div>;
};

export default BotpressChat;
