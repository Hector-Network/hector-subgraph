import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Tor } from "../generated/schema";
import { Transfer, Tor as TorContract } from "../generated/Tor/Tor";
import { FARMINNG_STAKING_REWARDS_ADDRESS, TOR_CONTRACT, TOR_LP_POOL_ADDRESS } from "./utils/Constants";
import { toDecimal } from "./utils/Decimals";
import { TorLPPool } from '../generated/Tor/TorLPPool';

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
  tor.torTVL = getTORTvl();
  tor.save();
}

export function getTORTvl(): BigDecimal {
  const torLPContract = TorLPPool.bind(Address.fromString(TOR_LP_POOL_ADDRESS));
  const torTVL = torLPContract.balanceOf(Address.fromString(FARMINNG_STAKING_REWARDS_ADDRESS));
  return toDecimal(torTVL);
}