
"use client";

import { useState } from "react";
import type { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCode, Download, UploadCloud } from "lucide-react";
import TravelerForm from "@/components/traveler-form";
import type { TravelerFormSchema } from "@/components/traveler-form";

export default function Home() {
  const [schemaContent, setSchemaContent] = useState<string | null>(null);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);

  const handleLoadSchema = async () => {
    setIsSchemaLoading(true);
    try {
      const response = await fetch("/schemas/parte_viajeros.xsd");
      const text = await response.text();
      setSchemaContent(text);
    } catch (error) {
      console.error("Failed to load schema:", error);
      // Here you might want to show a toast notification
    } finally {
      setIsSchemaLoading(false);
    }
  };

  const handleGenerateXml = (data: z.infer<typeof TravelerFormSchema>) => {
    const traveler = data.travelers[0];
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<parte xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="parte_viajeros.xsd">
  <codigoEstablecimiento>${data.codigoEstablecimiento}</codigoEstablecimiento>
  <referencia>${data.referencia}</referencia>
  <viajeros>
    <viajero>
      <orden>1</orden>
      <nombre>${traveler.nombre}</nombre>
      <apellido1>${traveler.apellido1}</apellido1>
      ${traveler.apellido2 ? `<apellido2>${traveler.apellido2}</apellido2>` : ""}
      <sexo>${traveler.sexo}</sexo>
      <tipoDocumento>${traveler.tipoDocumento}</tipoDocumento>
      <numeroDocumento>${traveler.numeroDocumento}</numeroDocumento>
      ${traveler.fechaExpedicionDocumento ? `<fechaExpedicionDocumento>${traveler.fechaExpedicionDocumento.toISOString().split('T')[0]}</fechaExpedicionDocumento>` : ""}
      <fechaNacimiento>${traveler.fechaNacimiento.toISOString().split('T')[0]}</fechaNacimiento>
      <paisNacionalidad>${traveler.paisNacionalidad}</paisNacionalidad>
      <fechaEntrada>${traveler.fechaEntrada.toISOString().split('T')[0]}</fechaEntrada>
    </viajero>
  </viajeros>
</parte>`;
    
    // Pretty print the XML for display
    const formattedXml = formatXml(xmlString);
    setGeneratedXml(formattedXml);
  };

  const handleDownloadXml = () => {
    if (!generatedXml) return;
    const blob = new Blob([generatedXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parte-viajeros.xml";
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
        formatted += indent + '<' + node.replace(/>/g, '>\r\n');
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
          Generador de partes de entrada de viajeros.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <UploadCloud className="text-primary" />
                1. Cargar Esquema
              </CardTitle>
              <CardDescription>
                Para comenzar, cargue el esquema XML de parte de viajeros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLoadSchema} disabled={isSchemaLoading || !!schemaContent}>
                {schemaContent ? "Esquema Cargado" : isSchemaLoading ? "Cargando..." : "Cargar Esquema de Parte de Viajeros"}
              </Button>
            </CardContent>
          </Card>

          {schemaContent && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">2. Introducir Datos del Viajero</CardTitle>
                <CardDescription>
                  Rellene los datos del parte de viajero. ¡Usa la varita mágica para obtener sugerencias de la IA!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TravelerForm 
                  schema={schemaContent} 
                  onGenerateXml={handleGenerateXml} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FileCode className="text-primary" />
              3. XML Generado
            </CardTitle>
            <CardDescription>
              El XML generado aparecerá aquí una vez envíe el formulario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-md p-4 h-96 overflow-auto">
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
