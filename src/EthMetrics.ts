import { WithdrawAndUnwrapCall } from '../generated/EthMetrics/BaseRewardPool';
import { EthMetrics } from '../generated/schema';
import { BaseRewardPool as pool } from '../generated/EthMetrics/BaseRewardPool';
import { Matic } from '../generated/EthMetrics/Matic';
import { UniswapV3Factory } from '../generated/EthMetrics/UniswapV3Factory';
import { WormHole } from '../generated/EthMetrics/WormHole';
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { BASE_REWARD_POOL_ADDRESS, CONVEX_ALLOCATOR_ADDRESS, ETH_WALLET_ADDRESS, MATIC_ADDRESS, MATIC_DAI_PAIR, WORMHOLE_ADDRESS } from './utils/Constants';
import { toDecimal } from './utils/Decimals';

export function handleWithdrawAndUnwrap(call: WithdrawAndUnwrapCall): void {
    const id = call.transaction.hash.toHex();
    let rewardPool = EthMetrics.load(id);
    if (rewardPool == null) {
        rewardPool = new EthMetrics(id);
    }

    rewardPool.timestamp = call.block.timestamp;
    // calculating pool deposit amount
    rewardPool.treasuryBaseRewardPool = getBaseRewardPool();
    rewardPool.treasuryMatic = getTreasuryMaticValue();
    rewardPool.treasuryIlluvium = BigDecimal.fromString('22');
    rewardPool.save();
}

function getBaseRewardPool(): BigDecimal {
    const baseRewardPoolContract = pool.bind(Address.fromString(BASE_REWARD_POOL_ADDRESS));
    const wormHoleContract = WormHole.bind(Address.fromString(WORMHOLE_ADDRESS));
    const lpBalance = toDecimal(baseRewardPoolContract.balanceOf(Address.fromString(CONVEX_ALLOCATOR_ADDRESS)), 18);
    log.debug('Lp Balance: ', [lpBalance.toString()]);
    const lpVirutalPrice = toDecimal(wormHoleContract.get_virtual_price(), 18);
    log.debug('Lp virtual price: ', [lpVirutalPrice.toString()]);
    return lpBalance.times(lpVirutalPrice);
}

function getTreasuryMaticValue(): BigDecimal {
    const maticContract = Matic.bind(Address.fromString(MATIC_ADDRESS));
    const maticBalance = toDecimal(maticContract.balanceOf(Address.fromString(ETH_WALLET_ADDRESS)), 18)
    const pair = UniswapV3Factory.bind(Address.fromString(MATIC_DAI_PAIR));
    let data = pair.try_getPool(Address.fromString('0x6b175474e89094c44da98b954eedeac495271d0f'), Address.fromString(MATIC_ADDRESS), 3000);
    if (data.reverted) {
        log.debug('No Uni v3 pair (.3%) found for {}', [])
        data = pair.try_getPool(Address.fromString('0x6b175474e89094c44da98b954eedeac495271d0f'), Address.fromString(MATIC_ADDRESS), 10000);
    }
    log.debug('MATIC DAI PAIR:', [data.value.toString()]);
    return BigDecimal.fromString('22');
}