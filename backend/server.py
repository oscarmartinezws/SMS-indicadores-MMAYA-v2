from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
import asyncpg
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'sms_mmaya_secret_key_2025_secure')
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_HOURS = 24

# PostgreSQL Configuration for SMS
PG_CONFIG = {
    'host': '37.60.254.167',
    'port': 5432,
    'database': 'sms',
    'user': 'admin_sibelys',
    'password': 'P1c010c0#2026',
    'command_timeout': 60
}

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# PostgreSQL pool
pg_pool = None

# Create the main app
app = FastAPI(title="SMS - Sistema de Monitoreo Sectorial")

# Create routers
api_router = APIRouter(prefix="/api")
sms_router = APIRouter(prefix="/api/sms", tags=["SMS"])

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== PostgreSQL Connection ==========
async def get_pg_pool():
    global pg_pool
    if pg_pool is None:
        try:
            pg_pool = await asyncpg.create_pool(**PG_CONFIG, min_size=2, max_size=10)
            logger.info("PostgreSQL pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create PostgreSQL pool: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")
    return pg_pool

async def get_db():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        yield conn

# ========== JWT Functions ==========
def create_token(data: dict) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS)
    data['exp'] = expires
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    return verify_token(credentials.credentials)

# ========== Pydantic Models ==========
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    message: str
    token: str
    user: dict

class GenericItem(BaseModel):
    id: Optional[int] = None
    nombre: str
    estado: str = "ACTIVO"

class GenericItemWithCode(BaseModel):
    id: Optional[int] = None
    codigo: Optional[str] = None
    nombre: str
    estado: str = "ACTIVO"

class UserCreate(BaseModel):
    nro_documento: Optional[str] = None
    nombre: str
    username: str
    clave: str
    id_area: Optional[int] = None
    id_rol: Optional[int] = None

class UserUpdate(BaseModel):
    nro_documento: Optional[str] = None
    nombre: Optional[str] = None
    username: Optional[str] = None
    clave: Optional[str] = None
    id_area: Optional[int] = None
    id_rol: Optional[int] = None
    estado: Optional[str] = None

class IndicadorCreate(BaseModel):
    id_entidad: Optional[int] = None
    id_area: Optional[int] = None
    id_sector: Optional[int] = None
    id_pilar: Optional[int] = None
    id_eje: Optional[int] = None
    codi_meta: Optional[str] = None
    codi_resultado: Optional[str] = None
    codi_accion: Optional[str] = None
    codi: Optional[str] = None
    indicador_resultado: Optional[str] = None
    formula_indicador: Optional[str] = None
    anio_base: Optional[int] = None
    linea_base: Optional[str] = None
    anio_logro: Optional[int] = None
    logro: Optional[str] = None
    estado: str = "ACTIVO"

class RendicionData(BaseModel):
    id_indicador: int
    gestion: int
    programado: Optional[float] = None
    ejecutado_ene: Optional[float] = None
    proc_ejecutado_ene: Optional[float] = None
    acumulado_ene: Optional[float] = None
    descripcion_cualitativa: Optional[str] = None
    modificaciones: Optional[str] = None

# ========== SMS Routes ==========

