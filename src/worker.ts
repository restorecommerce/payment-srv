import { cfg } from './config';
import logger from './logger';
import * as Chassis from '@restorecommerce/chassis-srv';
import { Events } from '@restorecommerce/kafka-client';
import { PaymentService } from './service';
import { PaymentServiceCommandInterface } from './paymentServiceCommandInterface';
import { RedisClient, createClient } from 'redis';

export class Worker {

  server: any;
  events: Events;
  offsetStore: Chassis.OffsetStore;
  topics: any;
  redisClient: RedisClient;

  constructor() {
    this.topics = {};
  }

  async start(): Promise<any> {
    logger.info('Starting microservice.');
    const events = new Events(cfg.get('events:kafka'));
    await events.start();

    const redisConfig = cfg.get('redis');
    redisConfig.db = cfg.get('redis:db-indexes:db-subject');
    this.redisClient = createClient(redisConfig);

    const server = new Chassis.Server(cfg.get('server'), logger);
    const pss = new PaymentService(cfg.get('payments'));
    const cis = new PaymentServiceCommandInterface(server, cfg, logger, events, this.redisClient);

    const eventListener = async (msg: any, context: any, config: any, eventName: string): Promise<any> => {
      // command events
      await cis.command(msg, context);
    };

    this.offsetStore = new Chassis.OffsetStore(events, cfg, logger);

    const kafkaCfg = cfg.get('events:kafka');
    const topicTypes = Object.keys(kafkaCfg.topics);
    for (let topicType of topicTypes) {
      const topicName = kafkaCfg.topics[topicType].topic;
      this.topics[topicType] = events.topic(topicName);
      const offSetValue = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offSetValue);
      if (kafkaCfg.topics[topicType].events) {
        const eventNames = kafkaCfg.topics[topicType].events;
        for (let eventName of eventNames) {
          await this.topics[topicType].on(eventName, eventListener, {startingOffset: offSetValue});
        }
      }
    }

    const serviceNamesCfg = cfg.get('serviceNames');
    await server.bind(serviceNamesCfg.payment, pss);
    await server.bind(serviceNamesCfg.cis, cis);

    const reflectionServiceName = serviceNamesCfg.reflection;
    const transportName = cfg.get(`server:services:${reflectionServiceName}:serverReflectionInfo:transport:0`);
    const transport = server.transport[transportName];
    const reflectionService = new Chassis.grpc.ServerReflection(transport.$builder, server.config);
    await server.bind(reflectionServiceName, reflectionService);

    await server.bind(serviceNamesCfg.health, new Chassis.Health(cis));

    // Start server
    await pss.start();
    await server.start();
    this.events = events;
    this.server = server;
  }

  async stop(): Promise<any> {
    logger.info('Shutting down microservice');
    await this.server.stop();
    await this.events.stop();
  }
}

if (require.main === module) {
  const worker = new Worker();
  worker.start().then().catch((err) => {
    logger.error('startup error', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    worker.stop().then().catch((err) => {
      logger.error('shutdown error', err);
      process.exit(1);
    });
  });
}
