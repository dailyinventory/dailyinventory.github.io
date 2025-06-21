const path = require('path');

// Safely get git commit hash, fallback to 'unknown' if not available
const getGitCommitHash = () => {
  try {
    const gitRevSync = require('git-rev-sync');
    return gitRevSync.short();
  } catch (error) {
    console.warn('Could not get git commit hash:', error.message);
    return 'unknown';
  }
};

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Debug: Log the current working directory and public path
      console.log('Current working directory:', process.cwd());
      console.log('Public folder path:', path.resolve(__dirname, 'public'));
      console.log('Public folder exists:', require('fs').existsSync(path.resolve(__dirname, 'public')));
      
      // Set output directory to 'dist'
      webpackConfig.output.path = path.resolve(__dirname, 'dist');
      
      // Set public path for GitHub Pages
      const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.NODE_ENV === 'production';
      webpackConfig.output.publicPath = isGitHubPages ? '/dailyinventory.github.io/' : '/';
      
      // Add a custom plugin to inject git commit hash
      const { DefinePlugin } = require('webpack');
      webpackConfig.plugins.push(
        new DefinePlugin({
          'process.env.GIT_COMMIT_HASH': JSON.stringify(getGitCommitHash())
        })
      );
      
      return webpackConfig;
    },
  },
}; 