
"use client";

import { useState } from "react";
import type { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCode, Download, Hotel } from "lucide-react";
import TravelerForm from "@/components/traveler-form";
import type { TravelerFormSchema } from "@/components/traveler-form";

export default function Home() {
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);

  const handleGenerateXml = (data: z.infer<typeof TravelerFormSchema>) => {
    const { contrato, persona } = data;
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:peticion xmlns:ns2="http://www.neg.hospedajes.mir.es/altaParteHospedaje">
  <solicitud>
    <codigoEstablecimiento>${data.codigoEstablecimiento}</codigoEstablecimiento>
    <comunicacion>
      <contrato>
        <referencia>${contrato.referencia}</referencia>
        <fechaContrato>${contrato.fechaContrato.toISOString().split('T')[0]}</fechaContrato>
        <fechaEntrada>${contrato.fechaEntrada.toISOString().split('Z')[0]}</fechaEntrada>
        <fechaSalida>${contrato.fechaSalida.toISOString().split('Z')[0]}</fechaSalida>
        <numPersonas>${contrato.numPersonas}</numPersonas>
        <numHabitaciones>${contrato.numHabitaciones}</numHabitaciones>
        <internet>${contrato.internet}</internet>
        <pago>
          <tipoPago>${contrato.pago.tipoPago}</tipoPago>
          <fechaPago>${contrato.pago.fechaPago.toISOString().split('T')[0]}</fechaPago>
          ${contrato.pago.medioPago ? `<medioPago>${contrato.pago.medioPago}</medioPago>` : '<medioPago></medioPago>'}
          ${contrato.pago.titular ? `<titular>${contrato.pago.titular}</titular>` : '<titular></titular>'}
          ${contrato.pago.caducidadTarjeta ? `<caducidadTarjeta>${contrato.pago.caducidadTarjeta}</caducidadTarjeta>` : '<caducidadTarjeta></caducidadTarjeta>'}
        </pago>
      </contrato>
      <persona>
        <rol>${persona.rol}</rol>
        <nombre>${persona.nombre}</nombre>
        <apellido1>${persona.apellido1}</apellido1>
        ${persona.apellido2 ? `<apellido2>${persona.apellido2}</apellido2>` : ''}
        <tipoDocumento>${persona.tipoDocumento}</tipoDocumento>
        <numeroDocumento>${persona.numeroDocumento}</numeroDocumento>
        <soporteDocumento>${persona.soporteDocumento}</soporteDocumento>
        <fechaNacimiento>${persona.fechaNacimiento.toISOString().split('T')[0]}</fechaNacimiento>
        <nacionalidad>${persona.nacionalidad}</nacionalidad>
        <sexo>${persona.sexo}</sexo>
        <direccion>
          <direccion>${persona.direccion.direccion}</direccion>
          ${persona.direccion.direccionComplementaria ? `<direccionComplementaria>${persona.direccion.direccionComplementaria}</direccionComplementaria>` : '<direccionComplementaria></direccionComplementaria>'}
          <codigoMunicipio>${persona.direccion.codigoMunicipio}</codigoMunicipio>
          ${persona.direccion.nombreMunicipio ? `<nombreMunicipio>${persona.direccion.nombreMunicipio}</nombreMunicipio>` : '<nombreMunicipio></nombreMunicipio>'}
          <codigoPostal>${persona.direccion.codigoPostal}</codigoPostal>
          <pais>${persona.direccion.pais}</pais>
        </direccion>
        <telefono>${persona.telefono}</telefono>
        ${persona.telefono2 ? `<telefono2>${persona.telefono2}</telefono2>` : '<telefono2></telefono2>'}
        <correo>${persona.correo}</correo>
        ${persona.parentesco ? `<parentesco>${persona.parentesco}</parentesco>` : '<parentesco></parentesco>'}
      </persona>
    </comunicacion>
  </solicitud>
</ns2:peticion>`;
    
    const formattedXml = formatXml(xmlString);
    setGeneratedXml(formattedXml);
  };

  const handleDownloadXml = () => {
    if (!generatedXml) return;
    const blob = new Blob([generatedXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "peticion-hospedaje.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function formatXml(xml: string) {
    let formatted = '', indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(function(node) {
        if (node.match( /^\/\w/ )) indent = indent.substring(tab.length);
        if (node.startsWith('ns2:')) {
           formatted += indent + '<' + node.replace(/>/g, '>\r\n');
        } else {
           formatted += indent + '<' + node.replace(/>/g, '>\r\n');
        }
        if (node.match( /^<?\w[^>]*[^/]$/ ) && !node.startsWith("?")) indent += tab;
    });
    return formatted.substring(1, formatted.length - 3);
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-dark mb-2">
          XML Traveler's Pie
        </h1>
        <p className="text-lg text-muted-foreground">
          Generador de partes de entrada de viajeros para hospedajes.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Hotel className="text-primary" />
                Datos del Parte de Viajero
              </CardTitle>
              <CardDescription>
                Rellene todos los campos para generar el XML de la petición.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TravelerForm onGenerateXml={handleGenerateXml} />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FileCode className="text-primary" />
              XML Generado
            </CardTitle>
            <CardDescription>
              El XML generado aparecerá aquí una vez envíe el formulario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-md p-4 h-[600px] overflow-auto">
              <pre className="text-sm font-code whitespace-pre-wrap">{generatedXml || "<!-- La salida XML se mostrará aquí -->"}</pre>
            </div>
            <Button onClick={handleDownloadXml} disabled={!generatedXml}>
              <Download className="mr-2 h-4 w-4" />
              Descargar XML
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
