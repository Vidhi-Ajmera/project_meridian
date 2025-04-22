// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.js\.map$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: /node_modules\/monaco-editor/,
      });
      return webpackConfig;
    },
  },
};
