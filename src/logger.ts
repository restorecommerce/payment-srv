import { createLogger } from '@restorecommerce/logger';
import { cfg } from './config.js';

const loggerCfg = cfg.get('logger');
loggerCfg.esTransformer = (msg) => {
  msg.fields = JSON.stringify(msg.fields);
  return msg;
};

export default createLogger(loggerCfg);
