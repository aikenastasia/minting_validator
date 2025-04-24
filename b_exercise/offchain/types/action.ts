export type Action = () => Promise<void>;
export type ActionGroup = Record<string, Action>;
