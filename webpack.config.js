const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');
const gitRevSync = require('git-rev-sync');

// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const imagesDir = path.resolve(__dirname, 'assets/images');

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            app: [
                // Core dependencies
                'jquery',
                'jquery-ui',
                'bootstrap',
                'chart.js',
                'dayjs',
                // Styles
                'bootstrap/dist/css/bootstrap.min.css',
                './assets/css/jquery-ui.css',
                '@fortawesome/fontawesome-free/css/all.min.css',
                './assets/css/styles.css',
                // Main application
                './assets/js/script.js'
            ]
        },
        output: {
            filename: 'assets/js/[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            publicPath: isGitHubPages ? '/dailyinventory.github.io/' : '/'
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
                publicPath: '/'
            },
            compress: true,
            port: 8080,
            hot: true,
            watchFiles: ['src/**/*', 'assets/**/*', 'index.html'],
            historyApiFallback: true,
            headers: {
                'X-Content-Type-Options': 'nosniff'
            }
        },
        resolve: {
            extensions: ['.js'],
            alias: {
                dayjs: path.resolve(__dirname, 'node_modules/dayjs'),
                'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui')
            }
        },
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                        compress: {
                            drop_console: isProduction,
                        },
                    },
                    extractComments: false,
                }),
                // new CssMinimizerPlugin(),  // Temporarily disabled
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        filename: 'assets/js/vendors.bundle.js'
                    },
                    styles: {
                        name: 'app',
                        test: /\.css$/,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            },
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader'
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/fonts/[name][ext]'
                    }
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery'
            }),
            new MiniCssExtractPlugin({
                filename: 'assets/css/[name].bundle.css',
                chunkFilename: 'assets/css/[id].bundle.css'
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: imagesDir,
                        to: path.resolve(__dirname, 'dist/assets/images'),
                        globOptions: {
                            ignore: ['**/.DS_Store']
                        },
                        noErrorOnMissing: true
                    },
                    {
                        from: path.resolve(__dirname, 'manifest.json'),
                        to: path.resolve(__dirname, 'dist/manifest.json'),
                        noErrorOnMissing: true
                    },
                    {
                        from: path.resolve(__dirname, 'index.html'),
                        to: path.resolve(__dirname, 'dist/index.html'),
                        noErrorOnMissing: true,
                        transform(content) {
                            try {
                                console.log('Getting Git commit hash...');
                                const commitId = gitRevSync.short();
                                console.log('Commit hash:', commitId);
                                const html = content.toString();
                                const modifiedHtml = html.replace(
                                    '</body>',
                                    `<div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">Build: ${commitId}</div></body>`
                                );
                                console.log('HTML modified successfully');
                                return modifiedHtml;
                            } catch (error) {
                                console.error('Error in transform function:', error);
                                return content;
                            }
                        }
                    }
                ]
            })
        ]
    };
}; 