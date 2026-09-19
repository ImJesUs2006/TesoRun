export type AlumnoPublico = {
  id: string;
  nombre: string;
  avatarUrl: string | null;
  semanasPagadas: number;
  deuda: number;
  rachaActual: number;
  mejorRacha: number;
};

export type NotaTransaccion = {
  id: string;
  fecha: Date;
  monto: number;
  notaAdmin: string;
};