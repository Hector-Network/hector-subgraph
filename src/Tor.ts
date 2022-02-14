import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Tor } from "../generated/schema";
import { Transfer, Tor as TorContract } from "../generated/Tor/Tor";
import {
  FARMING_AGGREGATOR_ADDRESS,
  FARMINNG_STAKING_REWARDS_ADDRESS,
  TOR_CONTRACT,
  TOR_LP_POOL_ADDRESS,
} from "./utils/Constants";
import { toDecimal } from "./utils/Decimals";
import { TorLPPool } from "../generated/Tor/TorLPPool";
import { FarmingAggregator } from "../generated/Tor/FarmingAggregator";

export function handleTransfer(event: Transfer): void {
  const id = event.transaction.hash.toHex();
  let currentTor = Tor.load(id);
  if (currentTor != null) {
    return;
  }

  const contract = TorContract.bind(Address.fromString(TOR_CONTRACT));
  const currentSupply = toDecimal(contract.totalSupply(), contract.decimals());

  const lastTor = Tor.load("0");
  if (lastTor && lastTor.supply.equals(currentSupply)) {
    // TOR supply hasn't changed. Avoid saving this transaction and creating useless duplicates.
    return;
  }

  currentTor = new Tor(id);
  currentTor.supply = currentSupply;
  currentTor.timestamp = event.block.timestamp;
  currentTor.torTVL = getTORTvl();
  currentTor.apy = getTorAPY();
  currentTor.save();

  // Save for the next TOR event handler.
  currentTor.id = "0";
  currentTor.save();
}

export function getTORTvl(): BigDecimal {
  const torLPContract = TorLPPool.bind(Address.fromString(TOR_LP_POOL_ADDRESS));
  const torTVL = torLPContract.balanceOf(
    Address.fromString(FARMINNG_STAKING_REWARDS_ADDRESS)
  );
  return toDecimal(torTVL);
}

function getTorAPY(): BigDecimal {
  const farmingAggregatorContract = FarmingAggregator.bind(
    Address.fromString(FARMING_AGGREGATOR_ADDRESS)
  );
  const stakingAPY = farmingAggregatorContract.getStakingInfo(
    Address.fromString(FARMING_AGGREGATOR_ADDRESS),
    BigInt.fromString("0")
  );
  return toDecimal(stakingAPY.value1);
}
