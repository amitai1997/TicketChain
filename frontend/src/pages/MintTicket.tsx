import { ethers } from "ethers";
import TicketNFTAbi from "@/artifacts/contracts/TicketNFT.sol/TicketNFT.json";
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Tag, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTicketNFT } from '@/hooks/useTicketNFT'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'
import PropTypes from 'prop-types'

// Helper function to format date for display
const formatDateForDisplay = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Select a date and time';
  }

  // Format the date in a readable format
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to format date for datetime-local input
const formatDateForInput = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    // Return current date/time if the date is invalid
    const now = new Date();
    return formatDateToLocalISO(now);
  }
  return formatDateToLocalISO(date);
};

// Format a date to local ISO string (YYYY-MM-DDTHH:MM)
const formatDateToLocalISO = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to ensure a valid date
const ensureValidDate = (dateValue) => {
  if (!dateValue) return new Date();

  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch (e) {
    console.error("Invalid date value:", e);
    return new Date();
  }
};

// Helper to format time for the time input
const formatTimeForInput = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '00:00';
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Parse a local datetime string to a Date object preserving the local time
const parseLocalDateTimeString = (dateTimeString) => {
  // Parse the date string manually to preserve local time
  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  let hours = 0, minutes = 0;

  if (timePart) {
    [hours, minutes] = timePart.split(':').map(Number);
  }

  // Create a date in local time zone
  const localDate = new Date();
  localDate.setFullYear(year);
  localDate.setMonth(month - 1); // Months are 0-indexed
  localDate.setDate(day);
  localDate.setHours(hours);
  localDate.setMinutes(minutes);
  localDate.setSeconds(0);
  localDate.setMilliseconds(0);

  return localDate;
};

