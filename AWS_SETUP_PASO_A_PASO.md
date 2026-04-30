# Guía rápida para conectar PaseoCan con AWS Amplify

## 1. Subir el paquete a GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Add PaseoCan AWS MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si ya estás usando el repo existente, podés copiar estos archivos dentro del repo `apps` y luego correr:

```bash
git add .
git commit -m "Add Amplify data backend"
git push origin main
```

## 2. Conectar AWS Amplify

En AWS Amplify:

1. Entrá a **AWS Amplify**.
2. Seleccioná **Create new app** o abrí tu app existente.
3. Elegí GitHub como proveedor.
4. Seleccioná el repo y la rama `main`.
5. Confirmá la configuración de build.

Este paquete ya incluye `amplify.yml`, por lo que Amplify debería detectar:

- Backend: `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`
- Frontend: `npm run build`
- Output: `dist`

## 3. Validar que la base de datos exista

Después del deploy:

1. Entrá al detalle del deploy en Amplify.
2. Revisá que el backend haya desplegado sin errores.
3. Buscá los recursos creados para Amplify Data.
4. La base se respalda en DynamoDB.

## 4. Probar registros

Abrí la URL publicada y probá:

1. Registrar un dueño.
2. Registrar un perro asociado a ese dueño.
3. Registrar un paseador.
4. Crear un paseo.
5. Recargar la página.

Si AWS quedó conectado correctamente, los datos deben mantenerse después de recargar y desde otros navegadores.

## 5. Siguiente mejora recomendada

Esta versión está pensada como MVP. Para producción, el siguiente ajuste debería ser agregar autenticación:

- Administrador: puede ver todo.
- Dueño: puede ver sus perros y paseos.
- Paseador: puede ver solicitudes asignadas.

Eso se haría con Amazon Cognito y reglas de autorización por usuario.
