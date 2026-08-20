/**
 * Parte del MODO MOCK (ver mock-shared.ts para cómo desactivarlo).
 *
 * Reimplementación mínima y "isomórfica" (corre igual en browser y en
 * servidor) del query builder encadenable de supabase-js, para el
 * subconjunto de métodos que usa esta app: select/eq/neq/gte/lte/in/or,
 * order, limit, single/maybeSingle, insert/update/delete/upsert.
 *
 * No habla con ninguna base de datos por sí mismo: junta la "operación"
 * pedida y se la pasa a un `executor` (distinto según se use desde
 * `mock-client-server.ts` o `mock-client-browser.ts`) cuando se hace
 * `await` sobre la instancia (igual que hace supabase-js).
 */

export type MockFilter =
  | { type: "eq" | "neq" | "gte" | "lte"; column: string; value: unknown }
  | { type: "in"; column: string; value: unknown[] }
  | { type: "or"; raw: string };

export type MockOrder = { column: string; ascending: boolean; nullsFirst?: boolean };

export type MockAction = "select" | "insert" | "update" | "delete" | "upsert";
export type MockMode = "array" | "single" | "maybeSingle";

export type MockOp = {
  table: string;
  action: MockAction;
  select: string;
  filters: MockFilter[];
  orders: MockOrder[];
  limit?: number;
  mode: MockMode;
  payload?: unknown;
  onConflict?: string;
};

export type MockResult<T = unknown> = { data: T; error: { message: string } | null };
export type MockExecutor = (op: MockOp) => Promise<MockResult>;

export class MockQueryBuilder<T = unknown> implements PromiseLike<MockResult<T>> {
  private table: string;
  private executor: MockExecutor;
  private action: MockAction = "select";
  private selectStr = "*";
  private filters: MockFilter[] = [];
  private orders: MockOrder[] = [];
  private limitN?: number;
  private mode: MockMode = "array";
  private payload?: unknown;
  private onConflictCols?: string;

  constructor(table: string, executor: MockExecutor) {
    this.table = table;
    this.executor = executor;
  }

  select(str?: string) {
    if (str) this.selectStr = str;
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push({ type: "neq", column, value });
    return this;
  }
  gte(column: string, value: unknown) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }
  lte(column: string, value: unknown) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }
  or(raw: string) {
    this.filters.push({ type: "or", raw });
    return this;
  }
  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({
      column,
      ascending: opts?.ascending !== false,
      nullsFirst: Boolean(opts?.nullsFirst),
    });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybeSingle";
    return this;
  }
  insert(payload: unknown) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: unknown) {
    this.action = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.action = "delete";
    return this;
  }
  upsert(payload: unknown, opts?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = payload;
    this.onConflictCols = opts?.onConflict;
    return this;
  }

  private toOp(): MockOp {
    return {
      table: this.table,
      action: this.action,
      select: this.selectStr,
      filters: this.filters,
      orders: this.orders,
      limit: this.limitN,
      mode: this.mode,
      payload: this.payload,
      onConflict: this.onConflictCols,
    };
  }

  then<TResult1 = MockResult<T>, TResult2 = never>(
    onfulfilled?: ((value: MockResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    // El executor no conoce el `T` concreto de este builder (siempre resuelve
    // `MockResult<unknown>`) — el `data` real ya viene con la forma correcta
    // en tiempo de ejecución, así que el cast solo alinea el tipo estático.
    return this.executor(this.toOp()).then(
      onfulfilled as ((value: MockResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
      onrejected
    );
  }
}
