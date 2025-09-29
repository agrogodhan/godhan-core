let ConfigModel;

function initConfig(connection) {
  const schema = new connection.Schema({
    key: { type: String, unique: true },
    value: String,
    type: { type: String, enum: ["string", "number", "boolean"], default: "string" },
    updatedAt: { type: Date, default: Date.now }
  });
  ConfigModel = connection.model("Config", schema, "configs");
}

async function getConfig(key, defaultValue) {
  if (!ConfigModel) throw new Error("Config not initialized");
  const config = await ConfigModel.findOne({ key });
  if (!config) return defaultValue;

  switch (config.type) {
    case "number": return Number(config.value);
    case "boolean": return config.value === "true";
    default: return config.value;
  }
}

module.exports = { initConfig, getConfig };
