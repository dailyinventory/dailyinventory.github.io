const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// Function to check if directory exists
const directoryExists = (dirPath) => {
    try {
        return fs.existsSync(dirPath);
    } catch (err) {
        return false;
    }
};

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const iconsDir = path.resolve(__dirname, 'assets/images/icons');
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
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                minimize: isProduction
                            }
                        }
                    ]
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
            new HtmlWebpackPlugin({
                template: './index.html',
                filename: 'index.html',
                inject: true,
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                } : false
            }),
            new MiniCssExtractPlugin({
                filename: 'assets/css/[name].css',
                chunkFilename: 'assets/css/[id].css'
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
                        from: path.resolve(__dirname, 'assets/js/sw.js'),
                        to: path.resolve(__dirname, 'dist/assets/js/sw.js'),
                        noErrorOnMissing: true
                    }
                ]
            })
        ]
    };
}; 