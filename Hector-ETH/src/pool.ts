import { Swap } from '../generated/Pool/UniswapV3Pool'
import { Pool } from '../generated/schema';


export function handleSwap(event: Swap): void {
    const id = event.address.toHexString();
    let pool = Pool.load(id);
    if (!pool) {
        pool = new Pool(id);
    }

    // const pair = UniswapV3Pool.bind(Address.fromString(MATIC_USDT_PAIR));
    // const pool = new Pool(MATIC_USDT_PAIR);
    // log.debug('token0 Price {}', [pool.token0Price.toString()]);
    // log.debug('token1 Price {}', [pool.token1Price.toString()]);

    // const poolDay = new PoolDayData(MATIC_USDT_PAIR);
    // log.debug('poolDay token0 Price {}', [poolDay.token0Price.toString()]);
    // log.debug('poolDay token1 Price {}', [poolDay.token1Price.toString()]);
    pool.save();
}

