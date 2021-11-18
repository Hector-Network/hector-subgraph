import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { HectorERC20 } from '../../generated/HectorStakingV1/HectorERC20';
import { sHectorERC20 } from '../../generated/HectorStakingV1/sHectorERC20';
// import { sOlympusERC20V2 } from '../../generated/HectorStaking/sHectorERC20';
import { CirculatingSupply } from '../../generated/HectorStakingV1/CirculatingSupply';
import { ERC20 } from '../../generated/HectorStakingV1/ERC20';
import { UniswapV2Pair } from '../../generated/HectorStakingV1/UniswapV2Pair';
// import { MasterChef } from '../../generated/HectorStaking/MasterChef';
import { HectorStaking } from '../../generated/HectorStakingV1/HectorStaking';
// import { ConvexAllocator } from '../../generated/HectorStaking/ConvexAllocator';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import {
    // AAVE_ALLOCATOR,
    // ADAI_ERC20_CONTRACT,
    CIRCULATING_SUPPLY_CONTRACT,
    CIRCULATING_SUPPLY_CONTRACT_BLOCK,
    // CONVEX_ALLOCATOR1,
    // CONVEX_ALLOCATOR1_BLOCK,
    // CONVEX_ALLOCATOR2,
    // CONVEX_ALLOCATOR2_BLOCK,
    ERC20DAI_CONTRACT,
    // ERC20FRAX_CONTRACT,
    // LUSD_ERC20_CONTRACT,
    // LUSD_ERC20_CONTRACTV2_BLOCK,
    // OHMDAI_ONSEN_ID,
    HEC_ERC20_CONTRACT,
    // ONSEN_ALLOCATOR,
    SHEC_ERC20_CONTRACT_V1,
    // SOHM_ERC20_CONTRACTV2,
    // SOHM_ERC20_CONTRACTV2_BLOCK,
    STAKING_CONTRACT_V1,
    // STAKING_CONTRACT_V2,
    // STAKING_CONTRACT_V2_BLOCK,
    // SUSHI_MASTERCHEF,
    // SUSHI_OHMDAI_PAIR,
    // SUSHI_OHMETH_PAIR,
    // SUSHI_OHMLUSD_PAIR,
    TREASURY_ADDRESS,
    // TREASURY_ADDRESS_V2,
    // TREASURY_ADDRESS_V2_BLOCK,
    // SUSHI_OHMETH_PAIR_BLOCK,
    // UNI_OHMFRAX_PAIR,
    // UNI_OHMFRAX_PAIR_BLOCK,
    // UNI_OHMLUSD_PAIR_BLOCK,
    // WETH_ERC20_CONTRACT,
    // XSUSI_ERC20_CONTRACT,
    USDC_ERC20_CONTRACT,
    WFTM_ERC20_CONTRACT,
    SPIRIT_HECUSDC_PAIR,
    SPIRIT_HECUSDC_PAIR_BLOCK,
    SPOOKY_HECDAI_PAIR,
    STAKING_CONTRACT_V2_BLOCK,
    STAKING_CONTRACT_V2,
    SHEC_ERC20_CONTRACT_V2_BLOCK,
    SHEC_ERC20_CONTRACT_V2
} from './Constants';
import {hourFromTimestamp} from './Dates';
import { toDecimal } from './Decimals';
import { getHECUSDRate, getDiscountedPairUSD, getPairUSD, getFTMUSDRate } from './Price';
// import { getHolderAux } from './Aux';
// import { updateBondDiscounts } from './BondDiscounts';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    // TODO Change it to longer interval after 30 days
    let dayTimestamp = hourFromTimestamp(timestamp, 4);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.ohmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.sOhmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.ohmPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")
        protocolMetric.nextDistributedOhm = BigDecimal.fromString("0")
        protocolMetric.currentAPY = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryUsdcRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryUsdcMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWFTMRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWFTMMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmDaiPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmUsdcPOL = BigDecimal.fromString("0")
        protocolMetric.holders = BigInt.fromI32(0)

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


