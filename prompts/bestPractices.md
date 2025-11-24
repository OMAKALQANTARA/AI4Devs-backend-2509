Guía de Buenas Prácticas - Proyecto LTI

1. Domain-Driven Design (DDD)

Entidades: Objetos con identidad y ciclo de vida continuo.

Antes
```typescript
// Ejemplo simplificado sin separación de dominio
const createCandidate = async (data: any) => {
  const candidate = await prisma.candidate.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      // ... más campos
    }
  });
  return candidate;
};
```

Después
```typescript
// Entidad Candidate (extracto)
export class Candidate {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    // ... otras propiedades

    constructor(data: any) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        // ... inicialización
    }

    async save() {
        const candidateData: any = {};
        if (this.firstName !== undefined) candidateData.firstName = this.firstName;
        if (this.lastName !== undefined) candidateData.lastName = this.lastName;
        if (this.email !== undefined) candidateData.email = this.email;
        // Maneja creación y actualización junto con entidades relacionadas
    }
}
```

Explicación: La entidad `Candidate` encapsula estado y comportamiento relacionados con el ciclo de vida del candidato. Esto separa la lógica de dominio de la infraestructura (Prisma/DB) y facilita pruebas y evolución.

Value Objects: Objetos que describen aspectos del dominio sin identidad conceptual.

Antes
```typescript
// Datos planos sin encapsulación
const education = {
  institution: "UC3M",
  title: "Computer Science",
  startDate: "2006-12-31"
};
```

Después
```typescript
// Value object / model Education (extracto)
export class Education {
    id?: number;
    institution: string;
    title: string;
    startDate: Date;
    endDate?: Date;

    constructor(data: any) {
        this.id = data.id;
        this.institution = data.institution;
        this.title = data.title;
        this.startDate = new Date(data.startDate);
        this.endDate = data.endDate ? new Date(data.endDate) : undefined;
    }

    async save() {
        const educationData: any = {
            institution: this.institution,
            title: this.title,
            startDate: this.startDate,
            endDate: this.endDate,
        };
        // Persistencia encapsulada
    }
}
```

Explicación: `Education` encapsula formato y validaciones de fechas, protegiendo invariantes del dominio.

Agregados: Conjuntos de objetos que deben ser tratados como una unidad.

Antes
```typescript
// Creación separada que puede romper consistencia
const candidate = await createCandidate(data);
await createEducation({...edu, candidateId: candidate.id});
```

Después
```typescript
// Dentro de Candidate.save se crean educations, workExperiences y resumes
if (this.education.length > 0) {
  candidateData.educations = {
    create: this.education.map(edu => ({
      institution: edu.institution,
      title: edu.title,
      startDate: edu.startDate,
      endDate: edu.endDate
    }))
  };
}
```

Explicación: `Candidate` actúa como agregado raíz y asegura creación atómica de las entidades relacionadas.

Repositorios: Interfaces que proporcionan acceso a agregados y entidades.

Antes
```typescript
// Acceso directo desde cualquier parte
const candidate = await prisma.candidate.findUnique({ where: { id } });
```

Después
```typescript
// Método estático que actúa como repositorio (extracto)
static async findOne(id: number): Promise<Candidate | null> {
  const data = await prisma.candidate.findUnique({
    where: { id },
    include: { educations: true, workExperiences: true, resumes: true }
  });
  if (!data) return null;
  return new Candidate(data);
}
```

Explicación: Encapsular acceso en métodos estáticos o repositorios reduce el acoplamiento y permite sustituir la implementación si cambia la infraestructura.

Servicios de Dominio y Aplicación: Lógica que orquesta varios objetos del dominio.

Antes
```typescript
// Lógica mezclada en controlador
app.post('/candidates', async (req, res) => {
  // validar, guardar, subir CV, enviar respuesta todo aquí
});
```

Después
```typescript
// Servicio de aplicación (extracto)
export const addCandidate = async (candidateData: any) => {
  validateCandidateData(candidateData);
  const candidate = new Candidate(candidateData);
  const savedCandidate = await candidate.save();
  // Guardar educations, workExperiences y resumes adicionales
  return savedCandidate;
};
```

Explicación: Los servicios de aplicación coordinan validaciones y operaciones del dominio, manteniendo los controladores ligeros.

2. Principios SOLID y DRY

S - Single Responsibility Principle (SRP)

