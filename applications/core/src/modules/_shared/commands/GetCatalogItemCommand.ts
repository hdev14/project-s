import Command from "@shared/Command";

export default class GetCatalogItemCommand extends Command {
  constructor(readonly catalog_item_id: string) {
    super();
  }
}