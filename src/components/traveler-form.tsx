
"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import paises from "@/lib/data/paises.json";
import municipios from "@/lib/data/municipios.json";
import provincias from "@/lib/data/provincias.json";

const pagoSchema = z.object({
  tipoPago: z.string().min(1, "El tipo de pago es obligatorio"),
  fechaPago: z.date(),
  medioPago: z.string().optional(),
  titular: z.string().optional(),
  caducidadTarjeta: z
    .string()
    .optional()
    .refine((val) => !val || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val), {
      message: "Formato de caducidad debe ser mm/aaaa",
    }),
});

const contratoSchema = z.object({
  referencia: z.string().min(1, "La referencia es obligatoria"),
  fechaContrato: z.date(),
  fechaEntrada: z.date(),
  fechaSalida: z.date(),
  numPersonas: z.coerce.number().int().min(1, "Debe haber al menos una persona"),
  numHabitaciones: z.coerce
    .number()
    .int()
    .min(0, "El número de habitaciones no puede ser negativo"),
  internet: z.boolean(),
  pago: pagoSchema,
});

const direccionSchema = z.object({
  direccion: z.string().min(1, "La dirección es obligatoria"),
  direccionComplementaria: z.string().optional(),
  codigoMunicipio: z.string().min(1, "El código de municipio es obligatorio"),
  nombreMunicipio: z.string().min(1, "El nombre del municipio es obligatorio"),
  codigoPostal: z.string().min(1, "El código postal es obligatorio"),
  pais: z.string().min(3, "El país es obligatorio (ISO alfa-3)"),
  provincia: z.string().optional(),
});

const personaSchema = z.object({
  rol: z.string().min(1, "El rol es obligatorio."),
  nombre: z.string().min(2, "El nombre es obligatorio."),
  apellido1: z.string().min(2, "El primer apellido es obligatorio."),
  apellido2: z.string().optional(),
  tipoDocumento: z.string({
    required_error: "El tipo de documento es obligatorio.",
  }),
  numeroDocumento: z.string().min(3, "El número de documento es obligatorio."),
  soporteDocumento: z
    .string()
    .regex(/^[a-zA-Z]{3}\d{6}$/, "El soporte debe tener 3 letras y 6 números."),
  fechaNacimiento: z.date({
    required_error: "La fecha de nacimiento es obligatoria.",
  }),
  nacionalidad: z.string().min(3, "La nacionalidad es obligatoria (ISO alfa-3)"),
  sexo: z.string({ required_error: "El sexo es obligatorio." }),
  direccion: direccionSchema,
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  telefono2: z.string().optional(),
  correo: z.string().email("Debe ser un correo electrónico válido"),
  parentesco: z.string().optional(),
});

export const TravelerFormSchema = z.object({
  codigoEstablecimiento: z
    .string()
    .min(1, "El código de establecimiento es obligatorio."),
  contrato: contratoSchema,
  persona: personaSchema,
}).refine(data => {
    if (data.persona.direccion.pais === 'ESP') {
        const codigoMunicipio = data.persona.direccion.codigoMunicipio;
        return codigoMunicipio && /^\d{5}$/.test(codigoMunicipio);
    }
    return true;
}, {
    message: "El código de municipio es obligatorio y debe tener 5 dígitos si el país es España.",
    path: ["persona.direccion.codigoMunicipio"],
});

interface TravelerFormProps {
  onGenerateXml: (data: z.infer<typeof TravelerFormSchema>) => void;
}

const getDefaultFechaSalida = () => {
  const fechaSalida = new Date();
  fechaSalida.setDate(fechaSalida.getDate() + 3);
  fechaSalida.setHours(12, 0, 0, 0);
  return fechaSalida;
};