// Component for date/time picker
const SimpleDateTimePicker = ({ id, name, label, value, onChange, required = false, min = undefined, max = undefined }) => {
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
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
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
  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    setSelectedTime(timeValue);

    // Update the full date with the new time
    const newDate = new Date(selectedDate);
    const [hours, minutes] = timeValue.split(':').map(part => parseInt(part, 10));

    if (!isNaN(hours) && !isNaN(minutes)) {
      newDate.setHours(hours);
      newDate.setMinutes(minutes);

      // Create a synthetic event
      const synthEvent = {
        target: {
          name,
          value: formatDateForInput(newDate),
          type: 'datetime-local'
        }
      };

      onChange(synthEvent);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    // Create a new date preserving the original time
    const newDate = new Date(date);
    const [hours, minutes] = selectedTime.split(':').map(part => parseInt(part, 10));

    if (!isNaN(hours) && !isNaN(minutes)) {
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
    } else if (selectedDate) {
      // Fallback to the previous time
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    }

    setSelectedDate(newDate);

    // Create a synthetic event
    const synthEvent = {
      target: {
        name,
        value: formatDateForInput(newDate),
        type: 'datetime-local'
      }
    };

    onChange(synthEvent);
  };

  // Get the days in the current month for the calendar
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Last day of the month (28-31)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-7 h-7"></div>);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
      // Create the date object for this day
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const isSelected = selectedDate &&
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative" ref={pickerRef}>
      <label htmlFor={id} className="block text-sm font-medium mb-1 flex items-center">
        <Clock className="h-4 w-4 mr-1 text-gray-700 dark:text-white" />
        {label}
      </label>

      <div className="relative">
        {/* Read-only display field */}
        <div
          className="w-full p-2 pl-8 border border-border rounded-md bg-gray-50 dark:bg-gray-800 cursor-pointer text-gray-900 dark:text-white"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          {formattedDisplayValue}
        </div>

        {/* Hidden actual input for form submission */}
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
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {showCalendar && (
        <div className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-900 border border-border rounded-md shadow-md w-64">
          {/* Calendar header with month navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-medium text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map(day => (
              <div key={day} className="w-7 h-7 text-xs text-center text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth()}
          </div>

          {/* Time picker */}
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
              step="60" // Minutes precision
            />
          </div>

          {/* Done button */}
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
};

// Define PropTypes for SimpleDateTimePicker component
SimpleDateTimePicker.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  min: PropTypes.string,
  max: PropTypes.string
};

const MintTicket = () => {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()
  const { mintNewTicket, totalSupply, contractAddress } = useTicketNFT()
  const [isMinting, setIsMinting] = useState(false)
  const [hasMinterRole, setHasMinterRole] = useState(false)

  // Form state with validated dates
  const [formData, setFormData] = useState({
    eventId: '1',
    price: '0.01',
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    isTransferable: true,
  })

  // Check if user has MINTER_ROLE
  useEffect(() => {
    const checkMinterRole = async () => {
      if (isConnected && address) {
        try {
          // Create an ethers provider
          if (!window.ethereum) return

          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const contract = new ethers.Contract(
            contractAddress,
            TicketNFTAbi.abi,
            provider
          )

          // Get MINTER_ROLE
          const MINTER_ROLE = await contract.MINTER_ROLE()

          // Check if user has MINTER_ROLE
          const hasRole = await contract.hasRole(MINTER_ROLE, address)
          setHasMinterRole(hasRole)

          console.log(`User ${address} ${hasRole ? 'has' : 'does not have'} MINTER_ROLE`)
        } catch (error) {
          console.error('Error checking MINTER_ROLE:', error)
        }
      }
    }

    checkMinterRole()
  }, [isConnected, address, contractAddress])

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement

    setFormData(prev => {
      if (name === 'validFrom' || name === 'validUntil') {
        try {
          // Parse the date string from the input and create a valid Date object
          // Use the custom parser to preserve local time
          const date = parseLocalDateTimeString(value);
          return { ...prev, [name]: date };
        } catch (error) {
          console.error(`Error parsing date for ${name}:`, error);
          // Return the current value if there's an error
          return prev;
        }
      } else if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsMinting(true)

      // Ensure dates are valid before proceeding
      const validFromDate = ensureValidDate(formData.validFrom);
      const validUntilDate = ensureValidDate(formData.validUntil);

      // Calculate token ID based on total supply
      const newTokenId = totalSupply ? BigInt(Number(totalSupply) + 1) : 1n

      // Convert dates to Unix timestamps
      const validFrom = Math.floor(validFromDate.getTime() / 1000)
      const validUntil = Math.floor(validUntilDate.getTime() / 1000)

      console.log('Minting ticket with params:', {
        address,
        newTokenId: newTokenId.toString(),
        eventId: formData.eventId,
        price: formData.price,
        validFrom,
        validUntil,
        isTransferable: formData.isTransferable,
        contractAddress
      })

      // Simplified approach - just use the hook to mint
      await mintNewTicket(
        address,
        newTokenId,
        BigInt(formData.eventId),
        formData.price,
        validFrom,
        validUntil,
        formData.isTransferable
      )

      toast.success('Ticket minted successfully!')

      // Redirect to dashboard after successful minting
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error('Error minting ticket:', error)

      // Display a user-friendly error message
      let errorMessage = 'Failed to mint ticket'
      if (error.reason) {
        errorMessage += `: ${error.reason}`
      } else if (error.message) {
        errorMessage += `: ${error.message}`
      }

      toast.error(errorMessage)
    } finally {
      setIsMinting(false)
    }
  }

  // If not connected, show connect wallet message
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="py-12 px-4">
          <Ticket className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Mint a New Ticket</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Connect your wallet to mint NFT tickets
          </p>
          <div className="inline-block">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mint a New Ticket</h1>
        <p className="text-muted-foreground">Create a new NFT ticket for your event</p>
      </div>

      {!hasMinterRole && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700 dark:text-yellow-200">
            Your account doesn't have minter permissions. We'll attempt to grant you the MINTER_ROLE when you submit the form.
          </p>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Event ID */}
            <div>
              <label htmlFor="eventId" className="block text-sm font-medium mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-700 dark:text-white" />
                Event ID
              </label>
              <input
                id="eventId"
                name="eventId"
                type="number"
                min="1"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.eventId}
                onChange={handleChange}
                required
                aria-label="Event ID"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1 flex items-center">
                <Tag className="h-4 w-4 mr-1 text-gray-700 dark:text-white" />
                Price (ETH)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.0001"
                min="0"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.price}
                onChange={handleChange}
                required
                aria-label="Ticket price in ETH"
              />
            </div>

            {/* Valid From - with calendar picker */}
            <SimpleDateTimePicker
              id="validFrom"
              name="validFrom"
              label="Valid From"
              value={formData.validFrom}
              onChange={handleChange}
              required
            />

            {/* Valid Until - with calendar picker */}
            <SimpleDateTimePicker
              id="validUntil"
              name="validUntil"
              label="Valid Until"
              value={formData.validUntil}
              onChange={handleChange}
              required
              min={formData.validFrom ? formatDateForInput(
                new Date(formData.validFrom.getTime() + 60 * 60 * 1000) // At least 1 hour after valid from
              ) : undefined}
            />

            {/* Is Transferable */}
            <div className="flex items-center">
              <input
                id="isTransferable"
                name="isTransferable"
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={formData.isTransferable}
                onChange={handleChange}
                aria-label="Allow ticket transfer"
              />
              <label htmlFor="isTransferable" className="ml-2 block text-sm">
                Allow ticket transfer
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center"
                disabled={isMinting}
              >
                {isMinting ? (
                  <>
                    <span className="animate-spin inline-block h-5 w-5 mr-2 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
                    Minting...
                  </>
                ) : (
                  <>
                    <Ticket className="h-5 w-5 mr-2" />
                    Mint Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MintTicket
