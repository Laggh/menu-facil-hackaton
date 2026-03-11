const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Permite que o Metro observe arquivos fora da pasta do projeto (shared/)
config.watchFolders = [path.resolve(__dirname, '../shared')];

// Resolve @shared/types diretamente para a pasta shared
config.resolver.extraNodeModules = {
  '@shared/types': path.resolve(__dirname, '../shared'),
};

module.exports = config;
