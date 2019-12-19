// ie8 构建
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        targets: {
          ie: '8',
        },
        modules: false,
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: true,
      },
    ],
  ],
}
