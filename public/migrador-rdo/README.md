# MIGRADOR-RDO — Instalador local para Pablo

## Qué hace este instalador

Prepara la PC de Pablo para que el agente MIGRADOR-RDO (que vive en
platform.claude.com) le pueda pedir ejecutar comandos técnicos sin
que Pablo tenga que configurar nada manualmente.

## Cómo se usa (3 pasos, una sola vez)

1. Descarga `instalar_migrador_rdo.bat` (link arriba)
2. Doble click en el archivo descargado
3. Cuando te pregunte, pega las 3 claves:
   - SUPABASE_URL (la sabes Pablo)
   - SUPABASE_SERVICE_ROLE_KEY (la sabes Pablo)
   - GITHUB_PERSONAL_ACCESS_TOKEN (lo creas en
     https://github.com/settings/tokens — scopes: repo, workflow)

Listo. Te queda un acceso directo `MIGRADOR-RDO.bat` en el escritorio.

## Lo que hace el instalador

- Verifica que tengas Python (si no, te abre la página para instalar)
- Instala las librerías que el agente va a necesitar
- Crea carpeta `~/migrador-rdo/` con tus claves cifradas en .env
- Prueba conexión a Supabase y GitHub
- Te deja shortcut en el escritorio

## Lo que NO hace el instalador

- NO sube tus claves a ningún servidor
- NO toca tu Excel original
- NO hace migraciones automáticas
- NO modifica nada en producción

Las migraciones las pide el agente MIGRADOR-RDO via platform.claude.com,
y tú decides ejecutar cada una con un comando simple del estilo:

```
python migrar.py caja-31
```

## Si algo falla

Avisas a Dusan o me lo dices directo. El agente puede regenerar el
script de migración tantas veces como sea necesario.
