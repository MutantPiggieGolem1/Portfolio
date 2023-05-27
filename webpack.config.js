import { resolve as _resolve } from 'path';
import { realpathSync } from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
const appDirectory = realpathSync(process.cwd());

export default {
  entry: './src/app.ts',
  output: {
    path: _resolve(appDirectory, "dist"),
    filename: 'bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.png/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  },
  devServer: {
    host: "127.0.0.1",
    port: 80,
    static: _resolve(appDirectory, "public"), //tells webpack to serve from the public folder
    hot: true,
    devMiddleware: {
      publicPath: "/",
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: _resolve(appDirectory, "public/index.html"),
    })
  ],
  mode: "development"
};