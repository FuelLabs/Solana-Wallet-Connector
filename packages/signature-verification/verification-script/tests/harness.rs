use fuels::{
    prelude::{abigen, launch_provider_and_get_wallet}, tx::{Witness, TxId, Bytes32}, types::{transaction::{Transaction, TxPolicies}, Bits256, Bytes},
};
use solana_sdk::signer::{keypair::Keypair, Signer};
use std::str::FromStr;

const SCRIPT_BINARY_PATH: &str = "./out/debug/verification-script.bin";

abigen!(Script(
    name = "MyScript",
    abi = "verification-script/out/debug/verification-script-abi.json"
));

#[tokio::test]
async fn valid_signature_returns_true_for_validating() {
    let fuel_wallet = launch_provider_and_get_wallet().await.unwrap();

    // Create solana wallet
    let solana_keypair = Keypair::new();
    let solana_address = solana_keypair.pubkey();

    // Create the script by setting the signer and pass in the witness argument
    let witness_index = 1;
    let configurables = MyScriptConfigurables::new().with_SIGNER(Bits256(solana_address.to_bytes()));

    let script_call_handler = MyScript::new(fuel_wallet.clone(), SCRIPT_BINARY_PATH)
        .with_configurables(configurables)
        .main(witness_index)
        .with_tx_policies(TxPolicies::default().with_witness_limit(144).with_script_gas_limit(10000000));

    let mut tx = script_call_handler.build_tx().await.unwrap();

    // Now that we have the tx the solana wallet must sign the ID
    let consensus_parameters = fuel_wallet.provider().unwrap().consensus_parameters();
    let tx_id = tx.id(consensus_parameters.chain_id);

    println!("tx_id {:#?}", tx_id);
    println!("tx_id {:#?}", *tx_id);
    println!("tx_id {:#?}", tx_id.to_string().len());
    println!("tx_id {:#?}", (*tx_id).len());

    let signature = solana_keypair.sign_message(&(*tx_id));
    let signature: [u8; 64] = signature.into();

    let new_signer = Keypair::from_base58_string("3ozYXfVgcdYqPbtdzfSufrJY8QUtrhPkb3bCbfbN9koy24iwAPbeZWsFg8MX9s75LftJRWU8zMUokmZnK2Y7gQ23");
    let test_tx_id = "0x73770495abeca393c0c0507c2f96f8f2ee3589c429683ecf7bf2a7b055962f2b";
    let test_tx_id = TxId::from(Bytes32::from_str(test_tx_id).unwrap());
    println!("test_tx_id {:#?}", test_tx_id);
    println!("test_tx_id.len() {:#?}", test_tx_id.len());
    let new_sig = new_signer.sign_message(&(*test_tx_id));
    println!("new_sig {:#?}", new_sig);
    let new_sig: [u8; 64] = new_sig.into();
    println!("new_sig {:#?}", new_sig);
    println!("new_sig.len() {:#?}", new_sig.len());

    // Add the signed data as a witness onto the tx
    tx.append_witness(Witness::from(signature.to_vec())).unwrap();

    // Execute the tx
    let tx_id = fuel_wallet
        .provider()
        .unwrap()
        .send_transaction(tx)
        .await
        .unwrap();

    let receipts = fuel_wallet
        .provider()
        .unwrap()
        .tx_status(&tx_id)
        .await
        .unwrap()
        .take_receipts();

    let response = script_call_handler.get_response(receipts).unwrap();

    assert!(false);
    assert!(response.value);
}

#[tokio::test]
async fn invalid_signature_returns_false_for_failed_validation() {
    let fuel_wallet = launch_provider_and_get_wallet().await.unwrap();

    // Create solana wallet
    let solana_keypair = Keypair::new();
    let solana_address = solana_keypair.pubkey();

    // Create the script by setting the signer and pass in the witness argument
    let witness_index = 1;
    let configurables = MyScriptConfigurables::new().with_SIGNER(Bits256(solana_address.to_bytes()));

    let script_call_handler = MyScript::new(fuel_wallet.clone(), SCRIPT_BINARY_PATH)
        .with_configurables(configurables)
        .main(witness_index)
        .with_tx_policies(TxPolicies::default().with_witness_limit(144).with_script_gas_limit(10000000));

    let mut tx = script_call_handler.build_tx().await.unwrap();

    // Now that we have the tx the solana wallet must sign the ID
    let consensus_parameters = fuel_wallet.provider().unwrap().consensus_parameters();
    let tx_id = tx.id(consensus_parameters.chain_id);

    let signature = solana_keypair.sign_message(&(*tx_id));
    let mut signature: [u8; 64] = signature.into();

    // Invalidate the signature to force a differenct address to be recovered
    // Flipping 1 byte is sufficient to fail recovery
    // Keep it within the bounds of a u8
    if signature[0] < 255 {
        signature[0] += 1;
    } else {
        signature[0] -= 1;
    }
 
    // Add the signed data as a witness onto the tx
    tx.append_witness(Witness::from(signature.to_vec())).unwrap();

    // Execute the tx
    let tx_id = fuel_wallet
        .provider()
        .unwrap()
        .send_transaction(tx)
        .await
        .unwrap();

    let receipts = fuel_wallet
        .provider()
        .unwrap()
        .tx_status(&tx_id)
        .await
        .unwrap()
        .take_receipts();

    let response = script_call_handler.get_response(receipts).unwrap();

    assert!(!response.value);
}