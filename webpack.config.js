const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
 
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 80
//修改allowedHosts
const allowedHosts = ['192.168.100.107']

const sourcePath = path.join(__dirname, './site')
const distPath = path.join(__dirname, './dist')
const htmlTemplate = './index.template.ejs'
const stats = {
  assets: true,
  children: false,
  chunks: false,
  hash: false,
  modules: false,
  publicPath: false,
  timings: true,
  version: false,
  warnings: true,
  colors: {
    green: '\u001b[32m'
  }
}
/**
 * webpack config
 */
module.exports = function (env) {
  const nodeEnv = env && env.production ? 'production' : 'development'
  const isProd = nodeEnv === 'production'
  /**
   * Webpack V3.1 Buiding Informations
   */
  console.log('enviroment:' + nodeEnv)
  console.log('host:' + host)
  console.log('port:' + port)
  console.log('dist path:' + distPath)
  console.log('platform:' + env.platform)
  /**
   * common plugin
   */
  const plugins = [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor' // the name of bundle
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),

    // setting production environment will strip out
    // some of the development code from the app
    // and libraries
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(nodeEnv) }
    }),

    // create css bundle
    new ExtractTextPlugin({filename: isProd ? 'css/[name]-[contenthash].css' : 'css/[name].css', allChunks: true}),

    // create index.html
    new HtmlWebpackPlugin({
      template: htmlTemplate,
      inject: true,
      production: isProd,
      minify: isProd && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    })
    // new InlineManifestWebpackPlugin({
    //   name: 'webpackManifest'
    // }),
    // new InlineChunkManifestHtmlWebpackPlugin()
  ]
  if (isProd) {
    /**
     * production envrioment plugin
     */
    plugins.push(
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CleanWebpackPlugin(['dist']),
      new webpack.HashedModuleIdsPlugin(),
      // minify remove some of the dead code
     new webpack.optimize.UglifyJsPlugin({
       compress: {
         warnings: false,
         screw_ie8: true,
         conditionals: true,
         unused: true,
         comparisons: true,
         sequences: true,
         dead_code: true,
         evaluate: true,
         if_return: true,
         join_vars: true
       },
       mangle: false
     }))
  } else {
    /**
     * development enviroment plugin
     */
    plugins.push(
      // make hot reloading work
      new webpack.HotModuleReplacementPlugin(),
      // show module names instead of numbers in webpack stats
      new webpack.NamedModulesPlugin(),
      // don't spit out any errors in compiled assets
      new webpack.NoEmitOnErrorsPlugin()
     
    )
  }

  return {
    devtool: isProd ? 'source-map' : 'cheap-module-source-map',
    entry: {
      main: ['babel-polyfill', path.join(sourcePath, 'index.js')],
      // static lib
      vendor: ['react', 'react-dom', 'react-router-dom']
    },
    output: {
      filename: isProd ? 'js/[name]-[chunkhash].bundle.js' : 'js/[name].bundle.js',
      chunkFilename: isProd ? 'js/[id]-[chunkhash].bundle.js' : 'js/[id].bundle.js',
      path: distPath,
      publicPath: './'
    },
     // loader
    module: {
      rules: [
      // js or jsx loader
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['es2015', { 'modules': false }], 'react', 'stage-0'],
              cacheDirectory: true,
              // Since babel-plugin-transform-runtime includes a polyfill that includes a custom regenerator runtime and core.js, the following usual shimming method using webpack.ProvidePlugin will not work:
              plugins: [
                ['import', {
                  libraryName: 'antd',
                  style: 'css'
                }]
              ]
            }
          }
        },
      // css loader
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [{
              loader: 'css-loader',
              options: {
                minimize: isProd
              }}],
            publicPath: '/'
          })
        },
      // scss loader
        {
          test: /\.scss$/,
          exclude: /node_modules/,
          use: ExtractTextPlugin.extract({
            publicPath: '/',
            fallback: 'style-loader',
            use: [
              // {loader: 'autoprefixer-loader'},

              {
                loader: 'css-loader',
                options: {
                  // module: true, // css-loader 0.14.5 compatible
                  // modules: true
                  // localIdentName: '[hash:base64:5]'
                  // importLoaders: 1,
                  minimize: isProd
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  // outputStyle: 'collapsed',
                  sourceMap: true,
                  includePaths: [sourcePath, path.join(__dirname, './src')]
                }
              }
            ]
          })
        },
      // images loader
        {
          test: /\.(png|svg|jpg|gif)$/,
          loader: 'url-loader?limit=8024&name=assets/images/[name]-[hash].[ext]'

        },
        {
          test: /\.(woff2?|otf|eot|ttf)$/i,
          loader: 'url-loader?limit=8024&name=assets/fonts/[name].[ext]',
          options: {
            publicPath: distPath
          }
        },
        {
          test: /\.md$/,
          loader: 'raw-loader'
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      modules: [path.resolve(__dirname, 'node_modules'), sourcePath],
      alias: {
        md_components: path.resolve(__dirname, 'src/components'),
        md_midware: path.resolve(__dirname, 'src/md-midware')
      }
    },

    plugins,

    stats,
    // webpack dev server
    devServer: {
      contentBase: path.join(__dirname, 'src'),
      compress: true,
      hot: true,
      port,
      host,
      allowedHosts,
    // disableHostCheck: true,
      noInfo: true,
      overlay: true,
      publicPath: '/',
      proxy: {
        '/': 'http://192.168.11.61:8081/'
      }
    }
  }
}
