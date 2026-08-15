import type { en } from './en';

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Messages = DeepStringify<typeof en>;

type NestedKeyOf<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : `${K}.${NestedKeyOf<T[K]>}`;
    }[keyof T & string];

export type MessageKey = NestedKeyOf<typeof en>;

export type TranslateVars = Record<string, string | number>;

export type TranslateFn = (key: MessageKey, vars?: TranslateVars) => string;
