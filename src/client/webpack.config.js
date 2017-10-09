const path                = require('path');
const CleanWebpackPlugin  = require('clean-webpack-plugin');
const HtmlWebpackPlugin   = require('html-webpack-plugin');
const CopyWebpackPlugin   = require('copy-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

const config = {
    entry: {
        app: './src/app.js'
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        host: '0.0.0.0',
        port: 5005,
        disableHostCheck: true
    },
    plugins: [
        new CleanWebpackPlugin(['dist/*']),
        new CopyWebpackPlugin([
            { from: 'node_modules/bootstrap/dist/css', to: 'css/' },
            { from: 'node_modules/bootstrap/dist/fonts', to: 'fonts/' },
            { from: 'node_modules/oidc-client/dist/oidc-client.min.js' }
        ]),
        new HtmlWebpackPlugin({
            title: 'Javascript OIDC Client',
            template: 'src/index.ejs'
        }),
        new HtmlWebpackPlugin({
            filename: 'callback.html',
            template: 'src/callback.ejs',
            inject: false
        }),
        new HtmlWebpackPlugin({
            filename: 'silent.html',
            template: 'src/silent.ejs',
            inject: false
        }),
        new HtmlWebpackPlugin({
            filename: 'popup.html',
            template: 'src/popup.ejs',
            inject: false
        }),
        new HtmlWebpackIncludeAssetsPlugin({
            assets: ['css/bootstrap.min.css', 'css/bootstrap-theme.min.css', 'oidc-client.min.js'],
            append: false
        })
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    }
};

module.exports = config;
