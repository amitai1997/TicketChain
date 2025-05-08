import React, { useState, useRef, useEffect } from 'react';

interface SimpleDateTimePickerProps {
  id: string;
  name: string;
  label: string;
  value: Date;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  min?: string;
  max?: string;
}

// Helper function to format date for display
function formatDateForDisplay(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Select a date and time';
  }
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to format date for datetime-local input
function formatDateForInput(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    return formatDateToLocalISO(now);
  }
  return formatDateToLocalISO(date);
}

// Format a date to local ISO string (YYYY-MM-DDTHH:MM)
function formatDateToLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper to format time for the time input
function formatTimeForInput(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '00:00';
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function SimpleDateTimePicker({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  min = undefined,
  max = undefined,
}: SimpleDateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value));
  const [selectedDate, setSelectedDate] = useState(value);
  const [selectedTime, setSelectedTime] = useState(formatTimeForInput(value));
  const pickerRef = useRef(null);

  // Format the date value for display
  const formattedDisplayValue = formatDateForDisplay(value);
  const formattedInputValue = formatDateForInput(value);

  // Update the time when the value changes externally
  useEffect(() => {
    setSelectedDate(value);
    setSelectedTime(formatTimeForInput(value));
  }, [value]);

  // Handle clicking outside to close the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !(pickerRef.current as any).contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Go to previous month
  const prevMonth = () => {
    const prevMonthDate = new Date(currentMonth);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    setCurrentMonth(prevMonthDate);
  };

  // Go to next month
  const nextMonth = () => {
    const nextMonthDate = new Date(currentMonth);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setCurrentMonth(nextMonthDate);
  };

  // Handle time selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setSelectedTime(timeValue);
    const newDate = new Date(selectedDate);
    const [hours, minutes] = timeValue.split(':').map((part: string) => parseInt(part, 10));
    if (!isNaN(hours) && !isNaN(minutes)) {
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      const synthEvent = {
        target: {
          name,
          value: formatDateForInput(newDate),
          type: 'datetime-local',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(synthEvent);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const newDate = new Date(date);
    const [hours, minutes] = selectedTime.split(':').map((part: string) => parseInt(part, 10));
    if (!isNaN(hours) && !isNaN(minutes)) {
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
    } else if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    }
    setSelectedDate(newDate);
    const synthEvent = {
      target: {
        name,
        value: formatDateForInput(newDate),
        type: 'datetime-local',
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(synthEvent);
  };

  // Get the days in the current month for the calendar
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-7 h-7"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`w-7 h-7 rounded-full text-sm flex items-center justify-center
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${isToday && !isSelected ? 'border border-primary text-primary' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative" ref={pickerRef}>
      <label htmlFor={id} className="block text-sm font-medium mb-1 flex items-center">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1 text-gray-700 dark:text-white"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        {label}
      </label>
      <div className="relative">
        <div
          className="w-full p-2 pl-8 border border-border rounded-md bg-gray-50 dark:bg-gray-800 cursor-pointer text-gray-900 dark:text-white"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          {formattedDisplayValue}
        </div>
        <input
          id={id}
          name={name}
          type="datetime-local"
          className="hidden"
          value={formattedInputValue}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          aria-label={label}
        />
        <button
          type="button"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setShowCalendar(!showCalendar);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>
      {showCalendar && (
        <div className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-900 border border-border rounded-md shadow-md w-64">
          <div className="flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="font-medium text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="w-7 h-7 text-xs text-center text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{getDaysInMonth()}</div>
          <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
            <div className="flex items-center">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 text-gray-500 dark:text-gray-500"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="text-xs text-gray-500 dark:text-white">Time:</span>
            </div>
            <input
              type="time"
              className="border border-border rounded p-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={selectedTime}
              onChange={handleTimeChange}
              step="60"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
              onClick={() => setShowCalendar(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleDateTimePicker;
