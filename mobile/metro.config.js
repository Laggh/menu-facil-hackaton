const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);
const sharedPath = path.resolve(__dirname, '../shared');

// Em ambiente local, permite observar a pasta shared do monorepo.
if (fs.existsSync(sharedPath)) {
  config.watchFolders = [sharedPath];

  // Resolve @shared/types diretamente para a pasta shared durante desenvolvimento.
  config.resolver.extraNodeModules = {
    '@shared/types': sharedPath,
  };
}

module.exports = config;
