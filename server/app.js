// Entry point for the app

// Express is the underlying that atlassian-connect-express uses:
// https://expressjs.com
import express from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import morgan from 'morgan';

// atlassian-connect-express also provides a middleware
import ace from 'atlassian-connect-express';

// Use Handlebars as view engine:
// https://npmjs.org/package/express-hbs
// http://handlebarsjs.com
import hbs from 'express-hbs';

// We also need a few stock Node modules
import http from 'http';
import path from 'path';
import os from 'os';
import helmet from 'helmet';
import nocache from 'nocache';

// Routes live here; this is the C in MVC
import routes from './routes';
import { addServerSideRendering } from './server-side-rendering';

import storage from './storage/storage';

// Bootstrap Express and atlassian-connect-express
const app = express();
const addon = ace(app);

// See config.json
const port = addon.config.port();

app.set('port', port);

// Log requests, using an appropriate formatter by env
const devEnv = app.get('env') === 'development';
app.use(morgan(devEnv ? 'dev' : 'combined'));

// Configure Handlebars
const viewsDir = path.join(__dirname, 'views');
const handlebarsEngine = hbs.express4({partialsDir: viewsDir});
app.engine('hbs', handlebarsEngine);
app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Configure jsx (jsx files should go in views/ and export the root component as the default export)
addServerSideRendering(app, handlebarsEngine);

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
// HSTS must be enabled with a minimum age of at least one year
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: false
}));
app.use(helmet.referrerPolicy({
  policy: ['origin']
}));

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Include atlassian-connect-express middleware
app.use(addon.middleware());

// Mount the static files directory
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
app.use(nocache());

// Show nicer errors in dev mode
if (devEnv) app.use(errorHandler());

// Wire up routes
routes(app, addon);

app.get('/unblock/:projectId', addon.authenticate(), async function(req,res){
  console.log('--- Unblock ---');

  const domain = req.query['xdm_e'];
  const issueKey = req.query['issueKey'];
  const httpClient = addon.httpClient(req);

  await httpClient.get({
    url: `/rest/api/2/issue/${issueKey}`,
  },
  function(err, httpResponse, body) {
    if (err) {
      return console.error('Upload failed:', err);
    }
    console.log(body)
    storage.updateData(domain, issueKey, JSON.parse(body).fields.status.name, 'UNBLOCK');

    res.status(204).send();
  });
});

app.get('/block/:projectId', addon.authenticate(), async function(req,res) {
  console.log('--- Block ---');

  const domain = req.query['xdm_e'];
  const issueKey = req.query['issueKey'];
  const httpClient = addon.httpClient(req);

  await httpClient.get({
    url: `/rest/api/2/issue/${issueKey}`,
  },
  function(err, httpResponse, body) {
    if (err) {
      return console.error('Upload failed:', err);
    }
    console.log(body)
    storage.updateData(domain, issueKey, JSON.parse(body).fields.status.name, 'BLOCK');

    res.status(204).send();
  });
});

// Boot the HTTP server
http.createServer(app).listen(port, () => {
  console.log('App server running at http://' + os.hostname() + ':' + port);

  // Enables auto registration/de-registration of app into a host in dev mode
  if (devEnv) addon.register();
});
