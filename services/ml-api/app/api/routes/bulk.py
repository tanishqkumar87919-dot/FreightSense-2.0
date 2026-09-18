from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.domain.models import (
    BulkCommodityModel,
    DryBulkVesselClassModel,
    BulkRouteModel,
    CharterValidationRequest,
    CharterValidationResponse,
    EastCoastPortConstraintModel,
)
from app.domain.validation import validate_charter_fixture
from app.api.routes.port_constraints import CANONICAL_PORT_CONSTRAINTS

router = APIRouter()

CANONICAL_BULK_COMMODITIES: List[Dict[str, Any]] = [
    {
        "id": "cmd-coking-coal",
        "name": "Hard Coking Coal (HCC)",
        "category": "Coking Coal",
        "stowage_factor_m3_per_mt": 1.25,
        "typical_parcel_size_tonnes": 120000.0,
        "handling_requirements": [
            "IMSBC Code Group B (Combustible & Methane Emission Monitoring)",
            "Water sprinkling for dust suppression at stockpile",
            "Rapid conveyor discharge onto stacker-reclaimers",
        ],
        "major_import_ports": ["Paradip Port", "Visakhapatnam Port", "Syama Prasad Mookerjee Port (Haldia)"],
        "major_export_origins": ["Hay Point / DBCT (Australia)", "Gladstone (Australia)", "Port Kembla (Australia)"],
        "provenance": {
            "source": "Government of India Open Data Platform (data.gov.in) & MoPSW TRD",
            "dataset_name": "Overseas Cargo Principal Commodities Unloaded at Indian Major Ports",
            "coverage_period": "2021 - 2024 (Annual 68.2 MT at Paradip, 18.8 MT at Vizag)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Million Metric Tonnes",
            "status": "historical",
        },
    },
    {
        "id": "cmd-thermal-coal",
        "name": "Thermal / Steam Coal (GAR 4200 - 5800 kcal/kg)",
        "category": "Thermal Coal",
        "stowage_factor_m3_per_mt": 1.32,
        "typical_parcel_size_tonnes": 75000.0,
        "handling_requirements": [
            "Continuous thermal scanning of cargo holds",
            "Moisture limit adherence to prevent liquefaction",
            "Dedicated coal unloading berths with high-speed gantry grab cranes",
        ],
        "major_import_ports": ["Kamarajar Port (Ennore)", "Visakhapatnam Port", "V.O. Chidambaranar Port (Tuticorin)", "Paradip Port"],
        "major_export_origins": ["Samarinda / Muara Berau (Indonesia)", "Taboneo (Indonesia)", "Richards Bay (South Africa)"],
        "provenance": {
            "source": "Indian Ports Association (IPA) & CEA Monthly Generation Reports",
            "dataset_name": "Major Port Thermal Coal Coastal & Overseas Receipt Records",
            "coverage_period": "2021 - 2024 (Annual 26.8 MT at Ennore, 16.4 MT at Tuticorin)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Million Metric Tonnes",
            "status": "historical",
        },
    },
    {
        "id": "cmd-iron-ore",
        "name": "Iron Ore Fines & DR-Grade Pellets (Fe 62% - 65%)",
        "category": "Iron Ore",
        "stowage_factor_m3_per_mt": 0.52,
        "typical_parcel_size_tonnes": 150000.0,
        "handling_requirements": [
            "Strict Transportable Moisture Limit (TML) compliance",
            "High-density deadweight trimming to prevent hull stress",
            "High-throughput mechanized shiploaders and stackers",
        ],
        "major_import_ports": ["Paradip Port", "Visakhapatnam Port", "Chennai Port"],
        "major_export_origins": ["Port Hedland (Australia)", "Dampier (Australia)", "Saldanha Bay (South Africa)"],
        "provenance": {
            "source": "Ministry of Ports, Shipping and Waterways (MoPSW) & NMDC",
            "dataset_name": "Iron Ore Overseas Loaded & Coastal Inward Shipments",
            "coverage_period": "2021 - 2024 (Annual 18.5 MT at Paradip, 16.2 MT at Vizag)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Million Metric Tonnes",
            "status": "historical",
        },
    },
    {
        "id": "cmd-limestone",
        "name": "Metallurgical Limestone & Dolomite (Flux Grade)",
        "category": "Limestone",
        "stowage_factor_m3_per_mt": 0.85,
        "typical_parcel_size_tonnes": 55000.0,
        "handling_requirements": [
            "IMSBC Code Group C (Dry bulk non-cohesive)",
            "Direct evacuation to rake loading bins for steel plants",
            "Moisture protection during monsoon transshipment",
        ],
        "major_import_ports": ["Paradip Port", "Visakhapatnam Port", "Syama Prasad Mookerjee Port (Haldia)"],
        "major_export_origins": ["Mina Saqr (UAE)", "Salalah (Oman)", "Langweid (Vietnam)"],
        "provenance": {
            "source": "Indian Bureau of Mines (IBM) & IPA Major Port Traffic",
            "dataset_name": "Principal Minerals & Flux Inward Sea Movements",
            "coverage_period": "2021 - 2024 (Annual 4.5 MT aggregate East Coast)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metric Tonnes",
            "status": "historical",
        },
    },
    {
        "id": "cmd-fertilizer",
        "name": "Rock Phosphate & Finished Fertilizers (DAP / MOP / Urea)",
        "category": "Fertilizer",
        "stowage_factor_m3_per_mt": 0.95,
        "typical_parcel_size_tonnes": 45000.0,
        "handling_requirements": [
            "Covered conveyor and hopper bagging plants",
            "Strict hygroscopic moisture protection (zero wet-cargo tolerance)",
            "Geared vessel discharge with grabs directly into rail wagons",
        ],
        "major_import_ports": ["Paradip Port", "Visakhapatnam Port", "Chennai Port", "V.O. Chidambaranar Port"],
        "major_export_origins": ["Jorf Lasfar (Morocco)", "Aqaba (Jordan)", "Ras Al Khair (Saudi Arabia)"],
        "provenance": {
            "source": "Department of Fertilizers & Ministry of Ports, Shipping and Waterways",
            "dataset_name": "Port-wise Import of Fertilizers and Raw Materials",
            "coverage_period": "2021 - 2024 (Annual 4.8 MT at Paradip, 5.6 MT at Chennai)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Million Metric Tonnes",
            "status": "historical",
        },
    },
]

