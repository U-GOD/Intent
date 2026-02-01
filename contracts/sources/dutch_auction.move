// Dutch Auction module for SuiIntents
// Handles price discovery with linear rate decay

module suiintents::dutch_auction {

    public struct DutchAuction has store, drop, copy {
        start_rate: u64,      
        end_rate: u64,       
        start_time: u64,      
        duration_ms: u64,     
    }
    
    // Create a new Dutch Auction
    public fun new(
        start_rate: u64,
        end_rate: u64,
        start_time: u64,
        duration_ms: u64,
    ): DutchAuction {
        DutchAuction {
            start_rate,
            end_rate,
            start_time,
            duration_ms,
        }
    }
    
    // Calculate current auction rate based on elapsed time
    // Rate decays linearly: start_rate -> end_rate over duration
    public fun get_current_rate(auction: &DutchAuction, current_time: u64): u64 {
        if (current_time <= auction.start_time) {
            return auction.start_rate
        };
        
        let elapsed = current_time - auction.start_time;
        
        if (elapsed >= auction.duration_ms) {
            return auction.end_rate
        };
        
        let rate_diff = auction.start_rate - auction.end_rate;
        let decrease = (rate_diff * elapsed) / auction.duration_ms;
        
        auction.start_rate - decrease
    }
    
    public fun is_active(auction: &DutchAuction, current_time: u64): bool {
        let end_time = auction.start_time + auction.duration_ms;
        current_time < end_time
    }
    
    public fun get_time_remaining(auction: &DutchAuction, current_time: u64): u64 {
        let end_time = auction.start_time + auction.duration_ms;
        if (current_time >= end_time) {
            0
        } else {
            end_time - current_time
        }
    }
    
    // Calculate required output for a given input at current rate
    // Rate is in basis points (10000 = 1:1 ratio)
    public fun calculate_required_output(
        auction: &DutchAuction, 
        input_amount: u64, 
        current_time: u64
    ): u64 {
        let rate = get_current_rate(auction, current_time);
        (input_amount * rate) / 10000
    }
    
    // Field accessors
    public fun start_rate(auction: &DutchAuction): u64 { auction.start_rate }
    public fun end_rate(auction: &DutchAuction): u64 { auction.end_rate }
    public fun start_time(auction: &DutchAuction): u64 { auction.start_time }
    public fun duration(auction: &DutchAuction): u64 { auction.duration_ms }
    
    #[test_only]
    public fun create_for_testing(
        start_rate: u64,
        end_rate: u64,
        start_time: u64,
        duration_ms: u64,
    ): DutchAuction {
        new(start_rate, end_rate, start_time, duration_ms)
    }
}
