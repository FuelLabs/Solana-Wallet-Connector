use fuels::{
    prelude::{abigen, launch_provider_and_get_wallet},
}
use solana::account::create_account_for_test;

abigen!(Script(
    name = "MyScript",
    abi = "verification-script/out/debug/verification-script-abi.json"
));

#[tokio::test]
async fn valid_signature_returns_true_for_validating() {
    let fuel_wallet = launch_provider_and_get_wallet().await.unwrap();

    let fuel_provider = fuel_wallet.provider().unwrap();

    // Create solana wallet
    let solana_account = create_account_for_test();
    let solana_address = solana_account.owner;

    // Create the predicate by setting the signer and pass in the witness agrument
    let witness_index = 1;
    let configurables = MyScriptConfigurables::new().with_SIGNER()
}