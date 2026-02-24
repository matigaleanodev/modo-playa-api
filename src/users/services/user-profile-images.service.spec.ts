describe('UserProfileImagesService', () => {
  it.todo(
    'debe rechazar la signed url si el usuario no pertenece al owner autenticado',
  );
  it.todo(
    'debe devolver la imagen existente sin duplicar metadata al reintentar confirm',
  );
  it.todo('debe reemplazar la imagen de perfil previa sin duplicar metadata');
  it.todo('debe fallar la confirmación si el objeto no existe en storage');
  it.todo(
    'debe invocar getObjectStream para procesar la imagen sin cargarla completa en memoria',
  );
});
