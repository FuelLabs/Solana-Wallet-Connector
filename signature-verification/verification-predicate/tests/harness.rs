use fuels::{
    accounts::{predicate::Predicate, Account, ViewOnlyAccount},
    prelude::{abigen, launch_provider_and_get_wallet}, tx::{Witness}, types::{transaction::{Transaction, TxPolicies}, transaction_builders::{BuildableTransaction, ScriptTransactionBuilder}, AssetId, Bits256}
};
use solana_sdk::signer::{keypair::Keypair, Signer};

const PREDICATE_BINARY_PATH: &str = "./out/debug/verification-predicate.bin";

abigen!(Predicate(
    name = "MyPredicate",
    abi = "verification-predicate/out/debug/verification-predicate-abi.json"
));

#[tokio::test]
async fn valid_signature_transfers_funds() {
    let fuel_wallet = launch_provider_and_get_wallet().await.unwrap();

    // Create solana wallet
    let solana_keypair = Keypair::new();
    let solana_address = solana_keypair.pubkey();

    let fuel_provider = fuel_wallet.provider().unwrap();

    // Create the predicate by setting the signer and pass in the witness argument
    let witness_index = 0;
    let configurables = MyPredicateConfigurables::new().with_SIGNER(Bits256(solana_address.to_bytes()));
    let predicate_data = MyPredicateEncoder::encode_data(witness_index);
    let predicate = Predicate::load_from(PREDICATE_BINARY_PATH)
        .unwrap()
        .with_provider(fuel_provider.clone())
        .with_data(predicate_data)
        .with_configurables(configurables);

    // Define the quantity and asset that the predicate account will contain
    let starting_balance = 100;
    let asset_id = AssetId::default();
    
    // Define the amount that will be transferred from the predicate to the recipient for a test
    let transfer_amount = 10;

    // Fund the predicate to check the change of balance upon signature recovery
    fuel_wallet
        .transfer(
            &predicate.address().clone(),
            starting_balance,
            asset_id,
            TxPolicies::default(),
        )
        .await
        .unwrap();

    // Create a transaction to send to the Fuel Network
    // Fetch predicate input in order to have a UTXO with funds for transfer
    let inputs = predicate
        .get_asset_inputs_for_amount(asset_id, starting_balance)
        .await
        .unwrap();

    // Specify amount to transfer to reciepient, send the rest back to the predicate
    let outputs = predicate.get_asset_outputs_for_amount(fuel_wallet.address(), asset_id, transfer_amount);
    let transaction_builder = ScriptTransactionBuilder::prepare_transfer(inputs, outputs, TxPolicies::default().with_witness_limit(72));
    let mut script_transaction = transaction_builder.build(fuel_provider).await.unwrap();

    let consensus_parameters = fuel_wallet.provider().unwrap().consensus_parameters();
    let tx_id = script_transaction.id(consensus_parameters.chain_id);

    let signature = solana_keypair.sign_message(&(*tx_id));
    let signature: [u8; 64] = signature.into();

    script_transaction.append_witness(Witness::from(signature.to_vec())).unwrap();

    let balance_before = predicate.get_asset_balance(&asset_id).await.unwrap();

    let _tx_id = fuel_provider
        .send_transaction(script_transaction)
        .await
        .unwrap();

    let balance_after = predicate.get_asset_balance(&asset_id).await.unwrap();

    assert_eq!(balance_before, starting_balance);
    assert_eq!(balance_after, starting_balance - transfer_amount);
}
