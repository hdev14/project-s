export type Message = {
  id: string;
  name: string;
  payload: Record<string, any>;
}

export type QueueOptions = {
  queue: string;
  attempts?: number;
}

export default abstract class Queue {
  protected options: QueueOptions;

  constructor(options: QueueOptions) {
    if (!options.attempts) {
      options.attempts = 3;
    }
    this.options = options;
  }

  abstract addMessage(message: Message): Promise<void>;
  abstract addMessages(messages: Message[]): Promise<void>;
}
