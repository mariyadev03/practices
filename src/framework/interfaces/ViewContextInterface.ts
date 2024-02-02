/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

/**
 * ViewContextInterface is the interface that should implement by classes who want to support relative view names.
 *
 * The method [[getViewPath()]] should be implemented to return the view path that may be prefixed to a relative view name.
 */
export default interface ViewContextInterface {
  /**
   * @return string the view path that may be prefixed to a relative view name.
   */
  getViewPath(): string;
}
