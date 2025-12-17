const fs = require('fs').promises;
const path = require('path');

const walk = async (dir) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const files = await fs.readdir(dir);
  const results = await Promise.all(files.map(async (file) => {
    const filePath = path.join(dir, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) return walk(filePath);

    return filePath;
  }));
  return results.flat();
};

module.exports = async (app) => {
  // Use absolute path relative to this file
  const routesPath = path.join(__dirname, '../routes');
  const allFiles = await walk(routesPath);

  allFiles.forEach((file) => {
    const routeName = path.basename(file, '.js');

    console.log('registering route: ', routeName);

    // Require the file directly using its absolute path
    // eslint-disable-next-line max-len
    // eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require, global-require
    app.use(`/api/v1/${routeName}`, require(file));
  });

  app.get('/', (req, res) => res.status(200).send({
    msg: 'Everything is working fine.',
    host: req.get('host'),
  }));

  /** Defined route for load testing */
  app.get('/load-test', (req, res) => {
    res.status(200).send('OK');
  });

  /** Render Static Pages */
  app.get('/terms', (req, res) => {
    res.render('terms');
  });

  app.get('/privacy', (req, res) => {
    res.render('privacy');
  });

  /** Middleware to handle "route not found" errors */
  app.use((req, res) => res.status(404).send({
    msg: `'${req.originalUrl}' is not a valid endpoint. Please check the request URL and try again.`,
  }));
};
