const path = require('path');
const gitRevSync = require('git-rev-sync');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Set output directory to 'dist'
      webpackConfig.output.path = path.resolve(__dirname, 'dist');
      webpackConfig.output.publicPath = '/';
      
      // Customize the output path for JS files
      webpackConfig.output.filename = 'assets/js/[name].[contenthash:8].js';
      webpackConfig.output.chunkFilename = 'assets/js/[name].[contenthash:8].chunk.js';
      
      // Find and modify the MiniCssExtractPlugin configuration
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.filename = 'assets/css/[name].[contenthash:8].css';
        miniCssExtractPlugin.options.chunkFilename = 'assets/css/[name].[contenthash:8].chunk.css';
      }

      // Add a custom plugin to inject git commit hash
      const { DefinePlugin } = require('webpack');
      webpackConfig.plugins.push(
        new DefinePlugin({
          'process.env.GIT_COMMIT_HASH': JSON.stringify(gitRevSync.short())
        })
      );
      
      return webpackConfig;
    },
  },
}; 