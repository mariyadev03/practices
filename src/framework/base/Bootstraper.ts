import { Application } from 'framework/types/Application';

/**
 * Bootstrapper is the class that should be extended by classes who want to participate in the application bootstrap process.
 *
 * The main method {@link bootstrap()} will be invoked by an application at the beginning of its `init()` method.
 *
 * Bootstrapping classes can be registered in two approaches.
 */
export default abstract class Bootstrapper {
  /**
   * Bootstrap method to be called during application bootstrap stage.
   * @param app - The application currently running
   */
  public bootstrap ( app: Application ) {
    // override by child class
  }
}
