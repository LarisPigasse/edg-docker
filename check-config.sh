#!/bin/bash

# =============================================================================
# EDG Platform - Verifica Configurazione Pre-Deploy
# =============================================================================
# Questo script verifica che la configurazione sia corretta prima del deploy
# su server Ubuntu/Linux in produzione.
# =============================================================================

echo ""
echo "=========================================="
echo "  EDG Platform - Pre-Deploy Check"
echo "=========================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Funzione check
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ((ERRORS++))
    fi
}

# Funzione warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# -----------------------------------------------------------------------------
# 1. Verifica File Esistenti
# -----------------------------------------------------------------------------
echo "1. Verifica File..."
check -f "docker-compose.yml"; check $? "docker-compose.yml esiste"
check -f ".env"; check $? ".env esiste"
check -f "traefik/dynamic.yml"; check $? "traefik/dynamic.yml esiste"

# -----------------------------------------------------------------------------
# 2. Verifica Variabili Traefik
# -----------------------------------------------------------------------------
echo ""
echo "2. Verifica Configurazione Traefik..."

if [ -f ".env" ]; then
    DOCKER_PROVIDER=$(grep "^TRAEFIK_USE_DOCKER=" .env | cut -d'=' -f2)
    INSECURE=$(grep "^TRAEFIK_INSECURE=" .env | cut -d'=' -f2)
    
    if [ "$DOCKER_PROVIDER" = "true" ]; then
        echo -e "${GREEN}✓${NC} TRAEFIK_USE_DOCKER=true (OK per Linux)"
    else
        echo -e "${RED}✗${NC} TRAEFIK_USE_DOCKER=false (Cambia a 'true' per produzione!)"
        ((ERRORS++))
    fi
    
    if [ "$INSECURE" = "false" ]; then
        echo -e "${GREEN}✓${NC} TRAEFIK_INSECURE=false (OK per produzione)"
    else
        warn "TRAEFIK_INSECURE=true (Considera 'false' in produzione per sicurezza)"
    fi
else
    echo -e "${RED}✗${NC} File .env non trovato!"
    ((ERRORS++))
fi

# -----------------------------------------------------------------------------
# 3. Verifica Secrets Non Default
# -----------------------------------------------------------------------------
echo ""
echo "3. Verifica Secrets..."

if [ -f ".env" ]; then
    # JWT Secret
    JWT=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
    if [ ${#JWT} -lt 32 ]; then
        echo -e "${RED}✗${NC} JWT_SECRET troppo corto (minimo 32 caratteri)"
        ((ERRORS++))
    elif echo "$JWT" | grep -q "EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025"; then
        echo -e "${RED}✗${NC} JWT_SECRET ancora DEFAULT! Genera nuovo secret!"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} JWT_SECRET personalizzato"
    fi
    
    # Gateway Secret
    GATEWAY=$(grep "^GATEWAY_SECRET=" .env | cut -d'=' -f2)
    if [ ${#GATEWAY} -lt 32 ]; then
        echo -e "${RED}✗${NC} GATEWAY_SECRET troppo corto"
        ((ERRORS++))
    elif echo "$GATEWAY" | grep -q "7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727"; then
        echo -e "${RED}✗${NC} GATEWAY_SECRET ancora DEFAULT! Genera nuovo secret!"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} GATEWAY_SECRET personalizzato"
    fi
    
    # MySQL Password
    MYSQL_PASS=$(grep "^MYSQL_PASSWORD=" .env | cut -d'=' -f2)
    if echo "$MYSQL_PASS" | grep -q "Auth2025Db!"; then
        echo -e "${RED}✗${NC} MYSQL_PASSWORD ancora DEFAULT! Cambia password!"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} MYSQL_PASSWORD personalizzata"
    fi
fi

# -----------------------------------------------------------------------------
# 4. Verifica Docker Installato (solo su Linux)
# -----------------------------------------------------------------------------
echo ""
echo "4. Verifica Docker..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo -e "${GREEN}✓${NC} Docker installato: $DOCKER_VERSION"
    
    if command -v docker compose &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d' ' -f4)
        echo -e "${GREEN}✓${NC} Docker Compose installato: $COMPOSE_VERSION"
    else
        echo -e "${RED}✗${NC} Docker Compose v2 NON installato"
        ((ERRORS++))
    fi
else
    warn "Docker non installato (OK se verifica pre-upload)"
fi

# -----------------------------------------------------------------------------
# 5. Verifica Email Configuration
# -----------------------------------------------------------------------------
echo ""
echo "5. Verifica Configurazione Email..."

if [ -f ".env" ]; then
    EMAIL_HOST=$(grep "^EMAIL_HOST=" .env | cut -d'=' -f2)
    EMAIL_USER=$(grep "^EMAIL_USER=" .env | cut -d'=' -f2)
    
    if [ -z "$EMAIL_HOST" ] || [ "$EMAIL_HOST" = "smtp.tuodominio.com" ]; then
        warn "EMAIL_HOST non configurato (email saranno in console log)"
    else
        echo -e "${GREEN}✓${NC} EMAIL_HOST configurato: $EMAIL_HOST"
    fi
    
    if [ -z "$EMAIL_USER" ]; then
        warn "EMAIL_USER non configurato"
    else
        echo -e "${GREEN}✓${NC} EMAIL_USER configurato"
    fi
fi

# -----------------------------------------------------------------------------
# 6. Verifica CORS Origins
# -----------------------------------------------------------------------------
echo ""
echo "6. Verifica CORS..."

if [ -f ".env" ]; then
    CORS=$(grep "^CORS_ORIGINS=" .env | cut -d'=' -f2)
    
    if echo "$CORS" | grep -q "localhost"; then
        warn "CORS_ORIGINS contiene 'localhost' (rimuovi in produzione)"
    fi
    
    if echo "$CORS" | grep -q "https://"; then
        echo -e "${GREEN}✓${NC} CORS_ORIGINS usa HTTPS"
    else
        warn "CORS_ORIGINS non usa HTTPS (aggiungi domini produzione)"
    fi
fi

# -----------------------------------------------------------------------------
# RISULTATO FINALE
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "  Risultato Verifica"
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Configurazione pronta per deploy!"
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} $WARNINGS warning(s) - Verifica raccomandazioni"
    fi
    
    echo ""
    echo "Prossimi step:"
    echo "  1. Upload progetto su server"
    echo "  2. docker compose build"
    echo "  3. docker compose up -d"
    echo ""
    
    exit 0
else
    echo -e "${RED}✗ FAIL${NC} - $ERRORS errore(i) trovato(i)!"
    echo ""
    echo "Fix richiesti prima del deploy:"
    echo "  • Controlla .env"
    echo "  • Genera nuovi secrets"
    echo "  • Imposta TRAEFIK_USE_DOCKER=true"
    echo ""
    
    exit 1
fi
