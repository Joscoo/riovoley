'use strict';
// Keep CRA's build/Jest configuration; only adapt its development server API.
process.env.NODE_ENV='development';
process.env.BABEL_ENV='development';
process.env.HOST=process.env.HOST||'127.0.0.1';
require('react-scripts/config/env');
const {adaptDevServerConfig,installCraLifecycleCompatibility,adaptWebpackConfig}=require('./dev-server-config.cjs');
const factoryPath=require.resolve('react-scripts/config/webpackDevServer.config');
const originalFactory=require(factoryPath);
require.cache[factoryPath].exports=(...args)=>adaptDevServerConfig(originalFactory(...args),{host:process.env.HOST,port:Number(process.env.PORT)||3000});
const webpackPath=require.resolve('react-scripts/config/webpack.config');
const originalWebpackFactory=require(webpackPath);
require.cache[webpackPath].exports=(...args)=>adaptWebpackConfig(originalWebpackFactory(...args));
installCraLifecycleCompatibility(require('webpack-dev-server'));
require('react-scripts/scripts/start');
