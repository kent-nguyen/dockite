/* eslint-disable */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');
const config = require('@dockite/webpack');

const {getDockiteConfig, omitSensitiveValues} = require('./src/utils/_webpack/getDockiteConfig');

module.exports = {
  ...config,
  entry: {
    main: path.resolve(__dirname, './src/main.ts'),
  },
  output: {
    filename: '[name].[hash].bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  externals: {},
  plugins: [
    ...config.plugins,
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './src/public/index.html'),
    }),
    new DefinePlugin({
      DOCKITE_CONFIG: JSON.stringify(getDockiteConfig(), omitSensitiveValues),
      __DEV__: JSON.stringify(config.mode === 'development')
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
