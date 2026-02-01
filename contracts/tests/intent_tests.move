#[test_only]
module suiintents::intent_tests {
    use suiintents::intent::{
        IntentRegistry,
        create_test_registry,
        destroy_test_registry,
        get_total_intents,
        get_filled_intents,
        get_min_solver_stake,
        create_intent,
    };
    use sui::test_scenario::{Self as ts};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    const CREATOR: address = @0xCAFE;
    const SOLVER: address = @0xBEEF;
    
    #[test]
    fun test_registry_initialization() {
        let mut scenario = ts::begin(CREATOR);

        let registry = create_test_registry(ts::ctx(&mut scenario));

        assert!(get_total_intents(&registry) == 0, 0);
        assert!(get_filled_intents(&registry) == 0, 1);
        assert!(get_min_solver_stake(&registry) == 100_000_000_000, 2);

        destroy_test_registry(registry);
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_create_intent() {
        let mut scenario = ts::begin(CREATOR);
        
        let mut registry = create_test_registry(ts::ctx(&mut scenario));
        
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000); // Set time to 1000ms
        
        let input_coin = coin::mint_for_testing<SUI>(100_000_000_000, ts::ctx(&mut scenario));
        
        create_intent<SUI, SUI>(
            &mut registry,
            input_coin,
            95_000_000_000,  // min_output: 95 SUI equivalent
            10000,           // start_rate: 10000 basis points (1:1)
            60000,           // duration: 60 seconds
            &clock,
            ts::ctx(&mut scenario),
        );
        
        assert!(get_total_intents(&registry) == 1, 0);
        assert!(get_filled_intents(&registry) == 0, 1);
        
        destroy_test_registry(registry);
        clock::destroy_for_testing(clock);
        
        ts::end(scenario);
    }
}
