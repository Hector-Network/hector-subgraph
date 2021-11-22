import { RebaseCall } from '../generated/sHectorERC20V1/sHectorERC20'
import { HectorERC20 } from '../generated/sHectorERC20V1/HectorERC20'
import { Rebase } from '../generated/schema'
import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import {HEC_ERC20_CONTRACT, STAKING_CONTRACT_V1} from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import {getHECUSDRate} from './utils/Price';

export function rebaseFunction(call: RebaseCall): void {
    let rebaseId = call.transaction.hash.toHex()
    var rebase = Rebase.load(rebaseId)
    log.debug("Rebase_V1 event on TX {} with amount {}", [rebaseId, toDecimal(call.inputs.profit_, 9).toString()])

    if (rebase == null && call.inputs.profit_.gt(BigInt.fromI32(0))) {
        let hec_contract = HectorERC20.bind(Address.fromString(HEC_ERC20_CONTRACT))

        rebase = new Rebase(rebaseId)
        rebase.amount = toDecimal(call.inputs.profit_, 9)
        rebase.stakedHecs = toDecimal(hec_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V1)), 9)
        rebase.contract = STAKING_CONTRACT_V1
        rebase.percentage = rebase.amount.div(rebase.stakedHecs)
        rebase.transaction = rebaseId
        rebase.timestamp = call.block.timestamp
        rebase.value = rebase.amount.times(getHECUSDRate())
        rebase.save()
    }
}