import { createLogger } from '@restorecommerce/logger';
import { cfg } from './config.js';

const loggerCfg = cfg.get('logger');
export default createLogger(loggerCfg);