function getTotalSupply(): BigDecimal{
    let ohm_contract = HectorERC20.bind(Address.fromString(HEC_ERC20_CONTRACT))
    let total_supply = toDecimal(ohm_contract.totalSupply(), 9)
    log.debug("Total Supply {}", [total_supply.toString()])
    return total_supply
}

function getCriculatingSupply(transaction: Transaction, total_supply: BigDecimal): BigDecimal{
    let circ_supply: BigDecimal
    if(transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))){
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        circ_supply = toDecimal(circulatingsupply_contract.HECCirculatingSupply(), 9)
    } else {
        circ_supply = total_supply;
    }
    log.debug("Circulating Supply {}", [total_supply.toString()])
    return circ_supply
}

function getSohmSupply(transaction: Transaction): BigDecimal{
    let sohm_contract_v1 = sHectorERC20.bind(Address.fromString(SHEC_ERC20_CONTRACT_V1))
    let sohm_supply = toDecimal(sohm_contract_v1.circulatingSupply(), 9)

    if(transaction.blockNumber.gt(BigInt.fromString(SHEC_ERC20_CONTRACT_V2_BLOCK))){
        let sohm_contract_v2 = sHectorERC20.bind(Address.fromString(SHEC_ERC20_CONTRACT_V2))
        sohm_supply = sohm_supply.plus(toDecimal(sohm_contract_v2.circulatingSupply(), 9))
    }
    
    log.debug("sHEC Supply {}", [sohm_supply.toString()])
    return sohm_supply
}

