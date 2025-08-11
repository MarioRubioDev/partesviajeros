
"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
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
  useCurrentTime?: boolean;
  defaultTime?: { hours: number; minutes: number };
}

export function DatePicker({ field, showTime = false, useCurrentTime = false, defaultTime }: DatePickerProps) {
  const formatString = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
  const [dateString, setDateString] = React.useState(field.value ? format(field.value, formatString, { locale: es }) : "");
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if(showTime) {
        if (useCurrentTime) {
          const now = new Date();
          newDate.setHours(now.getHours(), now.getMinutes());
        } else if (defaultTime) {
          newDate.setHours(defaultTime.hours, defaultTime.minutes, 0, 0);
        } else if(field.value instanceof Date) {
          // Keep existing time if any
          newDate.setHours(field.value.getHours(), field.value.getMinutes());
        }
      }
      field.onChange(newDate);
      setDateString(format(newDate, formatString, { locale: es }));
    }
    setPopoverOpen(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateString(value);

    // Try to parse the date as the user types
    const dateParts = value.split(" ")[0].split("/");
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts;
      if (year.length >= 4) { // Only attempt to parse if the year seems complete
        const parsedDate = parse(value, formatString, new Date());
        if (isValid(parsedDate)) {
          field.onChange(parsedDate);
        }
      }
    }
  }
  
  const handleBlur = () => {
    // When the user leaves the field, format the current valid date or reset
    if (field.value && isValid(field.value)) {
      setDateString(format(field.value, formatString, { locale: es }));
    } else {
      setDateString("");
    }
  }


  React.useEffect(() => {
    if (field.value && isValid(field.value)) {
      const currentString = format(field.value, formatString, { locale: es });
      // Only update if the string representation is different
      // This prevents the user's input from being overwritten while typing
      if (currentString !== dateString) {
          setDateString(currentString);
      }
    } else if (!field.value) {
      setDateString("");
    }
  }, [field.value, formatString]);


  return (
    <div className="flex gap-2">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
        onBlur={handleBlur}
        placeholder={showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"}
      />
    </div>
  )
}
