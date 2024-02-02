/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-14
 */

// Global vars
declare var App;

import fs from 'fs';

// Core
import Component from 'framework/base/Component';

// Helpers
import FileHelper from 'framework/helpers/FileHelper';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';

// noinspection GrazieInspection
/**
 * Request represents a request that is handled by an {@link Application}
 */
export default abstract class Request extends Component {
  private _scriptFile;
  private _isConsoleRequest;

  /**
   * @inheritDoc
   */
  public get namespace (): string {
    return 'framework/base/Request';
  }

  /**
   * Resolves the current request into a route and the associated parameters.
   * @return The first element is the route, and the second is the associated parameters.
   */
  public abstract resolve ();

  /**
   * Returns an entry script file path.
   * @return Entry script file path (processed w/ realpath())
   * @throws {InvalidConfigException} - if the entry script file path cannot be determined automatically.
   */
  get scriptFile (): string {
    if ( !this._scriptFile ) {
      if ( require?.main?.filename ) {
        this._scriptFile = FileHelper.normalize(require.main?.filename);
      } else {
        throw new InvalidConfigException('Unable to determine the entry script file path.');
      }
    }

    return this._scriptFile;
  }

  /**
   * The value indicating whether the current request is made via console.
   */
  set scriptFile ( value: string ) {
    const scriptFile: string = fs.realpathSync(App.getAlias(value));
    if ( scriptFile && FileHelper.isFile(scriptFile) ) {
      this._scriptFile = scriptFile;
    } else {
      throw new InvalidConfigException('Unable to determine the entry script file path.');
    }
  }

  /**
   * Entry script file path (processed w/ realpath()).
   */
  get isConsoleRequest (): boolean {
    return this._isConsoleRequest ? this._isConsoleRequest : require.main === module;
  }

  /**
   * Sets the value indicating whether the current request is made via command line.
   */
  set isConsoleRequest ( value: boolean ) {
    this._isConsoleRequest = value;
  }
}
