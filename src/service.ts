import { RubyExecutor } from './ruby';
import {
  Call,
  CaptureRequest,
  SetupRequest,
  SetupResponse,
  PaymentRequest,
  PaymentResponse
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

    return {
      payment_errors: result.errors,
      payment_id: call.request.payment_id,
      executed_on: (new Date()).toString()
    };
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

    let paymentUrl;
    let token;
    if (result.response && result.response.data) {
      paymentUrl = result.response.data.url;
      token = result.response.data.token;
    }

    return {
      payment_errors: result.errors,
      token,
      confirm_initiation_url: paymentUrl,
      initiated_on: (new Date()).toString()
    };
  }

  private async ProcessGeneric(call: Call<PaymentRequest>, script: string, context?: any): Promise<PaymentResponse> {
    const result = await this.executor.executeRuby(this, script, call.request.provider, [
      call.request.payment_sum,
      call.request.currency || this.DEFAULT_CURRENCY,
      call.request.payer_id,
      call.request.token,
    ]);

    let transactionId;
    if (result.response && result.response.data) {
      transactionId = result.response.data.transaction_id;
    }

    return {
      payment_errors: result.errors,
      payment_id: transactionId,
      executed_on: (new Date()).toString()
    };
  }

}
