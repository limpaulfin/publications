const HISTORY_USAGE_POLICY = {
    role: "evolutionary_context_only",
    base_weight: 0.2,
    dynamic_weighting: true,
    max_influence_on_current_interpretation: 0.35,
    cross_session_claim_requires_min_evidence_count: 2,
    notes: [
        "Interpret current spread FIRST on its own internal structure",
        "Use history only AFTER current spread meaning is established",
        "Cross-session themes must be evidence-backed and traceable",
        "Do not force continuity when symbolic evidence is weak",
        "Prefer patterns that repeat across 2+ sessions"
    ]
};

const HISTORY_INTERPRETATION_POLICY = {
    mode: "current_spread_primary_with_evolutionary_context",
    output_sections: [
        "current_spread_reading",
        "cross_session_resonances",
        "soul_evolution_narrative",
        "active_pattern_warnings",
        "next_integration_step"
    ]
};
