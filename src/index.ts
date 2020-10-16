import { cfg } from './config';
import * as Cluster from '@restorecommerce/cluster-service';

const server = new Cluster(cfg);

server.run('./lib/worker');

process.on('SIGINT', () => {
  server.stop();
});
