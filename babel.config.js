module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated v4 still needs this plugin for workletization; it must be last.
    plugins: ["react-native-reanimated/plugin"],
  };
};
