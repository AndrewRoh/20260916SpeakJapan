import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
