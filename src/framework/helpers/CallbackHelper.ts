/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

import Util from 'node:util';

/**
 * Callback/Function helper.
 */
export default class CallbackHelper {
  /**
   * Check that given callback is function or not
   * @param callback The callback to testify
   */
  public static isFunction ( callback: any ): boolean {
    return typeof callback === 'function';
  }

  /**
   * Check that given value is actual a function, callback or async function
   * @param value The value to testify
   * @return Whatever a function or not
   */
  public static isActualFunction ( value: any ): boolean {
    return CallbackHelper.isFunction(value)
      || CallbackHelper.isSync(value)
      || CallbackHelper.isAsync(value);
  }

  /**
   * Check that given value is actual a function, callback or async function
   * @param value The value to testify
   * @return Whatever a function or not
   */
  public static isActualValue ( value: any ): boolean {
    return !this.isActualFunction(value)
      && !(value instanceof Promise);
  }

  /**
   * Check that given callback is async function or not
   * @param callback The callback to testify
   * @return Whatever a function or not
   */
  public static isSync ( callback: any ): boolean {
    return CallbackHelper.isFunction(callback)
      && callback.constructor.name === 'Function';
  }

  /**
   * Check that given callback is async function or not
   * @param callback The callback to testify
   * @return Whatever a function or not
   */
  public static isAsync ( callback: any ): boolean {
    return !CallbackHelper.isSync(callback)
      && callback.constructor.name === 'AsyncFunction';
  }

  /**
   * Converts plain function into an async function
   * @param callback The callback to promisify
   * @return Constructor of an 'AsyncFunction'
   */
  public static promisify ( callback: Function ): Function {
    return !CallbackHelper.isAsync(callback)
      ? callback
      : Util.promisify(callback);
  }
}
