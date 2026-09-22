import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CUOTA = 20;
const DIA = 86_400_000;

// La deuda se calcula en vivo; semanasPagadas define el nivel de cada uno.
// fechaInicio está 8 semanas atrás -> la semana en curso es la 9.
const ALUMNOS = [
  { nombre: "María", semanasPagadas: 9 },
  { nombre: "Luis", semanasPagadas: 9 },
  { nombre: "Ana", semanasPagadas: 7 },
  { nombre: "Carlos", semanasPagadas: 6 },
  { nombre: "Sofía", semanasPagadas: 5 },
  { nombre: "Jorge", semanasPagadas: 4 },
];

const NOTAS = [
  "Me pagó con billete de 500, cambio justo.",
  "Pagó en efectivo durante la clase.",
  "Transferencia a la cuenta del grupo.",
];

async function main() {
  await prisma.configuracion.deleteMany();
  await prisma.opcion.deleteMany();
  await prisma.encuesta.deleteMany();
  await prisma.sugerencia.deleteMany();
  await prisma.comentario.deleteMany();
  await prisma.anuncio.deleteMany();
  await prisma.transaccion.deleteMany();
  await prisma.alumno.deleteMany();

  await prisma.alumno.createMany({
    data: ALUMNOS.map((a) => ({
      ...a,
      rachaActual: a.semanasPagadas,
      mejorRacha: a.semanasPagadas,
      ultimoPago: new Date(Date.now() - 2 * DIA),
    })),
  });

  const creados = await prisma.alumno.findMany({ orderBy: { nombre: "asc" } });

  const transacciones = creados.flatMap((alumno) =>
    Array.from({ length: alumno.semanasPagadas }).map((_, i) => ({
      monto: CUOTA,
      tipo: "INGRESO",
      descripcion: `Cuota semanal ${CUOTA} pesos - ${alumno.nombre}`,
      notaAdmin: i === 0 && alumno.semanasPagadas >= 3 ? NOTAS[i % NOTAS.length] : null,
      alumnoId: alumno.id,
      fecha: new Date(Date.now() - i * 7 * DIA),
    })),
  );

  await prisma.transaccion.createMany({ data: transacciones });

  const GASTOS = [
    { monto: 240, tipo: "GASTO", descripcion: "Loncheras para la junta general", fecha: new Date(Date.now() - 2 * DIA) },
    { monto: 85, tipo: "GASTO", descripcion: "Mercería: cartulina, plumones y cinta", fecha: new Date(Date.now() - 5 * DIA) },
    { monto: 120, tipo: "GASTO", descripcion: "Impresión de credenciales del grupo", fecha: new Date(Date.now() - 9 * DIA) },
  ];
  await prisma.transaccion.createMany({ data: GASTOS });

  await prisma.configuracion.create({ data: { id: 1, fechaInicio: new Date(Date.now() - 8 * 7 * DIA) } });

  await prisma.anuncio.createMany({
    data: [
      { mensaje: "La cuota sube a $20 semanales, sin excepciones." },
      { mensaje: "Junta general el viernes a las 11:00." },
    ],
  });

  await prisma.comentario.createMany({
    data: [
      { alias: "Monito Tacaño", contenido: "¿Alguien tiene el apunte de la clase pasada? Comparto los míos." },
      { alias: "Burrito Misterioso", contenido: "Ya pagué mi deuda, verifiquen el tablón." },
      { alias: "Gatito Fiestero", contenido: "El próximo viernes junta general, no falten." },
    ],
  });

  await prisma.comentario.create({
    data: {
      alias: "Cerdito Veloz",
      contenido: "Racha de 9 semanas, nadie me alcanza 🐷",
      reacciones: {
        create: [
          { emoji: "😂", votantes: ["dev_seed1", "dev_seed2"] },
          { emoji: "🔥", votantes: ["dev_seed3"] },
          { emoji: "❤️", votantes: ["dev_seed1"] },
        ],
      },
    },
  });

  const encuesta = await prisma.encuesta.create({
    data: {
      pregunta: "¿Qué hacemos con el fondo para la fiesta de fin de semestre?",
      esAdmin: true,
      opciones: {
        create: [
          { texto: "Pa' la cena grupal", votos: 4, votantes: ["dev_seed1", "dev_seed2", "dev_seed3", "dev_seed4"] },
          { texto: "Ahorrarlo para la siguiente", votos: 2, votantes: ["dev_seed5", "dev_seed6"] },
          { texto: "Comprar trofeo al tesorero", votos: 1, votantes: ["dev_seed7"] },
        ],
      },
    },
  });
  void encuesta;

  await prisma.sugerencia.createMany({
    data: [
      { mensaje: "Buen trabajo con el tablón, ¡se ve genial!" },
      { mensaje: "Podrían poner el botón de descargar Excel en la vista de invitados." },
    ],
  });

  console.log(
    `Seed listo: ${creados.length} alumnos, ${transacciones.length} pagos, ${GASTOS.length} gastos, 2 anuncios, 4 comentarios, 1 encuesta y 2 sugerencias.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());