use aiken/crypto.{Blake2b_256, Hash}
use answer/types/action.{Action, Burn, Mint}
use answer/types/redeemer.{MyRedeemer}
use answer/util
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

validator check_redeemer {
  mint(redeemer: ByteArray, _policy_id: PolicyId, _tx: Transaction) {
    (redeemer == "Hello, World!")?
  }

  else(_) {
    fail
  }
}

validator check_redeemer_2 {
  mint(redeemer: MyRedeemer, policy_id: PolicyId, tx: Transaction) {
    trace @"redeemer": redeemer

    let MyRedeemer {
      output_reference: (transaction_id, output_index),
      is_minting,
    } = redeemer

    let Transaction { mint, inputs, .. } = tx
    let mint_qty = mint |> util.mint_qty(policy_id)

    if is_minting? {
      and {
        (mint_qty > 0)?,
        util.consume_utxo(
          inputs,
          OutputReference { transaction_id, output_index },
        )?,
      }
    } else {
      (mint_qty < 0)?
    }
  }

  else(_) {
    fail
  }
}

validator nft(
  transaction_id: Hash<Blake2b_256, Transaction>,
  output_index: Int,
) {
  mint(redeemer action: Action, policy_id: PolicyId, tx: Transaction) {
    trace @"action": action

    let Transaction { mint, inputs, .. } = tx
    let mint_qty = mint |> util.mint_qty(policy_id)

    when action is {
      Mint -> and {
          (mint_qty == 1)?,
          util.consume_utxo(
            inputs,
            OutputReference { transaction_id, output_index },
          )?,
        }
      Burn -> (mint_qty == -1)?
    }
  }

  else(_) {
    fail
  }
}
