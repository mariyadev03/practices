/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

// Cores
import Component from 'framework/base/Component';

export interface Parameters {
  [field: string]: any;
}

export interface ParamRegistry {
  [namespace: string]: Properties;
}

/** Class constructor parameters */
export interface Arguments {
  [field: string]: any;
}

export interface DefinitionContainer {
  namespace: string;

  [property: string]: any;
}

export type Definition = DefinitionContainer | Component | Function;

export interface DefinitionRegistry {
  [namespace: string]: [definition: DefinitionType, params: Parameters] | DefinitionType;
}

export interface SingletonRegistry {
  [id: string]: any;
}

export type DefinitionType = string | Definition | Function | Component | null;

export interface SingletonBatch {
  [namespace: string]: [definition: DefinitionType, params: Parameters] | DefinitionType;
}
