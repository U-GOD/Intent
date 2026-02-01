#[test_only]
module suiintents::intent_tests {
    use suiintents::intent::{
        Intent,
        IntentRegistry,
        create_test_registry,
        destroy_test_registry,
        get_total_intents,
        get_filled_intents,
        get_min_solver_stake,
        create_intent,
        fill_intent,
        create_test_auction,
        get_current_rate,
        is_auction_active,
        get_time_remaining,
    };
    use sui::test_scenario::{Self as ts};
    use sui::clock::{Self};
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
        let scenario = ts::begin(CREATOR);
        
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
    
    #[test]
    fun test_fill_intent() {
        let mut scenario = ts::begin(CREATOR);
        
        // TX1: Creator creates intent
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);
        
        let input_coin = coin::mint_for_testing<SUI>(100_000_000_000, ts::ctx(&mut scenario));
        
        let mut registry = create_test_registry(ts::ctx(&mut scenario));
        
        create_intent<SUI, SUI>(
            &mut registry,
            input_coin,
            95_000_000_000,
            10000,
            60000,
            &clock,
            ts::ctx(&mut scenario),
        );
        
        // Share registry for next tx (IntentRegistry now has store)
        transfer::public_share_object(registry);
        clock::share_for_testing(clock);
        
        // TX2: Solver fills the intent
        ts::next_tx(&mut scenario, SOLVER);
        {
            let mut registry = ts::take_shared<IntentRegistry>(&scenario);
            let clock = ts::take_shared<sui::clock::Clock>(&scenario);
            let intent = ts::take_shared<Intent<SUI>>(&scenario);
            
            let output_coin = coin::mint_for_testing<SUI>(100_000_000_000, ts::ctx(&mut scenario));
            
            fill_intent<SUI, SUI>(
                &mut registry,
                intent,
                output_coin,
                &clock,
                ts::ctx(&mut scenario),
            );
            
            assert!(get_total_intents(&registry) == 1, 0);
            assert!(get_filled_intents(&registry) == 1, 1);
            
            ts::return_shared(registry);
            ts::return_shared(clock);
        };
        
        // TX3: Verify solver received input tokens
        ts::next_tx(&mut scenario, SOLVER);
        {
            let received_coin = ts::take_from_address<Coin<SUI>>(&scenario, SOLVER);
            assert!(coin::value(&received_coin) == 100_000_000_000, 2);
            ts::return_to_address(SOLVER, received_coin);
        };
        
        // TX4: Verify creator received output tokens
        ts::next_tx(&mut scenario, CREATOR);
        {
            let received_coin = ts::take_from_address<Coin<SUI>>(&scenario, CREATOR);
            assert!(coin::value(&received_coin) == 100_000_000_000, 3);
            ts::return_to_address(CREATOR, received_coin);
        };
        
        ts::end(scenario);
    }
}
