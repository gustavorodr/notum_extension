const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const targetBrowser = process.env.TARGET || 'chrome';
const manifestSource =
  targetBrowser === 'firefox-mv2'
    ? 'public/manifest.firefox.mv2.json'
    : targetBrowser === 'firefox'
      ? 'public/manifest.firefox.json'
      : 'public/manifest.json';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.ts',
    popup: './src/ui/popup/index.tsx',
    sidepanel: './src/ui/sidepanel/index.tsx',
    'workers/translation': './src/workers/translation.worker.ts',
    'workers/processing': './src/workers/processing.worker.ts',
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.webpack.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/*.html', '**/manifest.json', '**/manifest.firefox.json'],
          },
        },
        {
          from: manifestSource,
          to: 'manifest.json',
        },
      ],
    }),
    
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    
    new HtmlWebpackPlugin({
      template: './public/sidepanel.html',
      filename: 'sidepanel.html',
      chunks: ['sidepanel'],
    }),
    
    ...(isProduction ? [new MiniCssExtractPlugin({
      filename: '[name].css',
    })] : []),
  ],
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};