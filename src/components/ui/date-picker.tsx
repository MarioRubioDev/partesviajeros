
"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import type { ControllerRenderProps } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "./input"

interface DatePickerProps {
  field: ControllerRenderProps<any, any>;
  showTime?: boolean;
}

export function DatePicker({ field, showTime = false }: DatePickerProps) {
  const formatString = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
  const [dateString, setDateString] = React.useState(field.value ? format(field.value, formatString, { locale: es }) : "");

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      field.onChange(selectedDate);
      setDateString(format(selectedDate, formatString, { locale: es }));
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateString(e.target.value);
    try {
      // Use 'dd/MM/yyyy HH:mm' for parsing to be less strict while typing
      const parsedDate = parse(e.target.value, showTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', new Date());
      if (!isNaN(parsedDate.getTime())) {
          field.onChange(parsedDate);
      }
    } catch(error) {
      // Ignore invalid date formats while typing
    }
  }

  React.useEffect(() => {
    if (field.value) {
      setDateString(format(field.value, formatString, { locale: es }));
    }
  }, [field.value, formatString]);


  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-12 justify-center text-left font-normal p-0",
              !field.value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={handleDateChange}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
      <Input 
        value={dateString}
        onChange={handleInputChange}
        placeholder={showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"}
      />
    </div>
  )
}
