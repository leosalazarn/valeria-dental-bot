// Logger module — centralized console output with emoji prefixes
const log = {
  incoming: (phone, text) => {
    console.log(`📩 [${phone}]: ${text.substring(0, 60)}...`);
  },

  outgoing: (phone, text) => {
    console.log(`✉️ Valeria → [${phone}]: ${text.substring(0, 60)}...`);
  },

  lead: (intentJson) => {
    console.log(`📊 LEAD:`, JSON.stringify(intentJson, null, 2));
  },

  trigger: (phone, triggerMessage) => {
    console.log(`🎯 Trigger detected: "${triggerMessage}"`);
  },

  error: (context, error) => {
    console.error(`❌ ${context}:`, error?.message || error);
  },

  warn: (context, msg) => {
    console.warn(`⚠️ ${context}:`, msg);
  },

  info: (msg) => {
    console.log(`ℹ️ ${msg}`);
  },

  success: (msg) => {
    console.log(`✅ ${msg}`);
  },

  reengagement: (phone) => {
    console.log(`⏰ Reengagement sent to ${phone}`);
  },

  groupIgnored: (phone) => {
    console.log(`🚫 Ignoring group message from ${phone}`);
  },

  supplierResponse: (phone) => {
    console.log(`🏢 Supplier response sent to ${phone}`);
  },
};

export default log;

