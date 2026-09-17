from app.ingestion.connectors.unctad import UnctadConnector
from app.ingestion.connectors.comtrade import ComtradeConnector
from app.ingestion.connectors.worldbank import WorldBankConnector
from app.ingestion.connectors.noaa import NoaaConnector
from app.ingestion.connectors.natural_earth import NaturalEarthConnector
from app.ingestion.connectors.baltic import BalticExchangeConnector
from app.ingestion.connectors.marinetraffic import MarineTrafficConnector
from app.ingestion.connectors.fred import FredConnector
from app.ingestion.connectors.eia import EiaConnector
from app.ingestion.connectors.panama import PanamaCanalConnector
from app.ingestion.connectors.imf import ImfConnector
from app.ingestion.connectors.scfi import SCFIConnector

CONNECTOR_MAP = {
    "unctad": UnctadConnector,
    "comtrade": ComtradeConnector,
    "worldbank": WorldBankConnector,
    "noaa": NoaaConnector,
    "natural_earth": NaturalEarthConnector,
    "baltic": BalticExchangeConnector,
    "marinetraffic": MarineTrafficConnector,
    "fred": FredConnector,
    "eia": EiaConnector,
    "panama": PanamaCanalConnector,
    "imf": ImfConnector,
    "scfi": SCFIConnector,
}

