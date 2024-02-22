import { cfg } from './config.js';
import logger from './logger.js';
import * as Chassis from '@restorecommerce/chassis-srv';
import { Events, registerProtoMeta } from '@restorecommerce/kafka-client';
import { PaymentService } from './service.js';
import { PaymentServiceCommandInterface } from './paymentServiceCommandInterface.js';
import { createClient, RedisClientType } from 'redis';
import { BindConfig } from '@restorecommerce/chassis-srv/lib/microservice/transport/provider/grpc/index.js';
import { PaymentServiceDefinition, protoMetadata as paymentMeta }
  from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/payment.js';
import {
  CommandInterfaceServiceDefinition,
  protoMetadata as commandInterfaceMeta
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/commandinterface.js';
import {
  protoMetadata as reflectionMeta,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/grpc/reflection/v1alpha/reflection.js';
import { ServerReflectionService } from 'nice-grpc-server-reflection';
import { HealthDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/grpc/health/v1/health.js';

registerProtoMeta(
  paymentMeta,
  commandInterfaceMeta,
  reflectionMeta
);

export class Worker {

  server: any;
  events: Events;
  offsetStore: Chassis.OffsetStore;
  topics: any;
  redisClient: RedisClientType;

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
    await this.redisClient.connect();

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
      this.topics[topicType] = await events.topic(topicName);
      const offSetValue = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offSetValue);
      if (kafkaCfg.topics[topicType].events) {
        const eventNames = kafkaCfg.topics[topicType].events;
        for (let eventName of eventNames) {
          await this.topics[topicType].on(eventName, eventListener, { startingOffset: offSetValue });
        }
      }
    }

    const serviceNamesCfg = cfg.get('serviceNames');

    await server.bind(serviceNamesCfg.payment, {
      service: PaymentServiceDefinition,
      implementation: pss
    } as BindConfig<PaymentServiceDefinition>);

    await server.bind(serviceNamesCfg.cis, {
      service: CommandInterfaceServiceDefinition,
      implementation: cis
    } as BindConfig<CommandInterfaceServiceDefinition>);

    const reflectionServiceName = serviceNamesCfg.reflection;
    const transportName = cfg.get(`server:services:${reflectionServiceName}:serverReflectionInfo:transport:0`);
    const transport = server.transport[transportName];
    const reflectionService = Chassis.buildReflectionService([
      { descriptor: paymentMeta.fileDescriptor },
      { descriptor: commandInterfaceMeta.fileDescriptor }
    ]);

    await server.bind(reflectionServiceName, {
      service: ServerReflectionService,
      implementation: reflectionService
    });

    await server.bind(serviceNamesCfg.health, {
      service: HealthDefinition,
      implementation: new Chassis.Health(cis, {
        logger,
        cfg,
      })
    } as BindConfig<HealthDefinition>);

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
