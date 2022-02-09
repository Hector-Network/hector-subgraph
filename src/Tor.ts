import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Tor } from "../generated/schema";
import { Transfer, Tor as TorContract } from "../generated/Tor/Tor";
import { FARMING_AGGREGATOR_ADDRESS, FARMINNG_STAKING_REWARDS_ADDRESS, TOR_CONTRACT, TOR_LP_POOL_ADDRESS } from "./utils/Constants";
import { toDecimal } from "./utils/Decimals";
import { TorLPPool } from '../generated/Tor/TorLPPool';
import { FarmingAggregator } from '../generated/Tor/FarmingAggregator';

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
  tor.apy = getTorAPY();
  tor.save();
}

export function getTORTvl(): BigDecimal {
  const torLPContract = TorLPPool.bind(Address.fromString(TOR_LP_POOL_ADDRESS));
  const torTVL = torLPContract.balanceOf(Address.fromString(FARMINNG_STAKING_REWARDS_ADDRESS));
  return toDecimal(torTVL);
}

function getTorAPY(): BigDecimal {
  const farmingAggregatorContract = FarmingAggregator.bind(Address.fromString(FARMING_AGGREGATOR_ADDRESS));
  const stakingAPY = farmingAggregatorContract.getStakingInfo(Address.fromString(FARMING_AGGREGATOR_ADDRESS), BigInt.fromString('0'));
  return toDecimal(stakingAPY.value1);
}