# Login
@sms_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT u.*, a.area_organizacional as nombre_area, r.rol
            FROM usuario u
            LEFT JOIN area a ON u.id_area = a.id_area
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            WHERE u.username = $1 AND u.estado = 'ACTIVO'
        """, request.username)
        
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
        
        stored_password = user['clave']
        password_valid = False
        
        # Check if password is hashed or plain text
        if stored_password.startswith('$2'):
            # bcrypt hash
            password_valid = bcrypt.checkpw(request.password.encode(), stored_password.encode())
        else:
            # Plain text (legacy)
            password_valid = (request.password == stored_password)
            
            # Auto-migrate to hashed password
            if password_valid:
                hashed = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()
                await conn.execute("UPDATE usuario SET clave = $1 WHERE id_usuario = $2", hashed, user['id_usuario'])
                logger.info(f"Password migrated for user: {request.username}")
        
        if not password_valid:
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
        # Create token
        token_data = {
            'id_usuario': user['id_usuario'],
            'username': user['username'],
            'nombre': user['nombre'],
            'id_area': user['id_area'],
            'id_rol': user['id_rol'],
            'rol': user['rol']
        }
        token = create_token(token_data)
        
        # Build user response (exclude password)
        user_dict = dict(user)
        del user_dict['clave']
        
        return LoginResponse(message="Login exitoso", token=token, user=user_dict)

# Verify Token
@sms_router.get("/verify-token")
async def verify_token_endpoint(user: dict = Depends(get_current_user)):
    return {"valid": True, "user": user}

# ========== Menu ==========
@sms_router.get("/menu/{id_rol}")
async def get_menu(id_rol: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT m.*
            FROM menu m
            JOIN opciones o ON m.id_menu = o.id_menu
            WHERE o.id_rol = $1 AND m.estado = 'ACTIVO' AND o.estado = 'ACTIVO'
            ORDER BY m.id_menu ASC
        """, id_rol)
        return [dict(r) for r in rows]

# ========== Sectores ==========
@sms_router.get("/sectores")
async def get_sectores():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_sector as id, sector as nombre, estado FROM sector ORDER BY id_sector")
        return [dict(r) for r in rows]

