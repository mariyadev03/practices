/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

// Globals
declare var App;

import BaseApplication from 'framework/base/Application';

export default class Application extends BaseApplication {
  /**
   * The default route of this application. Defaults to 'site'.
   */
  public defaultRoute: string = 'site';

  /**
   * The configuration specifying a controller action which should handle
   * all user requests. This is mainly used when the application is in maintenance mode
   * and needs to handle all incoming requests via a single action.
   * The configuration is an array whose first element specifies the route of the action.
   * The rest of the array elements (key-value pairs) specify the parameters to be bound
   * to the action. For example,
   *
   * ```js
   * {
   *     'offline/notice',
   *     param1: 'value1',
   *     param2: 'value2',
   * }
   * ```
   *
   * Defaults to null, meaning catch-all is not used.
   */
  public catchAll: Object | null = null;

  /**
   * The currently active controller instance
   */
  public controller = null;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/web/Application';
  }

  /*protected bootstrapper (): void {
    super.bootstrapper();
  }*/


  public coreComponents (): { [p: string]: { namespace: string; [p: string]: any } } {
    return {
      ...super.coreComponents(),
      //request: {namespace: 'framework/web/Request'},
      //response: {namespace: 'framework/web/Response'},
      //session: {namespace: 'framework/web/Session'},
      //user: {namespace: 'framework/web/User'},
      //errorHandler: {namespace: 'framework/web/ErrorHandler'},
    };
  }
}
