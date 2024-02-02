/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

export interface Configuration {
  namespace: string;
  [key: string]: any;
}

export type TypeDefinition = string | Configuration | Function;
