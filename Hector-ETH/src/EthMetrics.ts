import { EthMetric } from '../generated/schema';
import { BaseRewardPool, WithdrawAllAndUnwrapCall } from '../generated/EthMetrics/BaseRewardPool';
import { WormHole } from '../generated/EthMetrics/WormHole';
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { BASE_REWARD_POOL_ADDRESS, CONVEX_ALLOCATOR_ADDRESS, ETH_WALLET_ADDRESS, MATIC_ADDRESS, MATIC_DAI_PAIR, WORMHOLE_ADDRESS } from '../constants';

export const DEFAULT_DECIMALS = 18;

export function toDecimal(
    value: BigInt,
    decimals: number = DEFAULT_DECIMALS,
): BigDecimal {
    let precision = BigInt.fromI32(10)
        .pow(<u8>decimals)
        .toBigDecimal();

    return value.divDecimal(precision);
}

export function handleWithdrawAndUnwrap(call: WithdrawAllAndUnwrapCall): void {
    const id = call.transaction.from.toHex();
    let rewardPool = EthMetric.load(id);
    if (rewardPool == null) {
        rewardPool = new EthMetric(id);
    }
    rewardPool.timestamp = call.block.timestamp;
    // calculating pool deposit amount
    rewardPool.treasuryBaseRewardPool = getBaseRewardPool();
    rewardPool.save();
}

function getBaseRewardPool(): BigDecimal {
    const baseRewardPoolContract = BaseRewardPool.bind(Address.fromString(BASE_REWARD_POOL_ADDRESS));
    const wormHoleContract = WormHole.bind(Address.fromString(WORMHOLE_ADDRESS));
    const lpBalance = toDecimal(baseRewardPoolContract.balanceOf(Address.fromString(CONVEX_ALLOCATOR_ADDRESS)), 18);
    log.debug('Lp Balance: ', [lpBalance.toString()]);
    const lpVirutalPrice = toDecimal(wormHoleContract.get_virtual_price(), 18);
    log.debug('Lp virtual price: ', [lpVirutalPrice.toString()]);
    return lpBalance.times(lpVirutalPrice);
}

// function getTreasuryMaticValue(): BigDecimal {
//     const maticContract = Matic.bind(Address.fromString(MATIC_ADDRESS));
//     const maticBalance = toDecimal(maticContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18)
//     const pair = UniswapV3Factory.bind(Address.fromString(MATIC_DAI_PAIR));
//     let data = pair.try_getPool(Address.fromString(MATIC_ADDRESS), Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), 3000);
//     if (data.reverted) {
//         log.debug('No Uni v3 pair (.3%) found for {}', [])
//         data = pair.try_getPool(Address.fromString(MATIC_ADDRESS), Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), 10000);
//         if (data.reverted) {
//             log.debug('No Uni v3 pair (1%) found for {}', [data.reverted.toString()])
//             return BigDecimal.fromString('0')
//         }
//     }
//     log.debug('MATIC DAI PAIR:', [data.value.toString()]);
//     return BigDecimal.fromString('22');
// }