// Import through `expo`, not "@expo/config-plugins": that package is only a
// transitive dependency and SDK 57 no longer hoists it.
const { withPodfile } = require("expo/config-plugins");

const MODULAR_HEADERS_LINE = "use_modular_headers!";

function addModularHeaders(contents) {
  if (contents.includes(MODULAR_HEADERS_LINE)) {
    return contents;
  }

  const platformMatch = contents.match(/^platform\s+:ios,\s+['"][^'"]+['"].*$/m);
  if (platformMatch?.index !== undefined) {
    const insertAt = platformMatch.index + platformMatch[0].length;
    return [
      contents.slice(0, insertAt),
      `\n${MODULAR_HEADERS_LINE}`,
      contents.slice(insertAt),
    ].join("");
  }

  return `${MODULAR_HEADERS_LINE}\n${contents}`;
}

module.exports = function withIosModularHeaders(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = addModularHeaders(config.modResults.contents);
    return config;
  });
};
