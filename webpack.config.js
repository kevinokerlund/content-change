var path = require('path');
var webpack = require('webpack');

module.exports = {
	entry: './src/content-change.js',
	devtool: 'source-map',
	output: {
		path: './lib',
		filename: 'content-change.min.js',
		library: 'ContentChange',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		loaders: [
			{
				loader: 'babel',
				test: /\.js$/,
				exclude: /node_modules/,
				query: {
					presets: ['es2015'],
					plugins: ['babel-plugin-add-module-exports']
				}
			}
		]
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
			},
			output: {
				comments: false,
			},
		}),
	]
};
