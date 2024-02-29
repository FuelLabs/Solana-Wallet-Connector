script;

use std::{
    b512::B512,
    constants::ZERO_B256,
    tx::{
        tx_id,
        tx_witness_data,
    },
    ecr::{ed_verify, EcRecoverError},
    logging::log,
};

configurable {
    /// The Solana address that signed the transaction
    SIGNER: b256 = ZERO_B256
}

fn main(witness_index: u64) -> bool {
    log(witness_index);
    // Retrieve the Solana signature from the witness data in the Tx at the specified index.
    let signature: B512 = tx_witness_data(witness_index);
    log(signature);
    log(SIGNER);
    // Attempt to recover the signer from the signature.
    let result = ed_verify(SIGNER, signature, tx_id());
    log(tx_id());
    log(result.is_ok());

    return result.is_ok();
}
