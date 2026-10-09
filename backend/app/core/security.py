"""
Funções de segurança e autenticação da aplicação.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User


# Em produção a chave vem da variável de ambiente SECRET_KEY (segredo do servidor);
# o valor fixo abaixo só é usado no ambiente local de desenvolvimento.
SECRET_KEY = os.getenv("SECRET_KEY", "ml-network-ids-secret-key-change-in-production")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    """Gera o hash seguro da senha."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash armazenado."""
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    """Cria um token JWT de acesso."""
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodifica e valida um token JWT."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Obtém o usuário autenticado a partir do token JWT."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo.",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Permite acesso somente a usuários administradores."""

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )

    return current_user