import * as chassis from '@restorecommerce/chassis-srv';
import { Events } from '@restorecommerce/kafka-client';
import { Unimplemented } from '@restorecommerce/chassis-srv/lib/microservice/errors';
import { RedisClient } from 'redis';

export class PaymentServiceCommandInterface extends chassis.CommandInterface {

  constructor(server: chassis.Server, cfg: any, logger: any, events: Events, redisClient: RedisClient) {
    super(server, cfg, logger, events, redisClient);
  }

  async restore(payload: any): Promise<any> {
    throw new Unimplemented('Restore not implemented');
  }

  async reset(): Promise<any> {
    throw new Unimplemented('Reset not implemented');
  }

}
