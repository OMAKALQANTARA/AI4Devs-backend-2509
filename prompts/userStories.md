## ORIGINAL USER STORIES

Tu misión en este ejercicio es crear dos nuevos endpoints que nos permitirán manipular la lista de candidatos de una aplicación en una interfaz tipo kanban.

GET /positions/:id/candidates
Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar la siguiente información básica:

Nombre completo del candidato (de la tabla candidate).
current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score
PUT /candidates/:id/stage
Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico.


## ENHANCED USER STORIES

### [List Candidates for Position]
    Como **reclutador/usuario del sistema**,
    quiero **obtener la lista de candidatos asociados a una posición (vista tipo kanban)**,
    para que **pueda visualizar rápidamente en qué fase del proceso están los candidatos y su puntuación media para priorizar entrevistas.**

    Criterios de Aceptación:
    - Endpoint: `GET /positions/:id/candidates`
    - Parámetro de ruta: `:id` = `Position.id` (entero)
    - Respuesta: JSON array con objetos:
        - `applicationId`: Int
        - `candidateId`: Int
        - `fullName`: String (`candidate.firstName + ' ' + candidate.lastName`)
        - `currentInterviewStep`: Int (desde `application.currentInterviewStep`)
        - `averageScore`: Number | null (AVG de `interviews.score` por `applicationId`)
        - `lastInterviewDate`: ISO datetime | null (fecha de la última entrevista vinculada)
    - Orden de la lista: por `currentInterviewStep` ascendente, luego por `averageScore` descendente.
    - Errores:
        - 400 si `id` no es un entero válido.
        - 404 si `Position` con `id` no existe.

    Notas Adicionales:
    - Usar DTO de salida para estandarizar la respuesta.
    - El controlador debe ser ligero; toda la lógica reside en `positionService.getCandidates(positionId)`.

    Detalle Tecnico:
    - Implementar en `backend/src/presentation/controllers/positionController.ts` y `backend/src/application/services/positionService.ts`.
    - Consultas: usar `prisma.application.findMany` filtrando por `positionId`, incluir `candidate` y `interviews` y calcular `averageScore` con `prisma.interview.aggregate` o calcular en memoria tras traer los registros si el volumen es pequeño.
    - Optimización DB: asegurar índices en `Application.positionId` y `Interview.applicationId`; `Candidate.email` y `Employee.email` ya son únicos según `schema.prisma`.
    - Tests: unit tests para `positionService` (mock Prisma) y integration tests para el endpoint (test DB or test doubles).

---

### [Move Candidate Stage]
    Como **reclutador/usuario del sistema**,
    quiero **mover un candidato a una nueva etapa del proceso de selección**,
    para que **la vista kanban y el historial reflejen el cambio y se mantenga la integridad del flujo de entrevistas.**

    Criterios de Aceptación:
    - Endpoint: `PUT /candidates/:id/stage`
    - Ruta: `:id` = `Candidate.id` (entero)
    - Body (JSON):
        - `applicationId`: Int (obligatorio)
        - `newStepId`: Int (obligatorio)
        - `note`: String (opcional)
        - `performedBy`: Int (Employee.id) (opcional, para auditoría)
    - Respuesta: objeto con `applicationId`, `candidateId`, `previousStep`, `currentStep`, `updatedAt`.
    - Errores:
        - 400 si parámetros faltan o formato incorrecto.
        - 404 si `Application` o `InterviewStep` no existen.
        - 400 si `newStepId` no pertenece al `InterviewFlow` asociado con la `Position` de la `Application`.

    Notas Adicionales:
    - Operación atómica: realizar la actualización dentro de una transacción Prisma.
    - Registrar auditoría: insertar un registro de auditoría o crear un `Interview` con nota de tipo `stage_change` si se desea historial (recomendado).

    Detalle Tecnico:
    - Implementar en `backend/src/application/services/applicationService.ts` con un método `moveCandidateStage(applicationId, newStepId, performedBy, note)`; exponer un controlador `backend/src/presentation/controllers/applicationController.ts`.
    - Pasos recomendados en el servicio:
        1. Validar existencia de `Application` y que `application.candidateId` corresponda al `:id` de ruta.
        2. Validar que `InterviewStep.findOne(newStepId)` existe y que `InterviewStep.interviewFlowId` coincide con `Position.interviewFlowId` (consistencia de flujo).
        3. Ejecutar `prisma.$transaction` que actualice `Application.currentInterviewStep` y cree el registro de auditoría (o `Interview` con `notes`).
    - DB Impact:
        - No requiere cambios al esquema actual, pero considerar crear tabla `StageChangeLog` si se requiere esquema puro de auditoría.
        - Mantener integridad referencial entre `Application.currentInterviewStep` y `InterviewStep.id` (ya definida).
        - Asegurar índices en `InterviewStep.interviewFlowId` y `Application.positionId` para validaciones rápidas.
    - Seguridad: proteger endpoint con autorización basada en `Employee.role` (middleware JWT/roles).
    - Tests: unit tests para validaciones y transacción; integration tests para endpoint y efecto en DB.

---

Notes for developers (DoD / commit standards):
- Seguir `prompts/bestPractices.md`: controlar responsabilidades (controladores delgados, services orquestadores), centralizar validaciones en `backend/src/application/validator.ts` y encapsular acceso a Prisma en modelos/repositories.
- Añadir/actualizar rutas en `backend/src/routes/` y registrar en `backend/src/index.ts`.
- Documentar los endpoints en Swagger (proyecto ya incluye `swagger-jsdoc` / `swagger-ui-express`).
- Incluir tests automatizados y casos de error; mantener cobertura mínima para las nuevas funcionalidades.

