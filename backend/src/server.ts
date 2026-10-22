import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => console.log(`API Business Exchange em http://localhost:${env.PORT}`));
