module.exports = {
  resolve: {
    alias: {
      vscode: require.resolve('monaco-languageclient/lib/vscode-compatibility')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify')
    }
  }
}