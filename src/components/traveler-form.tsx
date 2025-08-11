
"use client";

import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { getSuggestionAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

const ViajeroSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio."),
  apellido1: z.string().min(2, "El primer apellido es obligatorio."),
  apellido2: z.string().optional(),
  sexo: z.string({ required_error: "El sexo es obligatorio." }),
  tipoDocumento: z.string({ required_error: "El tipo de documento es obligatorio." }),
  numeroDocumento: z.string().min(3, "El número de documento es obligatorio."),
  fechaExpedicionDocumento: z.date().optional(),
  fechaNacimiento: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  paisNacionalidad: z.string().min(2, "El país es obligatorio."),
  fechaEntrada: z.date({ required_error: "La fecha de entrada es obligatoria." }),
});

export const TravelerFormSchema = z.object({
  codigoEstablecimiento: z.string().min(1, "El código de establecimiento es obligatorio."),
  referencia: z.string().min(1, "La referencia es obligatoria."),
  travelers: z.array(ViajeroSchema).min(1),
});

interface TravelerFormProps {
  schema: string;
  onGenerateXml: (data: z.infer<typeof TravelerFormSchema>) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function TravelerForm({ schema, onGenerateXml }: TravelerFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [documentTypes, setDocumentTypes] = useState<SelectOption[]>([]);
  const [genders, setGenders] = useState<SelectOption[]>([]);

  useEffect(() => {
    fetch('/data/document_types.json')
      .then(res => res.json())
      .then(data => setDocumentTypes(data));
    
    fetch('/data/genders.json')
      .then(res => res.json())
      .then(data => setGenders(data));
  }, []);

  const form = useForm<z.infer<typeof TravelerFormSchema>>({
    resolver: zodResolver(TravelerFormSchema),
    defaultValues: {
      codigoEstablecimiento: "",
      referencia: "",
      travelers: [{
        nombre: "",
        apellido1: "",
        apellido2: "",
        numeroDocumento: "",
        paisNacionalidad: ""
      }],
    },
  });
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "travelers",
  });

  const handleSuggestion = (fieldName: keyof z.infer<typeof ViajeroSchema>, fieldDescription: string) => {
    startTransition(async () => {
      try {
        const currentData = form.getValues();
        const traveler = currentData.travelers[0];
        const existingData = `<parte>
          <nombre>${traveler.nombre || ''}</nombre>
          <apellido1>${traveler.apellido1 || ''}</apellido1>
        </parte>`;

        const result = await getSuggestionAction({
          xmlSchema: schema,
          existingData,
          fieldDescription,
        });

        if (result.suggestion) {
          form.setValue(`travelers.0.${fieldName}`, result.suggestion, { shouldValidate: true });
          toast({
            title: "¡Sugerencia aplicada!",
            description: `Campo actualizado con la sugerencia de la IA.`,
          });
        } else {
            throw new Error("Sugerencia vacía recibida.");
        }
      } catch (error) {
        console.error("Falló la sugerencia:", error);
        toast({
          variant: "destructive",
          title: "¡Uy! Algo salió mal.",
          description: "No se pudo obtener una sugerencia de la IA.",
        });
      }
    });
  };

  const onSubmit = (data: z.infer<typeof TravelerFormSchema>) => {
    onGenerateXml(data);
    toast({
      title: "¡XML Generado!",
      description: "El parte de viajero se ha creado correctamente.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="codigoEstablecimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Establecimiento</FormLabel>
              <FormControl>
                <Input placeholder="Código del hotel o alojamiento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia</FormLabel>
              <FormControl>
                <Input placeholder="Referencia del parte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium">Viajero {index + 1}</h3>
             <FormField
                control={form.control}
                name={`travelers.${index}.nombre`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="e.g., Juan" {...field} />
                      </FormControl>
                       <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleSuggestion('nombre', 'Un nombre de pila común en España.')}
                        disabled={isPending}
                        aria-label="Obtener sugerencia de IA para el nombre"
                      >
                        <Sparkles className="h-4 w-4 text-accent" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.apellido1`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primer Apellido</FormLabel>
                     <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="e.g., Pérez" {...field} />
                        </FormControl>
                         <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleSuggestion('apellido1', 'Un apellido común en España.')}
                          disabled={isPending}
                          aria-label="Obtener sugerencia de IA para el primer apellido"
                        >
                          <Sparkles className="h-4 w-4 text-accent" />
                        </Button>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.apellido2`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segundo Apellido (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gómez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.sexo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sexo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name={`travelers.${index}.tipoDocumento`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.numeroDocumento`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12345678A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name={`travelers.${index}.fechaExpedicionDocumento`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Expedición Documento (Opcional)</FormLabel>
                    <DatePicker field={field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.fechaNacimiento`}
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
                name={`travelers.${index}.paisNacionalidad`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País de Nacionalidad</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., España" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`travelers.${index}.fechaEntrada`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Entrada</FormLabel>
                    <DatePicker field={field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
        ))}
        
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
          Generar XML
        </Button>
      </form>
    </Form>
  );
}
