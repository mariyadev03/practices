import Component from 'framework/base/Component';

export interface Components {
  [id: string | symbol]: Component | any | null;
}
