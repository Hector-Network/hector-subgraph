import {
    SPIRIT_HECGOHM_PAIR,
    SPOOKY_HECDAI_PAIR,
    SPOOKY_USDC_FTM_PAIR,
    SPOOKY_FTM_BOO_PAIR,
    SPOOKY_CRV_FTM_PAIR,
    SPOOKY_FTM_WETH_PAIR
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/HectorStakingV1/UniswapV2Pair';
import { toDecimal } from './Decimals'


let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')
let BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export function getWETHUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_FTM_WETH_PAIR))

    let reserves = pair.getReserves()
    let ftmReserve = reserves.value0.toBigDecimal() // FTM
    log.debug("ftmReserve {}", [ftmReserve.toString()])
    let wethReserve = reserves.value1.toBigDecimal() // WETH
    log.debug("wethReserve {}", [wethReserve.toString()])

    // GET USDC/FTM rate
    let usdcFtmRate = getFTMUSDRate()

    // (FTM/WETH)*(USDC/FTM) = USDC/WETH 
    let wethRate = ftmReserve.div(wethReserve).times(usdcFtmRate)
    log.debug("weth rate {}", [wethRate.toString()])

    return wethRate
}

export function getCRVUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_CRV_FTM_PAIR))

    let reserves = pair.getReserves()
    let crvReserve = reserves.value0.toBigDecimal() // CRV
    let ftmReserve = reserves.value1.toBigDecimal() // FTM

    // GET USDC/FTM rate
    let usdcFtmRate = getFTMUSDRate()

    // (FTM/CRV)*(USDC/FTM) = USDC/CRV 
    let crvRate = ftmReserve.div(crvReserve).times(usdcFtmRate)
    log.debug("crv rate {}", [crvRate.toString()])

    return crvRate
}

export function getBOOUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_FTM_BOO_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal() // FTM
    let reserve1 = reserves.value1.toBigDecimal() // BOO

    // Calculate FTM/BOO rate
    let ftmBooRate = reserve0.div(reserve1)

    // GET USDC/FTM rate
    let usdcFtmRate = getFTMUSDRate()

    // Calculate USDC/BOO rate
    let usdcBooRate = ftmBooRate.times(usdcFtmRate)
    log.debug("USDC/BOO rate {}", [usdcBooRate.toString()])
    return usdcBooRate
}

export function getFTMUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_USDC_FTM_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal() // USDC
    let reserve1 = reserves.value1.toBigDecimal() // FTM

    let ftmRate = reserve0.div(reserve1).times(BIG_DECIMAL_1E12)
    log.debug("FTM rate {}", [ftmRate.toString()])

    return ftmRate
}

export function getHECUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_HECDAI_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal() // HEC
    let reserve1 = reserves.value1.toBigDecimal() // DAI

    let hecRate = reserve1.div(reserve0).div(BIG_DECIMAL_1E9)
    log.debug("HEC rate {}", [hecRate.toString()])

    return hecRate
}

export function getGOHMUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPIRIT_HECGOHM_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal() // HEC
    let reserve1 = reserves.value1.toBigDecimal() // GOHM

    let hecRate = getHECUSDRate()
    let gohmRate = reserve0.div(reserve1.div(BIG_DECIMAL_1E9)).times(hecRate)
    log.debug("GOHM rate {}", [gohmRate.toString()])

    return gohmRate
}

//(slp_treasury/slp_supply)*(2*sqrt(lp_dai * lp_hec))
export function getDiscountedPairUSD(lp_amount: BigInt, total_lp: BigDecimal, reserves: BigDecimal[], tokenRate: BigDecimal): BigDecimal{
    let lp_token_1 = reserves[0]
    let lp_token_2 = reserves[1]
    let kLast = lp_token_1.times(lp_token_2.times(tokenRate)).truncate(0).digits

    let part1 = toDecimal(lp_amount,18).div(total_lp)
    let two = BigInt.fromI32(2)

    let sqrt = kLast.sqrt();
    let part2 = toDecimal(two.times(sqrt), 0)
    let result = part1.times(part2)
    return result
}

export function getPairUSD(lp_amount: BigInt, total_lp: BigDecimal, reserves: BigDecimal[], token0Rate: BigDecimal, token1Rate: BigDecimal): BigDecimal{
    let lp_token_0 = reserves[0]
    let lp_token_1 = reserves[1]
    let ownedLP = toDecimal(lp_amount,18).div(total_lp)
    let token_0_value = lp_token_0.times(token0Rate)
    let token_1_value = lp_token_1.times(token1Rate)
    let total_lp_usd = token_0_value.plus(token_1_value)

    return ownedLP.times(total_lp_usd)
}
