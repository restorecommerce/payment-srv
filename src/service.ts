import { RubyExecutor } from './ruby';
import {
  Call,
  CaptureRequest,
  SetupRequest,
  SetupResponse,
  PaymentRequest,
  PaymentResponse,
  PaymentPayloadStatus
} from './grpc_types';

export class PaymentService {

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
    console.log('Calling start....');
  }

  async stop(): Promise<void> {
    console.log('Calling stop....');
  }

  async SetupAuthorization(call: Call<SetupRequest>, context?: any): Promise<SetupResponse> {
    return this.SetupGeneric(call, 'scripts/setupAuthorization.rb', context);
  }

  async SetupPurchase(call: Call<SetupRequest>, context?: any): Promise<SetupResponse> {
    return this.SetupGeneric(call, 'scripts/setupPurchase.rb', context);
  }

  async Authorize(call: Call<PaymentRequest>, context?: any): Promise<PaymentResponse> {
    return this.ProcessGeneric(call, 'scripts/authorization.rb', context);
  }

  async Purchase(call: Call<PaymentRequest>, context?: any): Promise<PaymentResponse> {
    return this.ProcessGeneric(call, 'scripts/purchase.rb', context);
  }

  async Capture(call: Call<CaptureRequest>, context?: any): Promise<PaymentResponse> {
    const result = await this.executor.executeRuby(this, 'scripts/capture.rb', call.request.provider, [
      call.request.payment_sum,
      call.request.payment_id
    ]);

    return result;
  }

  private async SetupGeneric(call: Call<SetupRequest>, script: string, context?: any): Promise<SetupResponse> {
    const result = await this.executor.executeRuby(this, script, call.request.provider, [
      call.request.ip,
      call.request.subtotal,
      call.request.shipping,
      call.request.handling,
      call.request.tax,
      call.request.currency || this.DEFAULT_CURRENCY,
      call.request.return_url || this.CONFIRM_RETURN_URL,
      call.request.cancel_return_url || this.CANCELED_RETURN_URL,
      call.request.allow_guest_checkout,
      call.request.items,
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
    return result;
  }

  private async ProcessGeneric(call: Call<PaymentRequest>, script: string, context?: any): Promise<PaymentResponse> {
    const result = await this.executor.executeRuby(this, script, call.request.provider, [
      call.request.payment_sum,
      call.request.currency || this.DEFAULT_CURRENCY,
      call.request.payer_id,
      call.request.token,
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
