#[test_only]
module suiintents::intent_tests {
    use suiintents::intent::{
        create_test_registry,
        destroy_test_registry,
        get_total_intents,
        get_filled_intents,
        get_min_solver_stake,
        create_intent,
        create_test_auction,
        get_current_rate,
        is_auction_active,
        get_time_remaining,
    };
    use sui::test_scenario::{Self as ts};
    use sui::clock::{Self};
    use sui::coin::{Self};
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
        clock::set_for_testing(&mut clock, 1000);
        
        let input_coin = coin::mint_for_testing<SUI>(100_000_000_000, ts::ctx(&mut scenario));
        
        create_intent<SUI, SUI>(
            &mut registry,
            input_coin,
            95_000_000_000,
            10000,
            60000,
            &clock,
            ts::ctx(&mut scenario),
        );
        
        assert!(get_total_intents(&registry) == 1, 0);
        assert!(get_filled_intents(&registry) == 0, 1);
        
        destroy_test_registry(registry);
        clock::destroy_for_testing(clock);
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_auction_rate_decay() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create auction: rate decays from 10000 to 5000 over 100 seconds
        // start_rate = 10000 (100% of 1:1)
        // end_rate = 5000 (50% of 1:1)
        // duration = 100000 ms (100 seconds)
        let auction = create_test_auction(
            10000,   
            5000,     
            0,       
            100000,  
        );
        
        assert!(get_current_rate(&auction, 0) == 10000, 0);
        
        assert!(get_current_rate(&auction, 50000) == 7500, 1);
        
        assert!(get_current_rate(&auction, 100000) == 5000, 2);
        
        assert!(get_current_rate(&auction, 150000) == 5000, 3);
        
        assert!(is_auction_active(&auction, 0) == true, 4);
        assert!(is_auction_active(&auction, 50000) == true, 5);
        assert!(is_auction_active(&auction, 100000) == false, 6);
        
        assert!(get_time_remaining(&auction, 0) == 100000, 7);
        assert!(get_time_remaining(&auction, 50000) == 50000, 8);
        assert!(get_time_remaining(&auction, 100000) == 0, 9);
        
        ts::end(scenario);
    }
}
