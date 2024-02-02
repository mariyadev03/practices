/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-14
 */

// Core
import Component from 'framework/base/Component';

// noinspection GrazieInspection
/**
 * Response represents the response of an {@link Application} to a {@link Request}
 */
export default class Response extends Component {
  /**
   * The exit status. Exit statuses should be in the range 0 to 254.
   * The status 0 means the program terminates successfully.
   */
  public exitStatus: number = 0;

  /**
   * @inheritDoc
   */
  public get namespace (): string {
    return 'framework/base/Response';
  }

  /**
   * Sends the response to client.
   */
  public send () {
  }
}
