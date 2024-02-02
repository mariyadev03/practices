/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

// Helpers
import FileHelper from 'framework/helpers/FileHelper';
import ApplicationConfig from 'framework/interfaces/ApplicationConfig';

// configs
import loadParams from 'app/config/params';

/**
 * Application configurations
 */
export default async function (): Promise<ApplicationConfig> {
  const params = await loadParams();

  return {
    id: 'frontend',
    name: 'My App',
    basePath: FileHelper.normalize(__dirname + '/..'),
    timeZone: 'Asia/Karachi',
    language: 'ur-PK',
    bootstrap: ['server', 'log'],
    components: {
      server: {
        serverOptions: {}
      },
      log: {
        level: 'error'
      },
    },
    params,
  };
}
