import { EthMetric, Pool, PoolDayData, Token } from '../generated/schema';
import { BaseRewardPool, WithdrawAllAndUnwrapCall } from '../generated/EthMetrics/BaseRewardPool';
import { WormHole } from '../generated/EthMetrics/WormHole';
import { Matic } from '../generated/EthMetrics/Matic';
import { Illuvium } from '../generated/EthMetrics/Illuvium';
import { UniswapV3Factory } from '../generated/EthMetrics/UniswapV3Factory';
import { UniswapV3Pool } from '../generated/EthMetrics/UniswapV3Pool';
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { BASE_REWARD_POOL_ADDRESS, CONVEX_ALLOCATOR_ADDRESS, ETH_WALLET_ADDRESS, ILLUVIUM_ADDRESS, MATIC_ADDRESS, MATIC_USDT_PAIR, WORMHOLE_ADDRESS } from '../constants';

const DEFAULT_DECIMALS = 18;


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
    rewardPool.treasuryMaticBalance = getTreasuryMaticValue();
    rewardPool.treasuryIlluviumBalance = getTreasuryIlluviumValue();
    rewardPool.save();
}

export function getBaseRewardPool(): BigDecimal {
    const baseRewardPoolContract = BaseRewardPool.bind(Address.fromString(BASE_REWARD_POOL_ADDRESS));
    const wormHoleContract = WormHole.bind(Address.fromString(WORMHOLE_ADDRESS));
    const lpBalance = toDecimal(baseRewardPoolContract.balanceOf(Address.fromString(CONVEX_ALLOCATOR_ADDRESS)), 18);
    const lpVirutalPrice = toDecimal(wormHoleContract.get_virtual_price(), 18);
    return lpBalance.times(lpVirutalPrice);
}

function getTreasuryMaticValue(): BigDecimal {
    const maticContract = Matic.bind(Address.fromString(MATIC_ADDRESS));
    const maticBalance = toDecimal(maticContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18);

    // const pair = UniswapV3Pool.bind(Address.fromString(MATIC_USDT_PAIR));
    // const pool = new Pool(MATIC_USDT_PAIR);
    // log.debug('token0 Price {}', [pool.token0Price.toString()]);
    // log.debug('token1 Price {}', [pool.token1Price.toString()]);

    // const poolDay = new PoolDayData(MATIC_USDT_PAIR);
    // log.debug('poolDay token0 Price {}', [poolDay.token0Price.toString()]);
    // log.debug('poolDay token1 Price {}', [poolDay.token1Price.toString()]);
    return maticBalance;
}

function getTreasuryIlluviumValue(): BigDecimal {
    const illuviumContract = Illuvium.bind(Address.fromString(ILLUVIUM_ADDRESS));
    const illuviumBalance = toDecimal(illuviumContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18);
    return illuviumBalance;
}