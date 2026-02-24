describe('LodgingImagesService', () => {
  it.todo(
    'debe rechazar la generación de signed url cuando el alojamiento ya tiene 5 imágenes o reservas pendientes',
  );

  it.todo(
    'debe devolver la imagen existente sin duplicar metadata cuando confirm se reintenta con el mismo imageId',
  );

  it.todo(
    'debe persistir metadata sin reprocesar cuando finalKey ya existe y no existe metadata',
  );

  it.todo(
    'debe impedir superar el límite de 5 al confirmar bajo concurrencia mediante actualización atómica',
  );

  it.todo(
    'debe fallar la confirmación si la reserva pending no existe o expiró',
  );

  it.todo(
    'debe fallar la confirmación si headObject informa un tamaño mayor al máximo permitido',
  );

  it.todo(
    'debe invocar getObjectStream para procesar la imagen sin cargarla completa en memoria',
  );

  it.todo(
    'debe marcar como predeterminada la imagen indicada y desmarcar las demás',
  );

  it.todo(
    'debe reasignar una imagen predeterminada al borrar la imagen default',
  );

  it.todo('debe fallar la confirmación si el objeto no existe en storage');

  it.todo(
    'debe rechazar la signed url si el alojamiento no pertenece al owner autenticado',
  );
});