function getMV_RFV(transaction: Transaction): BigDecimal[]{
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let usdcERC20 = ERC20.bind(Address.fromString(USDC_ERC20_CONTRACT))
    let wftmERC20 = ERC20.bind(Address.fromString(WFTM_ERC20_CONTRACT))
    // let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
    // let aDaiERC20 = ERC20.bind(Address.fromString(ADAI_ERC20_CONTRACT))
    // let xSushiERC20 = ERC20.bind(Address.fromString(XSUSI_ERC20_CONTRACT))
    // let wethERC20 = ERC20.bind(Address.fromString(WETH_ERC20_CONTRACT))
    // let lusdERC20 = ERC20.bind(Address.fromString(LUSD_ERC20_CONTRACT))

    let hecdaiPair = UniswapV2Pair.bind(Address.fromString(SPOOKY_HECDAI_PAIR))
    let hecusdcPair = UniswapV2Pair.bind(Address.fromString(SPIRIT_HECUSDC_PAIR))

    // let ohmdaiPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIR))
    // let ohmdaiOnsenMC = MasterChef.bind(Address.fromString(SUSHI_MASTERCHEF))
    // let ohmfraxPair = UniswapV2Pair.bind(Address.fromString(UNI_OHMFRAX_PAIR))
    // let ohmlusdPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMLUSD_PAIR))
    // let ohmethPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMETH_PAIR))

    let treasury_address = TREASURY_ADDRESS;
    // if(transaction.blockNumber.gt(BigInt.fromString(TREASURY_ADDRESS_V2_BLOCK))){
    //     treasury_address = TREASURY_ADDRESS_V2;
    // }

    let daiBalance = daiERC20.balanceOf(Address.fromString(treasury_address))
    let usdcBalance = usdcERC20.balanceOf(Address.fromString(treasury_address))
    // let adaiBalance = aDaiERC20.balanceOf(Address.fromString(AAVE_ALLOCATOR))
    // let fraxBalance = fraxERC20.balanceOf(Address.fromString(treasury_address))
    // let xSushiBalance = xSushiERC20.balanceOf(Address.fromString(treasury_address))
    // let xSushi_value = toDecimal(xSushiBalance, 18).times(getXsushiUSDRate())
    let wftmBalance = wftmERC20.balanceOf(Address.fromString(treasury_address))
    let wftmValue = toDecimal(wftmBalance, 18).times(getFTMUSDRate())
    // let lusdBalance = BigInt.fromI32(0)
    // if(transaction.blockNumber.gt(BigInt.fromString(LUSD_ERC20_CONTRACTV2_BLOCK))){
    //     lusdBalance = lusdERC20.balanceOf(Address.fromString(treasury_address))
    // }

    //CONVEX Frax allocator
    // TODO add to mv and mvrfv
    // let convexrfv =  BigInt.fromString("0");
    // if(transaction.blockNumber.gt(BigInt.fromString(CONVEX_ALLOCATOR1_BLOCK))){
    //     let allocator1 = ConvexAllocator.bind(Address.fromString(CONVEX_ALLOCATOR1))
    //     convexrfv = convexrfv.plus(allocator1.totalValueDeployed())
    // }
    // if(transaction.blockNumber.gt(BigInt.fromString(CONVEX_ALLOCATOR2_BLOCK))){
    //     let allocator2 = ConvexAllocator.bind(Address.fromString(CONVEX_ALLOCATOR2))
    //     convexrfv = convexrfv.plus(allocator2.totalValueDeployed())
    // }
    // //Multiplied by 10e9 for consistency
    // convexrfv = convexrfv.times(BigInt.fromString("1000000000"))
    // fraxBalance = fraxBalance.plus(convexrfv)

    //HECDAI
    let hecdaiBalance = hecdaiPair.balanceOf(Address.fromString(treasury_address))
    // let ohmdaiOnsenBalance = ohmdaiOnsenMC.userInfo(BigInt.fromI32(OHMDAI_ONSEN_ID), Address.fromString(ONSEN_ALLOCATOR)).value0
    // let ohmdaiBalance = ohmdaiSushiBalance.plus(ohmdaiOnsenBalance)
    let hecdaiTotalLP = toDecimal(hecdaiPair.totalSupply(), 18)
    let hecdaiPOL = toDecimal(hecdaiBalance, 18).div(hecdaiTotalLP).times(BigDecimal.fromString("100"))
    let hecdaiValue = getPairUSD(hecdaiBalance, SPOOKY_HECDAI_PAIR, 18)
    let hecdaiRFV = getDiscountedPairUSD(hecdaiBalance, SPOOKY_HECDAI_PAIR)

    //HECUSDC
    // TODO Check decimals
    let hecusdcValue = BigDecimal.fromString('0');
    let hecusdcRFV = BigDecimal.fromString('0')
    let hecusdcPOL = BigDecimal.fromString('0')
    if(transaction.blockNumber.gt(BigInt.fromString(SPIRIT_HECUSDC_PAIR_BLOCK))){
        let hecusdcBalance = hecusdcPair.balanceOf(Address.fromString(treasury_address))
        // let ohmdaiOnsenBalance = ohmdaiOnsenMC.userInfo(BigInt.fromI32(OHMDAI_ONSEN_ID), Address.fromString(ONSEN_ALLOCATOR)).value0
        // let ohmdaiBalance = ohmdaiSushiBalance.plus(ohmdaiOnsenBalance)
        let hecusdcTotalLP = toDecimal(hecusdcPair.totalSupply(), 18)
        hecusdcPOL = toDecimal(hecusdcBalance, 18).div(hecusdcTotalLP).times(BigDecimal.fromString("100"))
        hecusdcValue = getPairUSD(hecusdcBalance, SPIRIT_HECUSDC_PAIR, 6)
        hecusdcRFV = getDiscountedPairUSD(hecusdcBalance, SPIRIT_HECUSDC_PAIR)
    }

    //OHMFRAX
    // let ohmfraxBalance = BigInt.fromI32(0)
    // let ohmfrax_value = BigDecimal.fromString("0")
    // let ohmfrax_rfv = BigDecimal.fromString("0")
    // let ohmfraxTotalLP = BigDecimal.fromString("0")
    // let ohmfraxPOL = BigDecimal.fromString("0")
    // if(transaction.blockNumber.gt(BigInt.fromString(UNI_OHMFRAX_PAIR_BLOCK))){
    //     ohmfraxBalance = ohmfraxPair.balanceOf(Address.fromString(treasury_address))
    //     ohmfrax_value = getPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
    //     ohmfrax_rfv = getDiscountedPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
    //     ohmfraxTotalLP = toDecimal(ohmfraxPair.totalSupply(), 18)
    //     if (ohmfraxTotalLP.gt(BigDecimal.fromString("0")) &&  ohmfraxBalance.gt(BigInt.fromI32(0))){
    //         ohmfraxPOL = toDecimal(ohmfraxBalance, 18).div(ohmfraxTotalLP).times(BigDecimal.fromString("100"))
    //     }
    // }

    //OHMLUSD
    // let ohmlusdBalance = BigInt.fromI32(0)
    // let ohmlusd_value = BigDecimal.fromString("0")
    // let ohmlusd_rfv = BigDecimal.fromString("0")
    // let ohmlusdTotalLP = BigDecimal.fromString("0")
    // let ohmlusdPOL = BigDecimal.fromString("0")
    // if(transaction.blockNumber.gt(BigInt.fromString(UNI_OHMLUSD_PAIR_BLOCK))){
    //     ohmlusdBalance = ohmlusdPair.balanceOf(Address.fromString(treasury_address))
    //     ohmlusd_value = getPairUSD(ohmlusdBalance, SUSHI_OHMLUSD_PAIR)
    //     ohmlusd_rfv = getDiscountedPairUSD(ohmlusdBalance, SUSHI_OHMLUSD_PAIR)
    //     ohmlusdTotalLP = toDecimal(ohmlusdPair.totalSupply(), 18)
    //     if (ohmlusdTotalLP.gt(BigDecimal.fromString("0")) &&  ohmlusdBalance.gt(BigInt.fromI32(0))){
    //         ohmlusdPOL = toDecimal(ohmlusdBalance, 18).div(ohmlusdTotalLP).times(BigDecimal.fromString("100"))
    //     }
    // }

    //OHMETH
    // let ohmethBalance = BigInt.fromI32(0)
    // let ohmeth_value = BigDecimal.fromString("0")
    // let ohmeth_rfv = BigDecimal.fromString("0")
    // let ohmethTotalLP = BigDecimal.fromString("0")
    // let ohmethPOL = BigDecimal.fromString("0")
    // if(transaction.blockNumber.gt(BigInt.fromString(SUSHI_OHMETH_PAIR_BLOCK))){
    //     ohmethBalance = ohmethPair.balanceOf(Address.fromString(treasury_address))
    //     log.debug("ohmethBalance {}", [ohmethBalance.toString()])
    //
    //     ohmeth_value = getPairWETH(ohmethBalance, SUSHI_OHMETH_PAIR)
    //     log.debug("ohmeth_value {}", [ohmeth_value.toString()])
    //
    //     ohmeth_rfv = getDiscountedPairUSD(ohmethBalance, SUSHI_OHMETH_PAIR)
    //     ohmethTotalLP = toDecimal(ohmethPair.totalSupply(), 18)
    //     if (ohmethTotalLP.gt(BigDecimal.fromString("0")) &&  ohmethBalance.gt(BigInt.fromI32(0))){
    //         ohmethPOL = toDecimal(ohmethBalance, 18).div(ohmethTotalLP).times(BigDecimal.fromString("100"))
    //     }
    // }

    let stableValueDecimal = toDecimal(daiBalance, 18).plus(toDecimal(usdcBalance, 6))

    let lpValue = hecdaiValue.plus(hecusdcValue)
    let rfvLpValue = hecdaiRFV.plus(hecusdcRFV)

    let mv = stableValueDecimal.plus(lpValue).plus(wftmValue)
    let rfv = stableValueDecimal.plus(rfvLpValue)

    log.debug("Treasury Market Value {}", [mv.toString()])
    log.debug("Treasury RFV {}", [rfv.toString()])
    log.debug("Treasury DAI value {}", [toDecimal(daiBalance, 18).toString()])
    log.debug("Treasury USDC value {}", [toDecimal(usdcBalance, 6).toString()])
    // log.debug("Treasury aDAI value {}", [toDecimal(adaiBalance, 18).toString()])
    // log.debug("Treasury xSushi value {}", [xSushi_value.toString()])
    log.debug("Treasury WFTM value {}", [wftmValue.toString()])
    // log.debug("Treasury LUSD value {}", [toDecimal(lusdBalance, 18).toString()])
    log.debug("Treasury HEC-DAI RFV {}", [hecdaiRFV.toString()])
    log.debug("Treasury HEC-USDC RFV {}", [hecusdcRFV.toString()])
    // log.debug("Treasury Frax value {}", [toDecimal(fraxBalance, 18).toString()])
    // log.debug("Treasury OHM-FRAX RFV {}", [ohmfrax_rfv.toString()])
    // log.debug("Treasury OHM-LUSD RFV {}", [ohmlusd_rfv.toString()])
    // log.debug("Convex Allocator {}", [toDecimal(convexrfv, 18).toString()])

    return [
        mv, 
        rfv,
        // treasuryDaiRiskFreeValue = DAI RFV + DAI
        hecdaiRFV.plus(toDecimal(daiBalance, 18)),
        // treasuryFraxRiskFreeValue = USDC RFV
        hecusdcRFV.plus(toDecimal(usdcBalance, 6)),
        // treasuryDaiMarketValue = DAI LP + DAI
        hecdaiValue.plus(toDecimal(daiBalance, 18)),
        // treasuryFraxMarketValue = FRAX LP * FRAX
        hecusdcValue.plus(toDecimal(usdcBalance, 6)),
        wftmValue,
        wftmValue,
        // POL
        hecdaiPOL,
        hecusdcPOL,
    ]
}

