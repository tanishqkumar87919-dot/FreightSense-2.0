-- ==============================================================================
-- FreightSense 2.0 - Row-Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- Description: Enforces multi-tenant workspace isolation, private user data
--              protection, public market read access, and service-role ingestion.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validated_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_reliability ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_congestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_market_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retraining_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_articles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PUBLIC READ-ONLY DOMAIN DATA (ROUTES, PORTS, VESSELS, BENCHMARKS, REGISTRY)
-- ------------------------------------------------------------------------------

CREATE POLICY "Public read access for data_sources" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Public read access for datasets" ON datasets FOR SELECT USING (true);
CREATE POLICY "Public read access for dataset_fields" ON dataset_fields FOR SELECT USING (true);
CREATE POLICY "Public read access for routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read access for ports" ON ports FOR SELECT USING (true);
CREATE POLICY "Public read access for vessels" ON vessels FOR SELECT USING (true);
CREATE POLICY "Public read access for vessel_positions" ON vessel_positions FOR SELECT USING (true);
CREATE POLICY "Public read access for port_congestion" ON port_congestion FOR SELECT USING (true);
CREATE POLICY "Public read access for trade_flows" ON trade_flows FOR SELECT USING (true);
CREATE POLICY "Public read access for weather_observations" ON weather_observations FOR SELECT USING (true);
CREATE POLICY "Public read access for weather_events" ON weather_events FOR SELECT USING (true);
CREATE POLICY "Public read access for market_signals" ON market_signals FOR SELECT USING (true);
CREATE POLICY "Public read access for freight_market_observations" ON freight_market_observations FOR SELECT USING (true);
CREATE POLICY "Public read access for forecast_models" ON forecast_models FOR SELECT USING (true);
CREATE POLICY "Public read access for model_versions" ON model_versions FOR SELECT USING (true);
CREATE POLICY "Public read access for model_metrics" ON model_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for freight_forecasts" ON freight_forecasts FOR SELECT USING (true);
CREATE POLICY "Public read access for forecast_factors" ON forecast_factors FOR SELECT USING (true);
CREATE POLICY "Public read access for ai_insights" ON ai_insights FOR SELECT USING (true);
CREATE POLICY "Public read access for insight_sources" ON insight_sources FOR SELECT USING (true);
CREATE POLICY "Public read access for reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Public read access for report_sections" ON report_sections FOR SELECT USING (true);
CREATE POLICY "Public read access for documentation_articles" ON documentation_articles FOR SELECT USING (true);
CREATE POLICY "Public read access for data_source_reliability" ON data_source_reliability FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 2. USER PROFILE & PREFERENCES POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can read their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. WORKSPACE MULTI-TENANT ISOLATION
-- ------------------------------------------------------------------------------

CREATE POLICY "Workspace members can view workspace" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        ) OR created_by = auth.uid()
    );

CREATE POLICY "Workspace owners can manage workspace" ON workspaces
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Workspace members can view member list" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 4. PRIVATE USER RESOURCES (WATCHLIST, NOTIFICATIONS, ALERTS, SCENARIOS)
-- ------------------------------------------------------------------------------

CREATE POLICY "Users manage own watchlist" ON watchlist_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own alerts" ON alerts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read alert events for their alerts" ON alert_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM alerts WHERE alerts.id = alert_events.alert_id AND alerts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own scenarios" ON scenarios
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own scenario parameters" ON scenario_parameters
    FOR ALL USING (
        EXISTS (SELECT 1 FROM scenarios WHERE scenarios.id = scenario_parameters.scenario_id AND scenarios.user_id = auth.uid())
    );

CREATE POLICY "Users manage own scenario results" ON scenario_results
    FOR ALL USING (
        EXISTS (SELECT 1 FROM scenarios WHERE scenarios.id = scenario_results.scenario_id AND scenarios.user_id = auth.uid())
    );

CREATE POLICY "Users manage saved comparisons" ON saved_comparisons
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. USER OBSERVATIONS & FEEDBACK POLICIES (CONTROLLED ISOLATION)
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view verified observations" ON user_observations
    FOR SELECT USING (moderation_status = 'verified' OR auth.uid() = user_id);

CREATE POLICY "Users can submit observations" ON user_observations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. SERVICE-ROLE ELEVATED ACCESS FOR INGESTION & ML WORKERS
-- ------------------------------------------------------------------------------

-- In PostgreSQL/Supabase, the service_role key bypasses RLS automatically.
-- For standard authenticated roles, ingestion runs and ML logs are read-only:
CREATE POLICY "Authenticated users view ingestion runs" ON ingestion_runs FOR SELECT USING (true);
CREATE POLICY "Authenticated users view quality checks" ON data_quality_checks FOR SELECT USING (true);
CREATE POLICY "Authenticated users view training runs" ON training_runs FOR SELECT USING (true);
CREATE POLICY "Authenticated users view retraining jobs" ON retraining_jobs FOR SELECT USING (true);
CREATE POLICY "Authenticated users view model predictions" ON model_predictions FOR SELECT USING (true);
CREATE POLICY "Authenticated users view prediction actuals" ON prediction_actuals FOR SELECT USING (true);