CANONICAL_VESSEL_CLASSES: List[Dict[str, Any]] = [
    {
        "id": "vclass-capesize",
        "name": "Capesize",
        "dwt_min": 120000.0,
        "dwt_max": 210000.0,
        "typical_draft_m": 18.2,
        "beam_m": 45.0,
        "loa_m": 292.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 38.5,
        "speed_knots_ballast": 14.2,
        "speed_knots_laden": 12.8,
        "provenance": {
            "source": "Baltic Exchange & Clarksons Research Shipping Intelligence",
            "dataset_name": "Baltic Capesize Vessel Standard Specifications (BCI 180k DWT Benchmark)",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
    {
        "id": "vclass-kamsarmax",
        "name": "Kamsarmax",
        "dwt_min": 80000.0,
        "dwt_max": 85000.0,
        "typical_draft_m": 14.5,
        "beam_m": 32.26,
        "loa_m": 229.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 24.5,
        "speed_knots_ballast": 14.0,
        "speed_knots_laden": 13.0,
        "provenance": {
            "source": "Baltic Exchange & Standard Maritime Architecture",
            "dataset_name": "Baltic Panamax/Kamsarmax Index (BPI 82k DWT Benchmark)",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
    {
        "id": "vclass-panamax",
        "name": "Panamax",
        "dwt_min": 65000.0,
        "dwt_max": 79999.0,
        "typical_draft_m": 13.8,
        "beam_m": 32.2,
        "loa_m": 225.0,
        "geared": False,
        "crane_capacity_tonnes": None,
        "daily_bunker_fuel_mt": 23.0,
        "speed_knots_ballast": 13.8,
        "speed_knots_laden": 12.6,
        "provenance": {
            "source": "Baltic Exchange & Standard Maritime Architecture",
            "dataset_name": "Traditional Panamax Vessel Specifications (74k DWT Benchmark)",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
    {
        "id": "vclass-ultramax",
        "name": "Ultramax",
        "dwt_min": 60000.0,
        "dwt_max": 65000.0,
        "typical_draft_m": 13.3,
        "beam_m": 32.2,
        "loa_m": 199.9,
        "geared": True,
        "crane_capacity_tonnes": 35.0,
        "daily_bunker_fuel_mt": 19.5,
        "speed_knots_ballast": 14.0,
        "speed_knots_laden": 13.2,
        "provenance": {
            "source": "Baltic Exchange & Clarksons Research",
            "dataset_name": "Baltic Supramax/Ultramax Index (BSI 64k DWT Geared Benchmark)",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
    {
        "id": "vclass-supramax",
        "name": "Supramax",
        "dwt_min": 50000.0,
        "dwt_max": 59999.0,
        "typical_draft_m": 12.8,
        "beam_m": 32.2,
        "loa_m": 190.0,
        "geared": True,
        "crane_capacity_tonnes": 30.0,
        "daily_bunker_fuel_mt": 18.0,
        "speed_knots_ballast": 13.5,
        "speed_knots_laden": 12.8,
        "provenance": {
            "source": "Baltic Exchange & Clarksons Research",
            "dataset_name": "Supramax 58k DWT Geared Vessel Profile",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
    {
        "id": "vclass-handysize",
        "name": "Handysize",
        "dwt_min": 25000.0,
        "dwt_max": 40000.0,
        "typical_draft_m": 10.2,
        "beam_m": 28.0,
        "loa_m": 180.0,
        "geared": True,
        "crane_capacity_tonnes": 30.0,
        "daily_bunker_fuel_mt": 14.5,
        "speed_knots_ballast": 13.0,
        "speed_knots_laden": 12.0,
        "provenance": {
            "source": "Baltic Exchange (BHSI 38k DWT Benchmark)",
            "dataset_name": "Handysize Dry Bulk Vessel Specifications",
            "coverage_period": "2024 Standard Vessel Profile",
            "last_updated": "2024-08-01",
            "data_type": "Charter Party Reference Benchmark",
            "units": "DWT / Metres / Knots",
            "status": "demo",
        },
    },
]

CANONICAL_BULK_ROUTES: List[Dict[str, Any]] = [
    {
        "id": "route-aus-paradip",
        "name": "Hay Point (Australia) to Paradip Port",
        "origin_port": "Hay Point (Queensland)",
        "origin_country": "Australia",
        "destination_port": "Paradip Port",
        "destination_country": "India",
        "distance_nm": 4820.0,
        "transit_days_laden": 15.0,
        "transit_days_ballast": 14.0,
        "cargo_type": "Hard Coking Coal (HCC)",
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax"],
        "benchmark_voyage_rate_usd_mt": 14.85,
        "route_risk_score": 32.0,
        "choke_points": ["Torres Strait", "Malacca Strait"],
        "weather_vulnerability": "Bay of Bengal SW Monsoon Swell (June-September)",
        "coordinates": {
            "origin": [-21.2858, 149.2996],
            "destination": [20.2644, 86.6698],
            "waypoints": [
                [-21.3, 149.3],
                [-10.5, 142.2],
                [-8.5, 125.0],
                [-6.0, 105.5],
                [6.0, 95.0],
                [15.0, 88.0],
                [20.26, 86.67],
            ],
        },
        "provenance": {
            "source": "Baltic Exchange Voyage Benchmark & Maritime Distance Tables",
            "dataset_name": "Australia - India Coal Trade Lane Parameters",
            "coverage_period": "2024 Reference Corridor",
            "last_updated": "2024-08-01",
            "data_type": "Shipping Network Topography",
            "units": "Nautical Miles / Days / USD per MT",
            "status": "demo",
        },
    },
    {
        "id": "route-indo-vizag",
        "name": "Samarinda (Indonesia) to Visakhapatnam Port",
        "origin_port": "Samarinda (Muara Berau)",
        "origin_country": "Indonesia",
        "destination_port": "Visakhapatnam Port",
        "destination_country": "India",
        "distance_nm": 2460.0,
        "transit_days_laden": 8.0,
        "transit_days_ballast": 7.5,
        "cargo_type": "Thermal Coal",
        "allowable_vessel_classes": ["Panamax", "Kamsarmax", "Ultramax", "Supramax"],
        "benchmark_voyage_rate_usd_mt": 9.40,
        "route_risk_score": 48.0,
        "choke_points": ["Makassar Strait", "Singapore Strait", "Malacca Strait"],
        "weather_vulnerability": "Malacca Strait squalls (Sumatras)",
        "coordinates": {
            "origin": [-0.5021, 117.1537],
            "destination": [17.6868, 83.2185],
            "waypoints": [
                [-0.5, 117.2],
                [1.3, 104.2],
                [5.5, 98.0],
                [10.0, 92.0],
                [17.68, 83.22],
            ],
        },
        "provenance": {
            "source": "Baltic Exchange Voyage Benchmark & Indian Ports Association",
            "dataset_name": "Indonesia - East Coast India Thermal Coal Lane",
            "coverage_period": "2024 Reference Corridor",
            "last_updated": "2024-08-01",
            "data_type": "Shipping Network Topography",
            "units": "Nautical Miles / Days / USD per MT",
            "status": "demo",
        },
    },
    {
        "id": "route-saf-haldia",
        "name": "Richards Bay (South Africa) to Haldia Port",
        "origin_port": "Richards Bay",
        "origin_country": "South Africa",
        "destination_port": "Haldia Port (Kolkata)",
        "destination_country": "India",
        "distance_nm": 4920.0,
        "transit_days_laden": 17.0,
        "transit_days_ballast": 15.5,
        "cargo_type": "Steam Coal / Anthracite",
        "allowable_vessel_classes": ["Supramax", "Handysize"],
        "benchmark_voyage_rate_usd_mt": 16.20,
        "route_risk_score": 56.0,
        "choke_points": ["Mozambique Channel", "Sandheads Anchorage"],
        "weather_vulnerability": "Agulhas current rough seas; Hugli river tidal bore",
        "coordinates": {
            "origin": [-28.8038, 32.0911],
            "destination": [22.0256, 88.0583],
            "waypoints": [
                [-28.8, 32.1],
                [-20.0, 50.0],
                [-5.0, 75.0],
                [6.0, 85.0],
                [15.0, 88.0],
                [21.5, 88.0],
                [22.02, 88.06],
            ],
        },
        "provenance": {
            "source": "Baltic Exchange Voyage Benchmark & Syama Prasad Mookerjee Port",
            "dataset_name": "South Africa - Bay of Bengal Coal Trade Corridor",
            "coverage_period": "2024 Reference Corridor",
            "last_updated": "2024-08-01",
            "data_type": "Shipping Network Topography",
            "units": "Nautical Miles / Days / USD per MT",
            "status": "demo",
        },
    },
    {
        "id": "route-aus-vizag",
        "name": "Port Hedland (Australia) to Visakhapatnam Port",
        "origin_port": "Port Hedland",
        "origin_country": "Australia",
        "destination_port": "Visakhapatnam Port",
        "destination_country": "India",
        "distance_nm": 3180.0,
        "transit_days_laden": 10.0,
        "transit_days_ballast": 9.5,
        "cargo_type": "Coking Coal & Iron Ore",
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax"],
        "benchmark_voyage_rate_usd_mt": 11.75,
        "route_risk_score": 35.0,
        "choke_points": ["Lombok Strait", "Sunda Strait"],
        "weather_vulnerability": "Equatorial convergence zone thunderstorms",
        "coordinates": {
            "origin": [-20.3167, 118.5833],
            "destination": [17.6868, 83.2185],
            "waypoints": [
                [-20.3, 118.6],
                [-10.0, 110.0],
                [-6.0, 105.0],
                [6.0, 94.0],
                [12.0, 88.0],
                [17.68, 83.22],
            ],
        },
        "provenance": {
            "source": "Baltic Exchange Voyage Benchmark",
            "dataset_name": "Western Australia - India Bulk Corridor",
            "coverage_period": "2024 Reference Corridor",
            "last_updated": "2024-08-01",
            "data_type": "Shipping Network Topography",
            "units": "Nautical Miles / Days / USD per MT",
            "status": "demo",
        },
    },
]


@router.get("/bulk/commodities", response_model=List[BulkCommodityModel])
def get_bulk_commodities():
    """Returns canonical bulk commodities with stowage and handling parameters."""
    return [BulkCommodityModel(**c) for c in CANONICAL_BULK_COMMODITIES]


@router.get("/bulk/vessel-classes", response_model=List[DryBulkVesselClassModel])
def get_dry_bulk_vessel_classes():
    """Returns dry bulk vessel classes from Capesize to Handysize with specifications."""
    return [DryBulkVesselClassModel(**v) for v in CANONICAL_VESSEL_CLASSES]


@router.get("/bulk/routes", response_model=List[BulkRouteModel])
def get_bulk_routes():
    """Returns overseas-to-East Coast India bulk shipping corridors."""
    return [BulkRouteModel(**r) for r in CANONICAL_BULK_ROUTES]


@router.post("/bulk/validate-charter", response_model=CharterValidationResponse)
def validate_charter(req: CharterValidationRequest):
    """
    Validates a charter fixture request against vessel specifications,
    cargo parcel quantity, laycan window, and destination port draft limits.
    """
    # 1. Lookup vessel class
    vessel_data = next((v for v in CANONICAL_VESSEL_CLASSES if v["name"].lower() == req.preferred_vessel_class.lower()), None)
    if not vessel_data:
        raise HTTPException(
            status_code=400,
            detail=f"Preferred vessel class '{req.preferred_vessel_class}' not found. Supported: {[v['name'] for v in CANONICAL_VESSEL_CLASSES]}",
        )
    vessel_model = DryBulkVesselClassModel(**vessel_data)

    # 2. Lookup destination port constraints
    p_id = req.destination_port_id
    if p_id not in CANONICAL_PORT_CONSTRAINTS:
        prefixed = f"port-in-{p_id.replace('india-', '').replace('port-', '')}"
        if prefixed in CANONICAL_PORT_CONSTRAINTS:
            p_id = prefixed
        else:
            raise HTTPException(status_code=400, detail=f"Destination port '{req.destination_port_id}' not found in port constraints matrix.")
    port_model = EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS[p_id])

    # 3. Execute domain validation engine
    return validate_charter_fixture(req, vessel_model, port_model)
