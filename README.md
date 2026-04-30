# PaseoCan AWS MVP

Este paquete convierte la landing/app estática de PaseoCan en una app preparada para guardar datos en AWS mediante **AWS Amplify Gen 2 + Amplify Data + DynamoDB**.

## Qué incluye

- Frontend en Vite + JavaScript.
- Backend Amplify Gen 2 en `/amplify`.
- Modelos de datos para:
  - `Owner` / dueños.
  - `Dog` / perros.
  - `Walker` / paseadores.
  - `Walk` / paseos o reservas.
- Fallback local con `localStorage`: si todavía no hay backend configurado, la app sigue funcionando en modo local.
- Botón para cargar datos demo.
- Panel básico para ver dueños, perros, paseadores y paseos.

## Requisitos

- Node.js 18.16 o superior.
- npm.
- Cuenta de AWS.
- Repo de GitHub conectado a AWS Amplify.

## Instalación local

```bash
npm install
npm run dev
```

La app abrirá localmente con Vite. Si todavía no configuraste Amplify, verás el mensaje **Modo local activo**.

## Probar con backend local de Amplify

Primero necesitás configurar tus credenciales de AWS localmente. Luego:

```bash
npm run sandbox
```

Esto crea un sandbox de Amplify y genera el archivo `amplify_outputs.json` con la configuración real del backend. Después corré:

```bash
npm run dev
```

Cuando la configuración esté correcta, el estado cambiará a **AWS conectado**.

## Publicar en AWS Amplify

1. Subí estos archivos a tu repo de GitHub.
2. Entrá a AWS Amplify.
3. Conectá el repo y la rama `main`.
4. Confirmá que Amplify use el archivo `amplify.yml` incluido.
5. Publicá.

El archivo `amplify.yml` ejecuta:

```bash
npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
npm run build
```

Eso despliega el backend y luego genera el frontend en `/dist`.

## Importante sobre seguridad

Esta primera versión usa autorización pública con API Key para facilitar el MVP. Sirve para validar el flujo, pero **no es la configuración final recomendada** si vas a capturar datos reales de usuarios.

Para producción, la siguiente fase debería incluir:

- Login con Amazon Cognito.
- Roles para administrador, dueño y paseador.
- Reglas de lectura/escritura más estrictas.
- Política de privacidad.
- Validaciones adicionales en formularios.

## Estructura del proyecto

```text
.
├── amplify/
│   ├── backend.ts
│   └── data/
│       └── resource.ts
├── src/
│   ├── main.js
│   └── styles.css
├── index.html
├── package.json
├── amplify.yml
├── amplify_outputs.json
└── README.md
```

## Modelos de datos

### Owner

Dueños de perros.

Campos principales:

- `name`
- `phone`
- `email`
- `zone`
- `address`
- `notes`

### Dog

Perros registrados.

Campos principales:

- `ownerId`
- `name`
- `breed`
- `age`
- `size`
- `energy`
- `notes`

### Walker

Paseadores disponibles.

Campos principales:

- `name`
- `phone`
- `email`
- `zone`
- `rate`
- `rating`
- `distance`
- `tags`
- `availability`
- `status`
- `notes`

### Walk

Paseos o reservas.

Campos principales:

- `ownerId`
- `dogId`
- `walkerId`
- `date`
- `time`
- `duration`
- `route`
- `status`
- `estimatedCost`
- `notes`
