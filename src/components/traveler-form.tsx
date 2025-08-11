
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { getSuggestionAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export const TravelerFormSchema = z.object({
  travelerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  destination: z.string().min(2, { message: "Destination is required." }),
  departureDate: z.date({ required_error: "A departure date is required." }),
  travelPurpose: z.string({ required_error: "Please select a travel purpose." }),
  transportMode: z.string({ required_error: "Please select a transport mode." }),
  notes: z.string().optional(),
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

  const [purposes, setPurposes] = useState<SelectOption[]>([]);
  const [transports, setTransports] = useState<SelectOption[]>([]);

  useEffect(() => {
    fetch('/data/condiciones.json')
      .then(res => res.json())
      .then(data => setPurposes(data));
    
    fetch('/data/datos.json')
      .then(res => res.json())
      .then(data => setTransports(data));
  }, []);

  const form = useForm<z.infer<typeof TravelerFormSchema>>({
    resolver: zodResolver(TravelerFormSchema),
    defaultValues: {
      travelerName: "",
      destination: "",
      notes: "",
    },
  });

  const handleSuggestion = (fieldName: "travelerName" | "destination", fieldDescription: string) => {
    startTransition(async () => {
      try {
        const currentData = form.getValues();
        const existingData = `<travelerPie>
          <travelerName>${currentData.travelerName || ''}</travelerName>
          <destination>${currentData.destination || ''}</destination>
        </travelerPie>`;

        const result = await getSuggestionAction({
          xmlSchema: schema,
          existingData,
          fieldDescription,
        });

        if (result.suggestion) {
          form.setValue(fieldName, result.suggestion, { shouldValidate: true });
          toast({
            title: "Suggestion applied!",
            description: `Field "${fieldName}" updated with AI suggestion.`,
          });
        } else {
            throw new Error("Empty suggestion received.");
        }
      } catch (error) {
        console.error("Suggestion failed:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Could not get an AI suggestion.",
        });
      }
    });
  };

  const onSubmit = (data: z.infer<typeof TravelerFormSchema>) => {
    onGenerateXml(data);
    toast({
      title: "XML Generated!",
      description: "Your travel document has been created successfully.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="travelerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Traveler Name</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g., John Doe" {...field} />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleSuggestion('travelerName', 'A plausible name for a traveler.')}
                  disabled={isPending}
                  aria-label="Get AI suggestion for traveler name"
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
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
               <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g., Paris, France" {...field} />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleSuggestion('destination', 'A popular travel destination city and country.')}
                  disabled={isPending}
                  aria-label="Get AI suggestion for destination"
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
          name="departureDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Departure Date</FormLabel>
              <DatePicker field={field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="travelPurpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of Travel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a purpose" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {purposes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transportMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode of Transport</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a transport mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {transports.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details about the trip..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
          Generate XML
        </Button>
      </form>
    </Form>
  );
}
