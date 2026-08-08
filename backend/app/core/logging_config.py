"""
Configuração centralizada de logging da aplicação. Substitui o uso de
print() por um logger de verdade, com arquivo rotativo e formato consistente.
"""

import logging
from logging.handlers import RotatingFileHandler

from app.core.config import BASE_DIR

LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOGS_DIR / "app.log"


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("ml_network_ids")
    logger.setLevel(logging.INFO)

    if logger.handlers:
        # Evita duplicar handlers se essa função for chamada mais de uma vez
        # (acontece com o --reload do uvicorn, que recarrega módulos)
        return logger

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    # Arquivo rotativo: no máximo 5MB por arquivo, mantém até 3 arquivos antigos
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


logger = setup_logging()