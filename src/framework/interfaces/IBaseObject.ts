/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

export default interface IBaseObject {
  [key: string | symbol]: any;
}

export interface IRegistry {
  [key: string | symbol]: string;
}

export interface IProperties {
  [key: string | symbol]: any;
}
