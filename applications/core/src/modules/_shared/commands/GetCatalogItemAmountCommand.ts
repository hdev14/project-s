import Command from "@shared/Command";

export default class GetCatalogItemAmountCommand extends Command {
  constructor(readonly catalog_item_id: string) {
    super();
  }
}