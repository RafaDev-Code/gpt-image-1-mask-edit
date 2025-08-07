module.exports = {
  contextSeparator: '_',
  // Key separator used in your translation keys
  keySeparator: '.',
  // Namespace separator used in your translation keys
  namespaceSeparator: ':',
  // Namespace to use by default
  defaultNamespace: 'common',
  // Default value to give to empty keys
  defaultValue: '',
  // Indentation of the JSON output
  indentation: 2,
  // Keep keys from the catalog that are no longer in code
  keepRemoved: false,
  // Key separator used in your translation keys
  // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think that there are a namespace and a key.
  // keySeparator: false,
  // namespaceSeparator: false,
  // Plural separator used in your translation keys
  pluralSeparator: '_',
  // Set to false to disable namespace support
  createOldCatalogs: false,
  // Location of the translation files
  locales: ['en', 'es'],
  // An array of the namespaces to use
  namespaceSeparator: ':',
  // Namespace to use by default
  defaultNamespace: 'common',
  // An array of globs that describe where to look for source files
  // relative to the location of the configuration file
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    // Use ! to filter out files or directories
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/i18n/**',
    '!**/node_modules/**'
  ],
  // Output directory path
  // relative to the path specified in the input
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  // Whether or not to sort the catalog
  sort: true,
  // Whether to ignore the same key if the value is empty
  skipDefaultValues: false,
  // Whether to use the keys as the default value; ex. "Hello": "Hello", "World": "World"
  // This option takes precedence over the `defaultValue` and `skipDefaultValues` options
  useKeysAsDefaultValue: false,
  // Whether or not to run in verbose mode
  verbose: false
};