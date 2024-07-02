export default abstract class Command {
  public readonly name: string;

  constructor() {
    this.name = this.constructor.name;
  }
}