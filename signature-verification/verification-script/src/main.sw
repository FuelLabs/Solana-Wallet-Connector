script;

use std::{
    b512::B512,
    constants::ZERO_B256,
    tx::{
        tx_id,
        tx_witness_data,
    },
    ecr::{ed_verify, EcRecoverError},
    hash::*
};

configurable {
    /// The Solana address that signed the transaction
    SIGNER: b256 = ZERO_B256
}

fn main(witness_index: u64) -> bool {
    // Retrieve the Solana signature from the witness data in the Tx at the specified index.
    let signature: B512 = tx_witness_data(witness_index);

    // Hash the Fuel Tx (as the signed message) and attempt to recover the signer from the signature.
    let result = ed_recover_svm_address(signature, sha256(tx_id()));

    // If the signers match then the predicate has validated the Tx.
    if result.is_ok() {
        if SIGNER == result.unwrap() {
            return true;
        }
    }

    // Otherwise an invalid signature has been passed and we invalidate the Tx.
    false
}

fn ed_recover_svm_address(signature: B512, msg_hash: b256) -> Result<b256, EcRecoverError> {
    let pub_key_result = ed_recover(signature, msg_hash);

    match pub_key_result {
        Result::Err(e) => Result::Err(e),
        _ => {
            let pub_key = pub_key_result.unwrap();
            let pub_key_hash = sha256(((pub_key.bytes)[0], (pub_key.bytes)[1]));
            Ok(pub_key_hash)
        }
    }
}

fn ed_recover(signature: B512, msg_hash: b256) -> Result<B512, EcRecoverError> {
    let public_key = B512::new();
    let was_error = asm(buffer: public_key.bytes, sig: signature.bytes, hash: msg_hash) {
        ed19 buffer sig hash;
        err
    };
    // check the $err refister to see if the `ed19` opcode succeeded
    if was_error == 1 {
        Err(EcRecoverError::UnrecoverablePublicKey)
    } else {
        Ok(public_key)
    }
}
