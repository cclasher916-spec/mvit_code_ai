from agent_backend.supabase_bridge import SupabaseBridge

b = SupabaseBridge()
if b.is_active():
    # Test upsert one leaderboard entry
    b.upsert_leaderboard(
        member_name="Agilesh S",
        rank=1,
        total_solved=826,
        streak=0,
        rank_type="college",
        period="all_time"
    )
    print("Done!")
