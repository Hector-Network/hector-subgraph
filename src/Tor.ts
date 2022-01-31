import { Address } from "@graphprotocol/graph-ts";
import { Tor } from "../generated/schema";
import { Transfer, Tor as TorContract } from "../generated/Tor/Tor";
import { TOR_CONTRACT } from "./utils/Constants";
import { toDecimal } from "./utils/Decimals";

export function handleTransfer(event: Transfer): void {
  const id = event.transaction.hash.toHex();
  let tor = Tor.load(id);
  if (tor != null) {
    return;
  }

  const contract = TorContract.bind(Address.fromString(TOR_CONTRACT));
  tor = new Tor(id);
  tor.supply = toDecimal(contract.totalSupply(), contract.decimals());
  tor.timestamp = event.block.timestamp;
  tor.save();
}
