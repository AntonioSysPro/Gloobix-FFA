# Despliegue en Render

Este proyecto puede ser desplegado en Render.com. Siga estos pasos:

## Requisitos

*   Una cuenta de Render. Si no tiene una, regístrese en [https://render.com](https://render.com).
*   Node.js y npm instalados localmente (si necesita ejecutar comandos localmente).

## Pasos para el Despliegue

1.  **Crear un Repositorio:** Si su proyecto aún no está en un repositorio Git, cree uno (por ejemplo, en GitHub, GitLab o Bitbucket).

2.  **Conectar a Render:**
    *   Inicie sesión en su cuenta de Render.
    *   Haga clic en "New +" y seleccione "Web Service".
    *   Conecte su repositorio Git.

3.  **Configurar el Servicio Web:**
    *   **Name:** Elija un nombre para su servicio web.
    *   **Environment:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start` (o el comando apropiado para iniciar su aplicación)
    *   **Region:** Seleccione la región más cercana a sus usuarios.
    *   **Branch:** Seleccione la rama que desea desplegar (generalmente `main` o `master`).

4.  **Variables de Entorno:** Si su aplicación requiere variables de entorno, agréguelas en el panel de Render.

5.  **Desplegar:** Haga clic en "Create Web Service". Render automáticamente construirá y desplegará su aplicación.

## Opcional: Usando un archivo `render.yaml`

Para configuraciones más complejas, puede usar un archivo `render.yaml` en la raíz de su repositorio. Este archivo le permite definir múltiples servicios, bases de datos y otros recursos.

Ejemplo de `render.yaml`:

```yaml
services:
  - type: web
    name: nombre-de-tu-app
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

Para usar un archivo `render.yaml`:

1.  Cree un archivo llamado `render.yaml` en la raíz de su repositorio.
2.  Defina sus servicios y otros recursos en el archivo.
3.  Guarde los cambios en su repositorio.
4.  Al crear el servicio web en Render, seleccione "YAML" como el método de despliegue.

## Notas

*   Asegúrese de que su archivo `package.json` tenga un script `start` definido.
*   Render detecta automáticamente los cambios en su repositorio y los despliega.
