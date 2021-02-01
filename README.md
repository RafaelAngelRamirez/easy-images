# easy-images

> Subida de imagenes fáciles a google cloud storage desde express

## Instalación

```
npm i @codice-progressio/easy-images
```

## Configurando

Agregas tu configuración en app.js/index.js

```javascript
const easyImages = require("@codice-progressio/easy-images")
easyImages.parametros.config({
  GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
  GCLOUD_STORAGE_BUCKET_URL: process.env.GCLOUD_STORAGE_BUCKET_URL,
  GCLOUD_APPLICATION_CREDENTIALS: process.env.GCLOUD_APPLICATION_CREDENTIALS,
})
```

> `process.env.GCLOUD_APPLICATION_CREDENTIALS` debe ser un string con formato valido para parsear a JSON.

## Uso

### Subir una imágen

```javascript
const easyImages = require("@codice-progressio/easy-images")

app.put(
  "/ruta-subir-imagen",
  // Definimos la cantidad de imagenes que esperamos recibir,
  // por defecto la libreria solo ha sido testeada en single
  easyImages.recibirImagen.single("img"),
  //   Este middleware redimenciona en memoria la imagen .
  // Actualmente no se pueden modificar  en medidas diferentes a
  // 1200px
  easyImages.redimencionarMiddleware,
  async (req, res, next) => {
    easyImages
      .subirImagen(req.file)
      .then(data => {
        publicUrl = data.publicUrl
        // data retorna nuevoNombre que se genera con mongoose.
        // ObjectId y data.publicUrl que es la ruta completa
        // para ver la imagen en el bucket (debe estar publico)
        res.send(data)
      })
      .catch(_ => {
        next(_)
      })
  }
)
```

### Eliminar una imagen

```javascript
await easyImages.eliminarImagenDeBucket(imgDB.nombreBD)
```
