// Dutch Auction module for SuiIntents
// Handles price discovery with linear rate decay

module suiintents::dutch_auction {

    public struct DutchAuction has store, drop, copy {
        start_amount: u64,      
        end_amount: u64,       
        start_time: u64,      
        duration_ms: u64,     
    }
    
    // Create a new Dutch Auction
    public fun new(
        start_amount: u64,
        end_amount: u64,
        start_time: u64,
        duration_ms: u64,
    ): DutchAuction {
        assert!(start_amount >= end_amount, 0); // E_INVALID_AUCTION
        DutchAuction {
            start_amount,
            end_amount,
            start_time,
            duration_ms,
        }
    }
    
    // Calculate current required output amount based on elapsed time
    // Decays linearly: start_amount -> end_amount over duration
    public fun get_current_price(auction: &DutchAuction, current_time: u64): u64 {
        if (current_time <= auction.start_time) {
            return auction.start_amount
        };
        
        let elapsed = current_time - auction.start_time;
        
        if (elapsed >= auction.duration_ms) {
            return auction.end_amount
        };
        
        let diff = auction.start_amount - auction.end_amount;
        let decrease = (diff * elapsed) / auction.duration_ms;
        
        auction.start_amount - decrease
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
    
    // Field accessors
    public fun start_amount(auction: &DutchAuction): u64 { auction.start_amount }
    public fun end_amount(auction: &DutchAuction): u64 { auction.end_amount }
    public fun start_time(auction: &DutchAuction): u64 { auction.start_time }
    public fun duration(auction: &DutchAuction): u64 { auction.duration_ms }
    
    #[test_only]
    public fun create_for_testing(
        start_amount: u64,
        end_amount: u64,
        start_time: u64,
        duration_ms: u64,
    ): DutchAuction {
        new(start_amount, end_amount, start_time, duration_ms)
    }
}