function getNextOHMRebase(transaction: Transaction): BigDecimal{
    let staking_contract_v1 = HectorStaking.bind(Address.fromString(STAKING_CONTRACT_V1))
    let distribution_v1 = toDecimal(staking_contract_v1.epoch().value3,9)
    log.debug("next_distribution v1 {}", [distribution_v1.toString()])
    let next_distribution = distribution_v1

    if(transaction.blockNumber.gt(BigInt.fromString(STAKING_CONTRACT_V2_BLOCK))) {
        let staking_contract_v2 = HectorStaking.bind(Address.fromString(STAKING_CONTRACT_V2))
        let distribution_v2 = toDecimal(staking_contract_v2.epoch().value3,9)
        log.debug("next_distribution v2 {}", [distribution_v2.toString()])
        next_distribution = next_distribution.plus(distribution_v2)
    }

    log.debug("next_distribution total {}", [next_distribution.toString()])

    return next_distribution
}

function getAPY_Rebase(sOHM: BigDecimal, distributedOHM: BigDecimal): BigDecimal[]{
    let nextEpochRebase = sOHM.gt(BigDecimal.fromString('0'))
        ? distributedOHM.div(sOHM).times(BigDecimal.fromString("100"))
        : BigDecimal.fromString('0');

    let nextEpochRebase_number = parseFloat(nextEpochRebase.toString())
    let currentAPY = Math.pow(((Math.min(90,nextEpochRebase_number) / 100) + 1), (365*3)-1)*100

    let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

    log.debug("next_rebase {}", [nextEpochRebase.toString()])
    log.debug("current_apy total {}", [currentAPYdecimal.toString()])

    return [currentAPYdecimal, nextEpochRebase]
}

