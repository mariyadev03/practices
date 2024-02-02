// Types
import { IApplicationConfig } from 'framework/types/application.flow';

export default async function (): Promise<IApplicationConfig> {
  return {
    catalogue: [],
    components: {},
  };
}
