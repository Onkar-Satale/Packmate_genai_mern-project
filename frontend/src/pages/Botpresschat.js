import { useEffect } from "react";

const BotpressChat = () => {
  useEffect(() => {
    // Inject Botpress Webchat script dynamically
    const script1 = document.createElement("script");
    script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement("script");
    script2.src = "https://files.bpcontent.cloud/2025/01/30/11/20250130110557-KVB0O0BH.js"; 
    script2.async = true;
    document.body.appendChild(script2);

    script1.onload = () => {
      if (window.botpressWebChat) {
        window.botpressWebChat.init({
          botId: "de44be2c-3d50-4adb-a5d1-94ac064a7381",  // Replace with your actual Botpress bot ID
          host: "https://cdn.botpress.cloud/webchat",
          stylesheet: "https://your-custom-style.css",  // Optional custom stylesheet
          theme: {
            color: "#0066ff",  // Ensure a valid color is defined
            background: "#ffffff",
            fontColor: "#000000"
          },
          useSessionStorage: true
        });
      }
    };

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  return <div id="botpress-webchat-container"></div>;
};

export default BotpressChat;
