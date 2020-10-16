import { PaymentError, Provider } from './grpc_types';
import { spawn } from 'child_process';
import logger from './logger';
import { PaymentService } from "./service";

export class RubyExecutor {

  readonly cfg;

  constructor(cfg: { [key: string]: any }) {
    this.cfg = cfg;
  }

  async executeRuby(service: PaymentService, script: string, provider: Provider, params: any[]): Promise<{
    stdout: string;
    stderr: string;
    response?: any;
    errors: PaymentError[];
  }> {
    let providerName: any = provider;

    if (parseInt(providerName) >= 0) {
      providerName = Provider[providerName]
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
        let errors: PaymentError[] = [];

        if (stderr !== '') {
          logger.error('Failed executing ruby script: ' + stderr.trim());
          errors.push({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            signal: undefined,
            killed: false,
            code: 0,
            cmd: rubyParams.join(' ')
          });
        }

        logger.silly('Response from ruby script: ' + stdout.trim());

        let response;
        if (stdout !== '') {
          response = JSON.parse(stdout.trim());

          if (response.error) {
            errors.push({
              code: 0,
              killed: false,
              signal: undefined,
              stderr: response.error,
              stdout: '',
              cmd: ''
            });
          }
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          response,
          errors
        });
      });
    });
  };

}
