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
      { contenido: "¿Alguien tiene el apunte de la clase pasada?", alumnoId: creados[0].id },
      { contenido: "Racha de 6 semanas, nadie me alcanza.", alumnoId: creados[0].id },
      { contenido: "Ya pagué mi deuda, verifiquen el tablón.", alumnoId: creados[3].id },
    ],
  });

  console.log(
    `Seed listo: ${creados.length} alumnos, ${transacciones.length} pagos, ${GASTOS.length} gastos, 2 anuncios y 3 comentarios.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());