Antes
```typescript
// Clase con múltiples responsabilidades (validación, persistencia, notificaciones)
class CandidateManager { validate(){}, save(){}, notify(){} }
```

Después
```typescript
// Módulo de validación (extracto)
export const validateCandidateData = (data: any) => {
  if (data.id) return; // edición -> campos opcionales
  validateName(data.firstName);
  validateName(data.lastName);
  validateEmail(data.email);
  validatePhone(data.phone);
  // ... validaciones por entidad
};
```

Explicación: Cada módulo tiene una responsabilidad única —validator valida, entidades modelan, servicios orquestan— facilitando mantenimiento y pruebas.

O - Open/Closed Principle (OCP)

Antes
```typescript
// Función que hay que modificar para soportar nuevos campos/tipos
function processCandidate(data){ if(type==='a')... else if(type==='b')... }
```

Después
```typescript
// Método save que acepta nuevos campos mediante candidateData dinámico
async save(){
  const candidateData: any = {};
  if (this.firstName !== undefined) candidateData.firstName = this.firstName;
  // ... otros campos
  if (this.id) return prisma.candidate.update({ where:{id:this.id}, data: candidateData});
  return prisma.candidate.create({ data: candidateData });
}
```

Explicación: El código está diseñado para extenderse (aceptar nuevos campos) sin modificar la estructura central.

L - Liskov Substitution Principle (LSP)

Antes
```typescript
// Subclase que rompe expectativas de la clase base (ejemplo conceptual)
```

Después
```typescript
// En este proyecto las abstracciones mantienen contratos simples (por ejemplo, modelos con save/findOne)
```

Explicación: Mantener firmas y comportamientos esperados (p. ej. métodos `save` y `findOne`) permite sustituir implementaciones sin romper clientes.

I - Interface Segregation Principle (ISP)

Antes
```typescript
// Interfaz enorme que obliga a implementar métodos no necesarios
```

Después
```typescript
// En este código se usan funciones y clases pequeñas que exponen sólo lo necesario
```

Explicación: Preferir interfaces/contratos delgados y módulos pequeños reduce acoplamiento.

D - Dependency Inversion Principle (DIP)

Antes
```typescript
// Lógica que depende directamente de Prisma en todos lados
const result = await prisma.candidate.findUnique(...)
```

Después
```typescript
// Encapsular acceso a Prisma tras métodos en los modelos o repositorios
static async findOne(id:number){ return /* llamada a prisma internamente */ }
```

Explicación: Dependiendo de abstracciones (métodos/contratos) en vez de detalles (llamadas directas a Prisma) facilita el cambio de infraestructuras.

DRY (Don't Repeat Yourself)

Antes
```typescript
// Repetir validaciones y transformaciones en varios puntos
```

Después
```typescript
// Centralizar validaciones en backend/src/application/validator.ts
export const validateCandidateData = (data: any) => { /* ... */ } 
```

Explicación: Las validaciones se centralizan evitando duplicación y disminuyendo la probabilidad de inconsistencias.

Ejemplo adicional - Gestión de archivos (separación de preocupación)

```typescript
// Servicio de subida de archivos (extracto)
const storage = multer.diskStorage({ destination(req,file,cb){ cb(null,'../uploads/'); }, filename(req,file,cb){ cb(null, Date.now() + '-' + file.originalname); } });

const fileFilter = (req,file,cb) => { /* permite solo pdf/docx */ };

export const uploadFile = (req,res) => { const uploader = upload.single('file'); uploader(req,res, function(err){ if(err) return res.status(500).json({error: err.message}); if(!req.file) return res.status(400).json({error:'Invalid file type'}); res.status(200).json({ filePath: req.file.path, fileType: req.file.mimetype }); }); };
```

Explicación: Subida de archivos está aislada en un servicio específico (`fileUploadService`) que encapsula la configuración de `multer` y manejo de errores.

Conclusión

Seguir DDD, SOLID y DRY en este proyecto ayuda a mantener el código modular, testeable y preparado para cambios en la infraestructura. Las piezas clave están en `backend/src/domain` (modelos), `backend/src/application` (servicios y validadores), `backend/src/presentation` (controladores) y `backend/src/routes`.

Referencias útiles dentro del proyecto:
- `backend/src/domain/models/*` - entidades y agregados
- `backend/src/application/validator.ts` - validaciones centralizadas
- `backend/src/application/services/*` - servicios de aplicación (candidateService, fileUploadService)
- `backend/src/presentation/controllers/*` - controladores HTTP

---
