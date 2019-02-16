
/**
 * Create a session 
 * 
 * @param backend The backend storage
 * @param id The session identifier
 * @param state The session initial state
 */
export declare function createSession (backend: Storage, id?: string, state?: object): Session;

/**
 * Create and load the session state from the storage backend.
 * 
 * @param backend The backend storage
 * @async
 */
export declare function startSession (backend: Storage): Promise<Session>;

/**
 * 
 */
export declare class Session {
  /**
   * 
   * @param backend The backend storage
   * @param id The session identifier
   * @param state 
   */
  constructor (backend: Storage, id: string, state: State);

  /**
   * Set the session lifetime.
   * 
   * Allow using different lifetimes for certain cases
   * 
   * @param value The lifetime in milliseconds
   */
  setLifetime(value: number): this;

  /**
   * Determine the state is empty or not
   * 
   * 
   */
  isEmpty(): boolean;

  /**
   * Set a key/value pair
   * 
   * @param key 
   * @param value 
   */
  set(key: string, value: any): this;

  /**
   * Merge with the new given state
   * 
   * @param object 
   */
  merge(object: State): this;

  /**
   * Replace the state entirely
   * 
   * @param object
   */
  reset(object?: State): this;

  /**
   * Get the `key` value
   * 
   * @param key 
   */
  get(key: string): any;

  /**
   * Check if the `key` is present
   * 
   * @param key 
   */
  has(key: string): boolean;

  /**
   * Delete the `key` entry
   * 
   * @param key 
   */
  delete (key: string): boolean;

  /**
   * Get the `key` value, removing the entry from the session
   * 
   * @param key
   */
  pull(key: string): any;

  /**
   * Get the JSON representation
   */
  toJSON(): State;

  /**
   * Start the session, reading the state from the storage.
   * 
   * Will return `false` if the session is already started or newly created
   */
  start(): Promise<boolean>;

  /**
   * Save the session, writing the state in the storage.
   * 
   * Will not persist if the state is empty.
   */
  commit(): Promise<boolean>;

  /**
   * Flush the session data and regenerate a new identifier
   */
  invalidate(): Promise<void>;

  /**
   * Maintain the actual state and regenerate an new identifier
   * 
   * @param destroy if true, will destroy the storage entry
   */
  regenerate(destroy?: boolean): Promise<void>;
}

/**
 * 
 */
export interface State {
  [key: string]: any;
}

/**
 * 
 */
export interface Storage {
  /**
   * 
   * @param id The session identifier
   */
  remove(id: string): any;

  /**
   * 
   * @param id The session identifier
   */
  read(id: string): State | Promise<State>;

  /**
   * 
   * @param id The session identifier
   * @param data The session data
   * @param lifetime 
   */
  write(id: string, data: any, lifetime: number): any;
}