@sms_router.post("/sectores")
async def create_sector(item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO sector (sector, estado) VALUES ($1, $2) RETURNING id_sector as id, sector as nombre, estado",
            item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/sectores/{id}")
async def update_sector(id: int, item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE sector SET sector = $1, estado = $2 WHERE id_sector = $3 RETURNING id_sector as id, sector as nombre, estado",
            item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Entidades ==========
@sms_router.get("/entidades")
async def get_entidades():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_entidad as id, entidad as nombre, estado FROM entidad ORDER BY id_entidad")
        return [dict(r) for r in rows]

@sms_router.post("/entidades")
async def create_entidad(item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO entidad (entidad, estado) VALUES ($1, $2) RETURNING id_entidad as id, entidad as nombre, estado",
            item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/entidades/{id}")
async def update_entidad(id: int, item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE entidad SET entidad = $1, estado = $2 WHERE id_entidad = $3 RETURNING id_entidad as id, entidad as nombre, estado",
            item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Areas ==========
@sms_router.get("/areas")
async def get_areas():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_area as id, id_entidad, area_organizacional as nombre, estado FROM area ORDER BY id_area")
        return [dict(r) for r in rows]

@sms_router.get("/entidades/{id}/areas")
async def get_areas_by_entidad(id: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id_area as id, area_organizacional as nombre, estado FROM area WHERE id_entidad = $1 ORDER BY id_area",
            id
        )
        return [dict(r) for r in rows]

@sms_router.post("/areas")
async def create_area(id_entidad: int = Form(...), nombre: str = Form(...), estado: str = Form("ACTIVO")):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO area (id_entidad, area_organizacional, estado) VALUES ($1, $2, $3) RETURNING id_area as id, id_entidad, area_organizacional as nombre, estado",
            id_entidad, nombre, estado
        )
        return dict(row)

@sms_router.post("/areas/json")
async def create_area_json(data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO area (id_entidad, area_organizacional, estado) VALUES ($1, $2, $3) RETURNING id_area as id, id_entidad, area_organizacional as nombre, estado",
            data.get('id_entidad'), data.get('nombre'), data.get('estado', 'ACTIVO')
        )
        return dict(row)

@sms_router.put("/areas/{id}")
async def update_area(id: int, data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE area SET area_organizacional = $1, estado = $2 WHERE id_area = $3 RETURNING id_area as id, id_entidad, area_organizacional as nombre, estado",
            data.get('nombre'), data.get('estado'), id
        )
        return dict(row) if row else {"error": "Not found"}

@sms_router.delete("/areas/{id}")
async def delete_area(id: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM area WHERE id_area = $1", id)
        return {"message": "Área eliminada"}

# ========== Pilares ==========
@sms_router.get("/pilares")
async def get_pilares():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_pilar as id, pilar as nombre, estado FROM pilar ORDER BY id_pilar")
        return [dict(r) for r in rows]

@sms_router.post("/pilares")
async def create_pilar(item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO pilar (pilar, estado) VALUES ($1, $2) RETURNING id_pilar as id, pilar as nombre, estado",
            item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/pilares/{id}")
async def update_pilar(id: int, item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE pilar SET pilar = $1, estado = $2 WHERE id_pilar = $3 RETURNING id_pilar as id, pilar as nombre, estado",
            item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Ejes ==========
@sms_router.get("/ejes")
async def get_ejes():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_eje as id, eje as nombre, estado FROM eje ORDER BY id_eje")
        return [dict(r) for r in rows]

@sms_router.post("/ejes")
async def create_eje(item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO eje (eje, estado) VALUES ($1, $2) RETURNING id_eje as id, eje as nombre, estado",
            item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/ejes/{id}")
async def update_eje(id: int, item: GenericItem):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE eje SET eje = $1, estado = $2 WHERE id_eje = $3 RETURNING id_eje as id, eje as nombre, estado",
            item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Metas ==========
@sms_router.get("/metas")
async def get_metas():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_meta as id, codi_meta as codigo, meta as nombre, estado FROM meta ORDER BY id_meta")
        return [dict(r) for r in rows]

@sms_router.post("/metas")
async def create_meta(item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO meta (codi_meta, meta, estado) VALUES ($1, $2, $3) RETURNING id_meta as id, codi_meta as codigo, meta as nombre, estado",
            item.codigo, item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/metas/{id}")
async def update_meta(id: int, item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE meta SET codi_meta = $1, meta = $2, estado = $3 WHERE id_meta = $4 RETURNING id_meta as id, codi_meta as codigo, meta as nombre, estado",
            item.codigo, item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Resultados ==========
@sms_router.get("/resultados")
async def get_resultados():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_resultado as id, codi_resultado as codigo, resultado as nombre, estado FROM resultado ORDER BY id_resultado")
        return [dict(r) for r in rows]

@sms_router.post("/resultados")
async def create_resultado(item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO resultado (codi_resultado, resultado, estado) VALUES ($1, $2, $3) RETURNING id_resultado as id, codi_resultado as codigo, resultado as nombre, estado",
            item.codigo, item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/resultados/{id}")
async def update_resultado(id: int, item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE resultado SET codi_resultado = $1, resultado = $2, estado = $3 WHERE id_resultado = $4 RETURNING id_resultado as id, codi_resultado as codigo, resultado as nombre, estado",
            item.codigo, item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Acciones ==========
@sms_router.get("/acciones")
async def get_acciones():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id_accion as id, codi_accion as codigo, accion as nombre, estado FROM accion ORDER BY id_accion")
        return [dict(r) for r in rows]

@sms_router.post("/acciones")
async def create_accion(item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO accion (codi_accion, accion, estado) VALUES ($1, $2, $3) RETURNING id_accion as id, codi_accion as codigo, accion as nombre, estado",
            item.codigo, item.nombre, item.estado
        )
        return dict(row)

@sms_router.put("/acciones/{id}")
async def update_accion(id: int, item: GenericItemWithCode):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE accion SET codi_accion = $1, accion = $2, estado = $3 WHERE id_accion = $4 RETURNING id_accion as id, codi_accion as codigo, accion as nombre, estado",
            item.codigo, item.nombre, item.estado, id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Indicadores (Matriz Parametro) ==========
@sms_router.get("/matriz_parametros")
async def get_indicadores():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM matriz_parametro ORDER BY id_indicador")
        return [dict(r) for r in rows]

@sms_router.get("/indicadores/area/{id_area}")
async def get_indicadores_by_area(id_area: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM matriz_parametro WHERE id_area = $1 ORDER BY id_indicador", id_area)
        return [dict(r) for r in rows]

@sms_router.post("/matriz_parametros")
async def create_indicador(item: IndicadorCreate):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO matriz_parametro 
            (id_entidad, id_area, id_sector, id_pilar, id_eje, codi_meta, codi_resultado, codi_accion, codi, indicador_resultado, formula_indicador, anio_base, linea_base, anio_logro, logro, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        """, item.id_entidad, item.id_area, item.id_sector, item.id_pilar, item.id_eje, 
            item.codi_meta, item.codi_resultado, item.codi_accion, item.codi, 
            item.indicador_resultado, item.formula_indicador, item.anio_base, 
            item.linea_base, item.anio_logro, item.logro, item.estado)
        return dict(row)

@sms_router.put("/matriz_parametros/{id}")
async def update_indicador(id: int, item: IndicadorCreate):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE matriz_parametro SET
            id_entidad=$1, id_area=$2, id_sector=$3, id_pilar=$4, id_eje=$5, 
            codi_meta=$6, codi_resultado=$7, codi_accion=$8, codi=$9, 
            indicador_resultado=$10, formula_indicador=$11, anio_base=$12, 
            linea_base=$13, anio_logro=$14, logro=$15, estado=$16
            WHERE id_indicador = $17
            RETURNING *
        """, item.id_entidad, item.id_area, item.id_sector, item.id_pilar, item.id_eje,
            item.codi_meta, item.codi_resultado, item.codi_accion, item.codi,
            item.indicador_resultado, item.formula_indicador, item.anio_base,
            item.linea_base, item.anio_logro, item.logro, item.estado, id)
        return dict(row) if row else {"error": "Not found"}

# ========== Usuarios ==========
@sms_router.get("/usuarios")
async def get_usuarios():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT u.id_usuario, u.nro_documento, u.nombre, u.username, u.fecha_creacion, 
                   u.id_area, u.id_rol, u.estado, a.area_organizacional as area, r.rol
            FROM usuario u
            LEFT JOIN area a ON u.id_area = a.id_area
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        """)
        return [dict(r) for r in rows]

@sms_router.post("/usuarios")
async def create_usuario(user: UserCreate):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        # Check if username exists
        existing = await conn.fetchrow("SELECT id_usuario FROM usuario WHERE username = $1", user.username)
        if existing:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
        
        # Hash password
        hashed = bcrypt.hashpw(user.clave.encode(), bcrypt.gensalt()).decode()
        
        await conn.execute("""
            INSERT INTO usuario (nro_documento, nombre, username, clave, id_area, id_rol, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
        """, user.nro_documento, user.nombre, user.username, hashed, user.id_area, user.id_rol)
        
        return {"message": "Usuario creado exitosamente"}

@sms_router.put("/usuarios/{id}")
async def update_usuario(id: int, user: UserUpdate):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        if user.clave:
            hashed = bcrypt.hashpw(user.clave.encode(), bcrypt.gensalt()).decode()
            await conn.execute("""
                UPDATE usuario SET nro_documento=$1, nombre=$2, username=$3, clave=$4, id_area=$5, id_rol=$6, estado=$7
                WHERE id_usuario=$8
            """, user.nro_documento, user.nombre, user.username, hashed, user.id_area, user.id_rol, user.estado, id)
        else:
            await conn.execute("""
                UPDATE usuario SET nro_documento=$1, nombre=$2, username=$3, id_area=$4, id_rol=$5, estado=$6
                WHERE id_usuario=$7
            """, user.nro_documento, user.nombre, user.username, user.id_area, user.id_rol, user.estado, id)
        
        return {"message": "Usuario actualizado"}

@sms_router.put("/usuarios/{id}/clave")
async def change_password(id: int, clave: str = Form(...)):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        hashed = bcrypt.hashpw(clave.encode(), bcrypt.gensalt()).decode()
        await conn.execute("UPDATE usuario SET clave = $1 WHERE id_usuario = $2", hashed, id)
        return {"message": "Contraseña actualizada"}

# ========== Roles ==========
@sms_router.get("/roles")
async def get_roles():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM rol ORDER BY id_rol")
        return [dict(r) for r in rows]

@sms_router.post("/roles")
async def create_role(data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        # Insert new role
        row = await conn.fetchrow(
            "INSERT INTO rol (rol, estado) VALUES ($1, $2) RETURNING *",
            data.get('rol'), data.get('estado', 'ACTIVO')
        )
        new_role = dict(row)
        
        # Create options for the new role (all menus as INACTIVO by default)
        menus = await conn.fetch("SELECT id_menu FROM menu")
        for menu in menus:
            await conn.execute("""
                INSERT INTO opciones (id_opcion, id_rol, id_menu, estado) 
                VALUES ((SELECT COALESCE(MAX(id_opcion),0)+1 FROM opciones), $1, $2, 'INACTIVO')
            """, new_role['id_rol'], menu['id_menu'])
        
        return new_role

@sms_router.put("/roles/{id}")
async def update_role(id: int, data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE rol SET rol = $1, estado = $2 WHERE id_rol = $3 RETURNING *",
            data.get('rol'), data.get('estado'), id
        )
        return dict(row) if row else {"error": "Not found"}

# ========== Opciones (Role Options) ==========
@sms_router.get("/opciones/{id_rol}")
async def get_opciones_by_rol(id_rol: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT o.id_opcion, o.id_rol, o.id_menu, m.opcion, o.estado
            FROM opciones o
            JOIN menu m ON o.id_menu = m.id_menu
            WHERE o.id_rol = $1
            ORDER BY o.id_menu
        """, id_rol)
        return [dict(r) for r in rows]

@sms_router.put("/opciones/{id}")
async def update_opcion(id: int, data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE opciones SET estado = $1 WHERE id_opcion = $2",
            data.get('estado'), id
        )
        return {"message": "Opción actualizada"}

# ========== Menu Admin ==========
@sms_router.get("/menu_admin")
async def get_menu_admin():
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT m.*, p.opcion as padre_nombre
            FROM menu m
            LEFT JOIN menu p ON m.id_padre = p.id_menu
            ORDER BY m.id_menu ASC
        """)
        return [dict(r) for r in rows]

@sms_router.post("/menu")
async def create_menu(data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO menu (opcion, tipo_opcion, enlace, id_padre, estado)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, data.get('opcion'), data.get('tipo_opcion', 'opcion'), 
            data.get('enlace'), data.get('id_padre'), data.get('estado', 'ACTIVO'))
        
        new_menu = dict(row)
        
        # Create options for all roles for this new menu
        roles = await conn.fetch("SELECT id_rol FROM rol")
        for role in roles:
            await conn.execute("""
                INSERT INTO opciones (id_opcion, id_rol, id_menu, estado)
                VALUES ((SELECT COALESCE(MAX(id_opcion),0)+1 FROM opciones), $1, $2, 'INACTIVO')
            """, role['id_rol'], new_menu['id_menu'])
        
        return new_menu

@sms_router.put("/menu/{id}")
async def update_menu(id: int, data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE menu SET opcion=$1, tipo_opcion=$2, enlace=$3, id_padre=$4, estado=$5
            WHERE id_menu = $6
            RETURNING *
        """, data.get('opcion'), data.get('tipo_opcion'), data.get('enlace'), 
            data.get('id_padre'), data.get('estado'), id)
        return dict(row) if row else {"error": "Not found"}

# ========== Contexto Usuario ==========
@sms_router.get("/contexto_usuario/{id_area}")
async def get_user_context(id_area: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        area_data = await conn.fetchrow("""
            SELECT a.area_organizacional as area, e.entidad, a.id_entidad
            FROM area a
            JOIN entidad e ON a.id_entidad = e.id_entidad
            WHERE a.id_area = $1
        """, id_area)
        
        if not area_data:
            raise HTTPException(status_code=404, detail="Área no encontrada")
        
        # Get sector from indicators
        sector_data = await conn.fetchrow("""
            SELECT s.sector
            FROM matriz_parametro mp
            JOIN sector s ON mp.id_sector = s.id_sector
            WHERE mp.id_area = $1
            LIMIT 1
        """, id_area)
        
        return {
            "area": area_data['area'],
            "entidad": area_data['entidad'],
            "sector": sector_data['sector'] if sector_data else "-"
        }

# ========== Rendicion ==========
@sms_router.get("/rendicion/{id_indicador}/{gestion}")
async def get_rendicion(id_indicador: int, gestion: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM rendicion WHERE id_indicador = $1 AND gestion = $2",
            id_indicador, gestion
        )
        return dict(row) if row else {}

@sms_router.post("/rendicion")
async def save_rendicion(data: dict):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        # Check if exists
        existing = await conn.fetchrow(
            "SELECT id_rendicion FROM rendicion WHERE id_indicador = $1 AND gestion = $2",
            data.get('id_indicador'), data.get('gestion')
        )
        
        if existing:
            # Update
            set_clauses = []
            values = []
            i = 1
            for key, value in data.items():
                if key not in ['id_indicador', 'gestion']:
                    set_clauses.append(f"{key} = ${i}")
                    values.append(value if value != '' else None)
                    i += 1
            
            if set_clauses:
                values.append(existing['id_rendicion'])
                query = f"UPDATE rendicion SET {', '.join(set_clauses)} WHERE id_rendicion = ${i} RETURNING *"
                row = await conn.fetchrow(query, *values)
                return dict(row)
            return dict(existing)
        else:
            # Insert
            cols = list(data.keys())
            placeholders = [f"${i+1}" for i in range(len(cols))]
            values = [data[k] if data[k] != '' else None for k in cols]
            
            query = f"INSERT INTO rendicion ({', '.join(cols)}) VALUES ({', '.join(placeholders)}) RETURNING *"
            row = await conn.fetchrow(query, *values)
            return dict(row)

# ========== Archivos Adjuntos (usando MongoDB) ==========
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@sms_router.get("/archivos/{id_indicador}/{gestion}")
async def get_archivos(id_indicador: int, gestion: int):
    archivos = await db.archivos_rendicion.find(
        {"id_indicador": id_indicador, "gestion": gestion},
        {"_id": 0}
    ).to_list(100)
    return archivos

@sms_router.post("/archivos")
async def upload_archivo(
    id_indicador: int = Form(...),
    gestion: int = Form(...),
    descripcion: str = Form(""),
    archivo: UploadFile = File(...)
):
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(archivo.filename).suffix
    stored_filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / stored_filename
    
    # Save file
    content = await archivo.read()
    file_size = len(content)
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Save metadata to MongoDB
    archivo_doc = {
        "id": file_id,
        "id_indicador": id_indicador,
        "gestion": gestion,
        "nombre_original": archivo.filename,
        "nombre_almacenado": stored_filename,
        "descripcion": descripcion,
        "tamaño": file_size,
        "fecha_carga": datetime.now(timezone.utc).isoformat()
    }
    await db.archivos_rendicion.insert_one(archivo_doc)
    
    return {"id": file_id, "nombre_original": archivo.filename, "tamaño": file_size, "descripcion": descripcion}

@sms_router.delete("/archivos/{file_id}")
async def delete_archivo(file_id: str):
    # Find file in MongoDB
    archivo = await db.archivos_rendicion.find_one({"id": file_id})
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Delete file from disk
    file_path = UPLOAD_DIR / archivo["nombre_almacenado"]
    if file_path.exists():
        file_path.unlink()
    
    # Delete from MongoDB
    await db.archivos_rendicion.delete_one({"id": file_id})
    
    return {"message": "Archivo eliminado"}

@sms_router.get("/archivos/download/{file_id}")
async def download_archivo(file_id: str):
    from fastapi.responses import FileResponse
    
    archivo = await db.archivos_rendicion.find_one({"id": file_id})
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    file_path = UPLOAD_DIR / archivo["nombre_almacenado"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")
    
    return FileResponse(
        path=str(file_path),
        filename=archivo["nombre_original"],
        media_type="application/octet-stream"
    )

# ========== Original MongoDB routes ==========
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.get("/")
async def root():
    return {"message": "SMS API - Sistema de Monitoreo Sectorial"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Include routers
app.include_router(api_router)
app.include_router(sms_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shutdown event
@app.on_event("shutdown")
async def shutdown():
    global pg_pool
    client.close()
    if pg_pool:
        await pg_pool.close()
