
"use client"

import * as React from "react"
import { format } from "date-fns"
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
  const [date, setDate] = React.useState<Date | undefined>(field.value);
  const [time, setTime] = React.useState(field.value ? format(field.value, 'HH:mm') : "00:00");

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      field.onChange(undefined);
      setDate(undefined);
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
    field.onChange(newDate);
  }
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    if(date) {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        setDate(newDate);
        field.onChange(newDate);
    }
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !field.value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value ? format(field.value, showTime ? "PPP HH:mm" : "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
        />
        {showTime && (
            <div className="p-2 border-t">
                <Input type="time" value={time} onChange={handleTimeChange} />
            </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
