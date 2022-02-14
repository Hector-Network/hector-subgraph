import { StakeCall } from '../generated/BaseRewardPool/BaseRewardPool';
import { BaseRewardPool } from '../generated/schema';
import { BaseRewardPool as pool } from '../generated/BaseRewardPool/BaseRewardPool';
import { WormHole } from '../generated/BaseRewardPool/WormHole';
import { Address } from '@graphprotocol/graph-ts';
import { BASE_REWARD_POOL_ADDRESS, CONVEX_ALLOCATOR_ADDRESS, WORMHOLE_ADDRESS } from './utils/Constants';


export function handleStake(call: StakeCall): void {
    const id = call.transaction.hash.toHex();
    const baseRewardPoolContract = pool.bind(Address.fromString(BASE_REWARD_POOL_ADDRESS));
    const wormHoleContract = WormHole.bind(Address.fromString(WORMHOLE_ADDRESS));
    let baseRewardPool = new BaseRewardPool(id);
    baseRewardPool.Lp = baseRewardPoolContract.balanceOf(Address.fromString(CONVEX_ALLOCATOR_ADDRESS));
    baseRewardPool.virtualPrice = wormHoleContract.get_virtual_price();
    baseRewardPool.save();
}