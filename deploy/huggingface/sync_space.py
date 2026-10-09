"""
Envia o código do repositório para o Space do Hugging Face em um único
commit, o que dispara o rebuild da imagem Docker.

Só são enviados os arquivos versionados no Git, então os artefatos do
modelo enviados manualmente ao Space continuam lá intactos.

Uso (feito pelo GitHub Actions): HF_TOKEN=... HF_SPACE=usuario/nome python sync_space.py
"""

import os
import subprocess
from pathlib import Path

from huggingface_hub import CommitOperationAdd, HfApi

ROOT = Path(__file__).resolve().parents[2]
SPACE_README = Path(__file__).with_name("README.md")
IGNORED_PREFIXES = (".github/", "docs/", "tests/")

space = os.environ["HF_SPACE"]
api = HfApi(token=os.environ["HF_TOKEN"])

tracked = subprocess.run(
    ["git", "ls-files"], cwd=ROOT, check=True, capture_output=True, text=True
).stdout.splitlines()

operations = [
    CommitOperationAdd(path_in_repo=path, path_or_fileobj=str(ROOT / path))
    for path in tracked
    if path != "README.md" and not path.startswith(IGNORED_PREFIXES)
]
operations.append(CommitOperationAdd(path_in_repo="README.md", path_or_fileobj=str(SPACE_README)))

commit_sha = subprocess.run(
    ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, check=True, capture_output=True, text=True
).stdout.strip()

api.create_commit(
    repo_id=space,
    repo_type="space",
    operations=operations,
    commit_message=f"Sincroniza com o GitHub ({commit_sha})",
)
print(f"{len(operations)} arquivos enviados para https://huggingface.co/spaces/{space}")