export default function TravelerForm({ onGenerateXml }: TravelerFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof TravelerFormSchema>>({
    resolver: zodResolver(TravelerFormSchema),
    defaultValues: {
      codigoEstablecimiento: "",
      contrato: {
        referencia: "",
        fechaContrato: new Date(),
        fechaEntrada: new Date(),
        fechaSalida: getDefaultFechaSalida(),
        numPersonas: 1,
        numHabitaciones: 1,
        internet: false,
        pago: {
          tipoPago: undefined,
          fechaPago: new Date(),
          medioPago: "",
          titular: "",
          caducidadTarjeta: "",
        },
      },
      persona: {
        rol: "VI",
        nombre: "",
        apellido1: "",
        apellido2: "",
        tipoDocumento: undefined,
        numeroDocumento: "",
        soporteDocumento: "",
        nacionalidad: "ESP",
        sexo: undefined,
        direccion: {
          direccion: "",
          direccionComplementaria: "",
          codigoMunicipio: "",
          nombreMunicipio: "",
          codigoPostal: "",
          pais: "ESP",
          provincia: "",
        },
        telefono: "",
        telefono2: "",
        correo: "",
        parentesco: undefined,
      },
    },
  });

  useEffect(() => {
    const savedCodigo = localStorage.getItem("codigoEstablecimiento");
    if (savedCodigo) {
      form.setValue("codigoEstablecimiento", savedCodigo);
    }
  }, [form]);

  const paisSeleccionado = form.watch("persona.direccion.pais");

  useEffect(() => {
      if (paisSeleccionado !== 'ESP') {
          form.resetField("persona.direccion.provincia");
      }
      form.resetField("persona.direccion.codigoMunicipio");
      form.resetField("persona.direccion.nombreMunicipio");
  }, [paisSeleccionado, form]);

  const onSubmit = (data: z.infer<typeof TravelerFormSchema>) => {
    startTransition(() => {
      localStorage.setItem("codigoEstablecimiento", data.codigoEstablecimiento);
      onGenerateXml(data);
      toast({
        title: "¡XML Generado y Descargado!",
        description:
          "La petición de alta de parte se ha creado y descargado correctamente.",
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="codigoEstablecimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Establecimiento</FormLabel>
              <FormControl>
                <Input placeholder="0000000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <h3 className="text-lg font-semibold">Datos del Contrato</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contrato.referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia</FormLabel>
                <FormControl>
                  <Input placeholder="20250810-01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.fechaContrato"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Contrato</FormLabel>
                <DatePicker field={field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.fechaEntrada"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Entrada</FormLabel>
                <DatePicker field={field} showTime />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.fechaSalida"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Salida</FormLabel>
                <DatePicker field={field} showTime />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.numPersonas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Personas</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.numHabitaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Habitaciones</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.internet"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-full">
                <div className="space-y-0.5">
                  <FormLabel>Internet</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />
        <h4 className="text-md font-semibold">Datos de Pago</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contrato.pago.tipoPago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de pago"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DESTI">DESTI</SelectItem>
                    <SelectItem value="EFECT">EFECT</SelectItem>
                    <SelectItem value="TARJT">TARJT</SelectItem>
                    <SelectItem value="PLATF">PLATF</SelectItem>
                    <SelectItem value="TRANS">TRANS</SelectItem>
                    <SelectItem value="MOVIL">MOVIL</SelectItem>
                    <SelectItem value="TREG">TREG</SelectItem>
                    <SelectItem value="OTRO">OTRO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.pago.fechaPago"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Pago</FormLabel>
                <DatePicker field={field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.pago.medioPago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medio de Pago (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.pago.titular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titular (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contrato.pago.caducidadTarjeta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caducidad Tarjeta (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="mm/aaaa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        <h3 className="text-lg font-semibold">Datos de la Persona</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="persona.rol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    className="bg-gray-100 dark:bg-zinc-800"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Lucas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.apellido1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primer Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Martinez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.apellido2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Segundo Apellido (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ruiz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.tipoDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de documento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NIF">NIF</SelectItem>
                    <SelectItem value="NIE">NIE</SelectItem>
                    <SelectItem value="PAS">PAS</SelectItem>
                    <SelectItem value="OTRO">OTRO</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.numeroDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Documento</FormLabel>
                <FormControl>
                  <Input placeholder="12345678T" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.soporteDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soporte Documento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ABC123456" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.fechaNacimiento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <DatePicker field={field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.nacionalidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nacionalidad (ISO3)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paises.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.sexo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sexo"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                    <SelectItem value="O">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="666123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.telefono2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono 2 (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.correo"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="correo@correo.es" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.parentesco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco (Opcional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar parentesco" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AB">Abuelo/a</SelectItem>
                    <SelectItem value="CY">Cónyuge</SelectItem>
                    <SelectItem value="HJ">Hijo/a</SelectItem>
                    <SelectItem value="HR">Hermano/a</SelectItem>
                    <SelectItem value="PM">Padre/Madre</SelectItem>
                    <SelectItem value="OT">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        <h4 className="text-md font-semibold">Dirección de la Persona</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="persona.direccion.direccion"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Paseo de la castellana, 13" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.direccion.direccionComplementaria"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Dirección Complementaria (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.direccion.pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País (ISO3)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paises.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        {paisSeleccionado === 'ESP' && (
          <FormField
            control={form.control}
            name="persona.direccion.provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {provincias.map((p) => (
                      <SelectItem key={p.codigo} value={p.codigo}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
           <FormField
            control={form.control}
            name="persona.direccion.nombreMunicipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Municipio</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del municipio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.direccion.codigoMunicipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Municipio</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. 28079" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="persona.direccion.codigoPostal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input placeholder="28046" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        </div>

        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
          disabled={isPending}
        >
          Generar y Descargar XML
        </Button>
      </form>
    </Form>
  );
}

    