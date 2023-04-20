import { spawn } from 'child_process';
import logger from './logger';
import { PaymentService } from './service';
import { Provider } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/payment';
import { parseInt } from 'lodash';
import { OperationStatus, Status } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/status';

export class RubyExecutor {

  constructor(private readonly cfg: { [key: string]: any }) {
  }

  async executeRuby(service: PaymentService, script: string, provider: Provider, params: any[]): Promise<{
    item?: any;
    operation_status: OperationStatus;
  }> {
    let providerName: any = provider;

    if (parseInt(providerName) >= 0) {
      providerName = Provider[providerName];
    }

    const rubyParams = [
      script,
      JSON.stringify({
        provider: {
          name: providerName,
          credentials: this.cfg[providerName]
        },
        params
      })
    ];

    logger.debug('Executing ruby script: ' + rubyParams.join(' '));

    const rubyRunner = await spawn('ruby', rubyParams);

    return new Promise<any>((resolve) => {
      let stdout = '';
      let stderr = '';

      rubyRunner.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rubyRunner.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rubyRunner.on('close', () => {
        let response: any = {};
        let status: Status = { id: '', code: 0, message: '' };
        let operation_status: OperationStatus = { code: 0, message: '' };

        if (stderr !== '') {
          logger.error('Failed executing ruby script: ' + stderr.trim());
          operation_status.message = stderr.trim();
        }

        logger.silly('Response from ruby script: ' + stdout.trim());

        if (stdout !== '') {
          response = JSON.parse(stdout.trim());

          if (response && response.error) {
            status.code = 500;
            status.message = response.error;
          } else {
            status.code = 200;
            status.message = 'success';
          }
        }
        let item = {
          payload: response,
          status
        };

        operation_status = {
          code: 200,
          message: 'success'
        };

        resolve({
          item,
          operation_status
        });
      });
    });
  }

}
