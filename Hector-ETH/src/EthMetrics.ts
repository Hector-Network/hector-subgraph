import { EthMetric, Pool, PoolDayData, Token } from '../generated/schema';
import { BaseRewardPool, WithdrawAllAndUnwrapCall } from '../generated/EthMetrics/BaseRewardPool';
import { WormHole } from '../generated/EthMetrics/WormHole';
import { Matic } from '../generated/EthMetrics/Matic';
import { Illuvium } from '../generated/EthMetrics/Illuvium';
import { UniswapV3Factory } from '../generated/EthMetrics/UniswapV3Factory';
import { UniswapV3Pool } from '../generated/EthMetrics/UniswapV3Pool';
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { BASE_REWARD_POOL_ADDRESS, CONVEX_ALLOCATOR_ADDRESS, ETH_USDT_PAIR, ETH_WALLET_ADDRESS, ILLUVIUM_ADDRESS, IllUV_ETH_PAIR, MATIC_ADDRESS, MATIC_USDT_PAIR, WORMHOLE_ADDRESS } from '../constants';

const DEFAULT_DECIMALS = 18;
const FixedPoint_Q96_BD = BigInt.fromI32(2).pow(96).toBigDecimal();
const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);
const ZERO_BD = BigDecimal.fromString('0');
const BI_18 = BigInt.fromI32(18);
const BI_6 = BigInt.fromI32(6);

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
    const maticContract = Matic.bind(Address.fromString(MATIC_ADDRESS));
    const maticBalance = toDecimal(maticContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18);
    const illuviumContract = Illuvium.bind(Address.fromString(ILLUVIUM_ADDRESS));
    const illuviumBalance = toDecimal(illuviumContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18);
    rewardPool.treasuryBaseRewardPool = getBaseRewardPool();
    rewardPool.treasuryMaticBalance = getTreasuryMaticValue(maticBalance);
    rewardPool.treasuryIlluviumBalance = getTreasuryIlluviumValue(illuviumBalance);
    rewardPool.maticTokenAmount = maticBalance;
    rewardPool.illuviumTokenAmount = illuviumBalance;
    rewardPool.save();
}

export function getBaseRewardPool(): BigDecimal {
    const baseRewardPoolContract = BaseRewardPool.bind(Address.fromString(BASE_REWARD_POOL_ADDRESS));
    const wormHoleContract = WormHole.bind(Address.fromString(WORMHOLE_ADDRESS));
    const lpBalance = toDecimal(baseRewardPoolContract.balanceOf(Address.fromString(CONVEX_ALLOCATOR_ADDRESS)), 18);
    const lpVirutalPrice = toDecimal(wormHoleContract.get_virtual_price(), 18);
    return lpBalance.times(lpVirutalPrice);
}

function getTreasuryMaticValue(maticBalance: BigDecimal): BigDecimal {

    log.debug('Matic Balance {}', [maticBalance.toString()])
    const pair = UniswapV3Pool.bind(Address.fromString(MATIC_USDT_PAIR));
    const result = pair.try_slot0();
    if (!result.reverted) {
        let sqrtPrice = (result.value.value0).toBigDecimal().div(FixedPoint_Q96_BD);
        let maticPrice = sqrtPrice.times(sqrtPrice)
            .times(exponentToBigDecimal(BI_18))
            .div(exponentToBigDecimal(BI_6));
        return maticPrice.times(maticBalance);
    } else {
        return ZERO_BD;
    }
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    let bd = BigDecimal.fromString('1');
    for (let i = ZERO_BI; i.lt(decimals); i = i.plus(ONE_BI)) {
        bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd;
}


function getTreasuryIlluviumValue(illuviumBalance: BigDecimal): BigDecimal {
    const pair = UniswapV3Pool.bind(Address.fromString(IllUV_ETH_PAIR));
    const result = pair.try_slot0();
    if (!result.reverted) {
        const sqrtPrice = (result.value.value0).toBigDecimal().div(FixedPoint_Q96_BD);
        const ilvPerETH = sqrtPrice.times(sqrtPrice)
            .times(exponentToBigDecimal(BI_18))
            .div(exponentToBigDecimal(BI_18));

        const ethUSDTPair = UniswapV3Pool.bind(Address.fromString(ETH_USDT_PAIR));
        const res = ethUSDTPair.try_slot0();
        if (!res.reverted) {
            const ethUSDTSqrtPrice = (res.value.value0).toBigDecimal().div(FixedPoint_Q96_BD);
            const ethUSDTPrice = ethUSDTSqrtPrice.times(ethUSDTSqrtPrice)
                .times(exponentToBigDecimal(BI_18))
                .div(exponentToBigDecimal(BI_6));
            const illuviumUsdPrice = ethUSDTPrice.times(ilvPerETH);
            log.debug('illuvium USD PRICE {}', [illuviumUsdPrice.toString()]);
            return illuviumUsdPrice.times(illuviumBalance);
        } else {
            return ZERO_BD;
        }
    } else {
        return ZERO_BD;
    }
}