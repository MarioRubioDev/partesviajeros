
"use client";

import type { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel } from "lucide-react";
import TravelerForm from "@/components/traveler-form";
import type { TravelerFormSchema } from "@/components/traveler-form";

export default function Home() {
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

  const handleGenerateAndDownloadXml = (data: z.infer<typeof TravelerFormSchema>) => {
    const { contrato, persona } = data;
    const direccionXml = persona.direccion.pais === 'ESP'
      ? `
          <codigoMunicipio>${persona.direccion.codigoMunicipio}</codigoMunicipio>
          <codigoPostal>${persona.direccion.codigoPostal}</codigoPostal>
          <pais>${persona.direccion.pais}</pais>
        `
      : `
          <codigoMunicipio></codigoMunicipio>
          <nombreMunicipio>${persona.direccion.nombreMunicipio}</nombreMunicipio>
          <codigoPostal>${persona.direccion.codigoPostal}</codigoPostal>
          <pais>${persona.direccion.pais}</pais>
        `;

    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:peticion xmlns:ns2="http://www.neg.hospedajes.mir.es/altaParteHospedaje">
  <solicitud>
    <codigoEstablecimiento>${data.codigoEstablecimiento}</codigoEstablecimiento>
    <comunicacion>
      <contrato>
        <referencia>${contrato.referencia}</referencia>
        <fechaContrato>${contrato.fechaContrato.toISOString().split('T')[0]}</fechaContrato>
        <fechaEntrada>${contrato.fechaEntrada.toISOString().split('.')[0]}</fechaEntrada>
        <fechaSalida>${contrato.fechaSalida.toISOString().split('.')[0]}</fechaSalida>
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
        ${persona.apellido2 ? `<apellido2>${persona.apellido2}</apellido2>` : '<apellido2></apellido2>'}
        <tipoDocumento>${persona.tipoDocumento}</tipoDocumento>
        <numeroDocumento>${persona.numeroDocumento}</numeroDocumento>
        <soporteDocumento>${persona.soporteDocumento}</soporteDocumento>
        <fechaNacimiento>${persona.fechaNacimiento.toISOString().split('T')[0]}</fechaNacimiento>
        <nacionalidad>${persona.nacionalidad}</nacionalidad>
        <sexo>${persona.sexo}</sexo>
        <direccion>
          <direccion>${persona.direccion.direccion}</direccion>
          ${persona.direccion.direccionComplementaria ? `<direccionComplementaria>${persona.direccion.direccionComplementaria}</direccionComplementaria>` : '<direccionComplementaria></direccionComplementaria>'}
          ${direccionXml.trim()}
        </direccion>
        <telefono>${persona.telefono}</telefono>
        ${persona.telefono2 ? `<telefono2>${persona.telefono2}</telefono2>` : '<telefono2></telefono2>'}
        <correo>${persona.correo}</correo>
        ${persona.parentesco ? `<parentesco>${persona.parentesco}</parentesco>` : '<parentesco></parentesco>'}
      </persona>
    </comunicacion>
  </solicitud>
</ns2:peticion>`;

    const blob = new Blob([xmlString], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contrato.referencia}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-dark mb-2">
          Parte de Viajeros
        </h1>
        <p className="text-lg text-muted-foreground">
          Generador de partes de entrada de viajeros para hospedajes.
        </p>
      </header>

      <div className="flex justify-center">
        <div className="w-full lg:w-4/5">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Hotel className="text-primary" />
                Datos del Viajero
              </CardTitle>
              <CardDescription>
                Rellene todos los campos para generar el XML de la petición.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TravelerForm onGenerateXml={handleGenerateAndDownloadXml} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