function getRunway(sOHM: BigDecimal, rfv: BigDecimal, rebase: BigDecimal): BigDecimal{
    // let runway2dot5k = BigDecimal.fromString("0")
    // let runway5k = BigDecimal.fromString("0")
    // let runway7dot5k = BigDecimal.fromString("0")
    // let runway10k = BigDecimal.fromString("0")
    // let runway20k = BigDecimal.fromString("0")
    // let runway50k = BigDecimal.fromString("0")
    // let runway70k = BigDecimal.fromString("0")
    // let runway100k = BigDecimal.fromString("0")
    let runwayCurrent = BigDecimal.fromString("0")

    if(sOHM.gt(BigDecimal.fromString("0")) && rfv.gt(BigDecimal.fromString("0")) &&  rebase.gt(BigDecimal.fromString("0"))){
        let treasury_runway = parseFloat(rfv.div(sOHM).toString())

        // let runway2dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0029438))/3;
        // let runway5k_num = (Math.log(treasury_runway) / Math.log(1+0.003579))/3;
        // let runway7dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0039507))/3;
        // let runway10k_num = (Math.log(treasury_runway) / Math.log(1+0.00421449))/3;
        // let runway20k_num = (Math.log(treasury_runway) / Math.log(1+0.00485037))/3;
        // let runway50k_num = (Math.log(treasury_runway) / Math.log(1+0.00569158))/3;
        // let runway70k_num = (Math.log(treasury_runway) / Math.log(1+0.00600065))/3;
        // let runway100k_num = (Math.log(treasury_runway) / Math.log(1+0.00632839))/3;
        let nextEpochRebase_number = parseFloat(rebase.toString())/100
        let runwayCurrent_num = (Math.log(treasury_runway) / Math.log(1+nextEpochRebase_number))/3;

        // runway2dot5k = BigDecimal.fromString(runway2dot5k_num.toString())
        // runway5k = BigDecimal.fromString(runway5k_num.toString())
        // runway7dot5k = BigDecimal.fromString(runway7dot5k_num.toString())
        // runway10k = BigDecimal.fromString(runway10k_num.toString())
        // runway20k = BigDecimal.fromString(runway20k_num.toString())
        // runway50k = BigDecimal.fromString(runway50k_num.toString())
        // runway70k = BigDecimal.fromString(runway70k_num.toString())
        // runway100k = BigDecimal.fromString(runway100k_num.toString())
        runwayCurrent = BigDecimal.fromString(runwayCurrent_num.toString())
    }

    return runwayCurrent
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);

    //Total Supply
    pm.totalSupply = getTotalSupply()

    //Circ Supply
    pm.ohmCirculatingSupply = getCriculatingSupply(transaction, pm.totalSupply)

    //sOhm Supply
    pm.sOhmCirculatingSupply = getSohmSupply(transaction)

    //OHM Price
    pm.ohmPrice = getHECUSDRate()

    //OHM Market Cap
    pm.marketCap = pm.ohmCirculatingSupply.times(pm.ohmPrice)

    //Total Value Locked
    pm.totalValueLocked = pm.sOhmCirculatingSupply.times(pm.ohmPrice)

    //Treasury RFV and MV
    let mv_rfv = getMV_RFV(transaction)
    pm.treasuryMarketValue = mv_rfv[0]
    pm.treasuryRiskFreeValue = mv_rfv[1]
    pm.treasuryDaiRiskFreeValue = mv_rfv[2]
    pm.treasuryUsdcRiskFreeValue = mv_rfv[3]
    pm.treasuryDaiMarketValue = mv_rfv[4]
    pm.treasuryUsdcMarketValue = mv_rfv[5]
    pm.treasuryWFTMRiskFreeValue = mv_rfv[6]
    pm.treasuryWFTMMarketValue = mv_rfv[7]
    pm.treasuryOhmDaiPOL = mv_rfv[8]
    pm.treasuryOhmUsdcPOL = mv_rfv[9]

    // Rebase rewards, APY, rebase
    pm.nextDistributedOhm = getNextOHMRebase(transaction)
    let apy_rebase = getAPY_Rebase(pm.sOhmCirculatingSupply, pm.nextDistributedOhm)
    pm.currentAPY = apy_rebase[0]
    pm.nextEpochRebase = apy_rebase[1]

    //Runway
    pm.runwayCurrent = getRunway(pm.sOhmCirculatingSupply, pm.treasuryRiskFreeValue, pm.nextEpochRebase)

    //Holders
    // pm.holders = getHolderAux().value
    
    pm.save()
    
    // updateBondDiscounts(transaction)
}