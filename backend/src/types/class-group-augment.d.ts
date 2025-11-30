declare module '../models/class-group.model' {
  interface ClassGroup {
    $set?: (key: string, ids: number[] | number) => Promise<void>;
    $add?: (key: string, ids: number[] | number) => Promise<void>;
    $remove?: (key: string, ids: number[] | number) => Promise<void>;
  }
}
