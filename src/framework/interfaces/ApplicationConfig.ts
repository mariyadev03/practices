/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

// Types
import IServerOptions from 'framework/fastify/IServerOptions';
import ILoggerOptions from 'framework/log/ILoggerOptions';

interface PredefinedComponents {
  server?: IServerOptions;
  log?: ILoggerOptions;
}

type Components = {
  [id: string]:
    { namespace: string; }
    | { namespace?: string; [key: string]: any; }
} & PredefinedComponents;

export default interface ApplicationConfig {
  /** Unique application ID */
  id: string;
  /** Application name */
  name: string;
  /** Base path (root) */
  basePath: string;
  /** Runtime directory base path. (defaults to `'@basePath/runtime'`) */
  runtimePath?: string;
  /** Encoding set (defaults to `'UTF-8'`) */
  charset?: string;
  /** Timezone (defaults to `'UTC'`) */
  timeZone?: string;
  /** Controllers directory (defaults to `'app/controllers'`) */
  controllerNamespace?: string;
  /** Display language (defaults to `'en-US'`) */
  language?: string;
  /** Source language (defaults to `'en-US'`) */
  sourceLanguage?: string;
  /** Bootstrap configuration (defaults to `['log']`) */
  bootstrap?: Array<any>;
  /** Components configuration (defaults to `{}`) */
  components: Components;
  /** Key-value params to access via `App.app.params` (defaults to `{}` */
  params: { [id: string]: any };
  /** Display language (defaults to `{}` */
  aliases?: { [name: string]: string };
}
