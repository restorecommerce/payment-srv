import { createServiceConfig } from '@restorecommerce/service-config';
import { Provider } from 'nconf';

// Export cfg Object
export const cfg: Provider = createServiceConfig(process.cwd());
