import { resolve } from 'path';
import { realpathSync } from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from 'copy-webpack-plugin';
const appDirectory = realpathSync(process.cwd());

export default {
  entry: './src/app.ts',
  output: {
    path: resolve(appDirectory, "dist"),
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
      '.ts',
      '.js'
    ]
  },
  devServer: {
    host: "127.0.0.1",
    port: 80,
    static: resolve(appDirectory, "public"),
    hot: true,
    client: {
      progress: true,
      logging: "warn"
    },
    devMiddleware: {
      publicPath: "/"
    },
    watchFiles: {
      paths: ["/src/*.ts"],
      options: {
        usePolling: false,
        awaitWriteFinish: true
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: resolve(appDirectory, "public/index.html"),
    }),
    new CopyPlugin({
      patterns: [
        { from: "public/textures", to: "textures" }
      ],
    }),
  ],
  devtool: "eval-cheap-module-source-map",
  mode: "development"
};