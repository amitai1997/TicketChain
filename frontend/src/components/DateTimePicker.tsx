import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  id: string;
  name: string;
  value: Date;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

// Helper function to format date for datetime-local input
const formatDateForInput = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }
  return date.toISOString().slice(0, 16);
};

// Helper function to get days in month
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get day of week of the first day of the month (0 = Sunday, 6 = Saturday)
const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  id,
  name,
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  className = ''
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const [dateValue, setDateValue] = useState(formatDateForInput(value));
  const [viewDate, setViewDate] = useState(new Date(value));
  const pickerRef = useRef<HTMLDivElement>(null);

  // Update the formatted date when the value prop changes
  useEffect(() => {
    setSelectedDate(value);
    setDateValue(formatDateForInput(value));
    setViewDate(new Date(value));
  }, [value]);

  // Handle clicking outside to close the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create a synthetic event to match the expected onChange handler signature
  const handleDateTimeChange = (newValue: string) => {
    const syntheticEvent = {
      target: {
        name,
        value: newValue,
        type: 'datetime-local' as const
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setDateValue(newValue);
  };

  // Handle date selection from the calendar
  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Keep the time part from the current selection
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    }
    
    setSelectedDate(newDate);
    
    // Update the input value
    const newDateValue = formatDateForInput(newDate);
    handleDateTimeChange(newDateValue);
    
    // Close calendar after selection
    setShowCalendar(false);
  };

  // Navigate to previous month
  const prevMonth = () => {
    const newViewDate = new Date(viewDate);
    newViewDate.setMonth(newViewDate.getMonth() - 1);
    setViewDate(newViewDate);
  };

  // Navigate to next month
  const nextMonth = () => {
    const newViewDate = new Date(viewDate);
    newViewDate.setMonth(newViewDate.getMonth() + 1);
    setViewDate(newViewDate);
  };

  // Generate the calendar grid
  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Add empty cells for days of the week before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && 
                          selectedDate.getDate() === day && 
                          selectedDate.getMonth() === month && 
                          selectedDate.getFullYear() === year;
      
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative" ref={pickerRef}>
      <label htmlFor={id} className="block text-sm font-medium mb-1 flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        {label}
      </label>
      
      <div className="relative">
        <input
          id={id}
          name={name}
          type="datetime-local"
          className={`w-full p-2 border border-border rounded-md bg-background pl-8 ${className}`}
          value={dateValue}
          onChange={(e) => handleDateTimeChange(e.target.value)}
          required={required}
          min={min}
          max={max}
          aria-label={label}
        />
        <button
          type="button"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.preventDefault();
            setShowCalendar(!showCalendar);
          }}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {showCalendar && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-border p-2 w-64">
          {/* Calendar header */}
          <div className="flex justify-between items-center mb-2">
            <button 
              type="button" 
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-medium">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button 
              type="button" 
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map(day => (
              <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
          
          {/* Time section */}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="text-xs text-gray-500">Time:</span>
            <input 
              type="time"
              className="text-sm border border-border rounded p-1"
              value={dateValue.split('T')[1] || '00:00'}
              onChange={(e) => {
                const datePart = dateValue.split('T')[0];
                handleDateTimeChange(`${datePart}T${e.target.value}`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
