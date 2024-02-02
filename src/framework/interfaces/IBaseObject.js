// @flow

interface IBaseObject {
  constructor ( config?: { [string]: any } ): IBaseObject;

  init (): void;

  hasProperty ( name: string ): boolean;

  hasMethod ( name: string ): boolean;
}
