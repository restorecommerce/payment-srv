import { RubyExecutor } from './ruby';
import type {
  PaymentServiceImplementation,
  SetupRequest,
  SetupResponse,
  PaymentRequest,
  PaymentResponse,
  CaptureRequest
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/payment';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import logger from './logger';

export class PaymentService implements PaymentServiceImplementation {

  private readonly DEFAULT_CURRENCY: string;
  private readonly CONFIRM_RETURN_URL: string;
  private readonly CANCELED_RETURN_URL: string;

  readonly executor: RubyExecutor;

  constructor(cfg?: any) {
    this.DEFAULT_CURRENCY = cfg['default_currency'];
    this.CONFIRM_RETURN_URL = cfg['confirm_return_url'];
    this.CANCELED_RETURN_URL = cfg['cancelled_return_url'];

    this.executor = new RubyExecutor(cfg['gateways']);
  }

  async start(): Promise<void> {
    logger.info('PaymentService started successfully');
  }

  async stop(): Promise<void> {
    logger.info('PaymentService stopped successfully');
  }

  async setupAuthorization(request: SetupRequest): Promise<DeepPartial<SetupResponse>> {
    return this.SetupGeneric(request, 'scripts/setupAuthorization.rb', context);
  }

  async setupPurchase(request: SetupRequest, context?: any): Promise<DeepPartial<SetupResponse>> {
    return this.SetupGeneric(request, 'scripts/setupPurchase.rb', context);
  }

  async authorize(request: PaymentRequest, context?: any): Promise<DeepPartial<PaymentResponse>> {
    return this.ProcessGeneric(request, 'scripts/authorization.rb', context);
  }

  async purchase(request: PaymentRequest, context?: any): Promise<DeepPartial<PaymentResponse>> {
    return this.ProcessGeneric(request, 'scripts/purchase.rb', context);
  }

  async capture(request: CaptureRequest, context?: any): Promise<DeepPartial<PaymentResponse>> {
    const result = await this.executor.executeRuby(this, 'scripts/capture.rb', request.provider, [
      request.payment_sum,
      request.payment_id
    ]);

    return result;
  }

  private async SetupGeneric(call: SetupRequest, script: string, context?: any): Promise<SetupResponse> {
    const result = await this.executor.executeRuby(this, script, call.provider, [
      call.ip,
      call.subtotal,
      call.shipping,
      call.handling,
      call.tax,
      call.currency || this.DEFAULT_CURRENCY,
      call.return_url || this.CONFIRM_RETURN_URL,
      call.cancel_return_url || this.CANCELED_RETURN_URL,
      call.allow_guest_checkout,
      call.items,
    ]);

    // map url to confirmation_initiation_url in response message
    if (result?.item?.payload?.data) {
      if (result?.item?.payload?.data?.url) {
        result.item.payload.data.confirm_initiation_url = result.item.payload.data.url;
        delete result.item.payload.data.url;
        result.item.payload.data.initiated_on = (new Date()).toString();
      }
      result.item.payload = result.item.payload.data;
      delete result.item.payload.data;
    }

    logger.debug('Result', result);
    return result;
  }

  private async ProcessGeneric(call: PaymentRequest, script: string, context?: any): Promise<PaymentResponse> {
    const result = await this.executor.executeRuby(this, script, call.provider, [
      call.payment_sum,
      call.currency || this.DEFAULT_CURRENCY,
      call.payer_id,
      call.token,
    ]);

    // map transaction_id to payment_id in response message
    if (result?.item?.payload?.data) {
      if (result?.item?.payload?.data?.transaction_id) {
        result.item.payload.data.payment_id = result.item.payload.data.transaction_id;
        delete result.item.payload.data.transaction_id;
        result.item.payload.data.executed_on = (new Date()).toString();
      }
      result.item.payload = result.item.payload.data;
      delete result.item.payload.data;
    }
    return result;
  }

}
