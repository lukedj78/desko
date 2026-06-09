const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// SDK 56: On-demand Filesystem — niente watchFolders manuali per il
// monorepo pnpm; Metro risolve i workspace packages da solo.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
