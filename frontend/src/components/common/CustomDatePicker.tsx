import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { HiOutlineCalendar } from 'react-icons/hi';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full h-10 flex justify-between items-center text-left
                 bg-transparent border-b-2 border-gray-300 
                 text-base text-black 
                 focus:outline-none focus:border-[#387c40] 
                 transition-colors duration-200 rounded-none px-2"
    >
      <span className={!value ? "text-gray-500" : ""}>
        {value || placeholder || 'Select date'}
      </span>
      <HiOutlineCalendar className="h-5 w-5 text-[#387c40]" />
    </button>
  )
);

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder,
  minDate,
  maxDate
}) => {
  return (
    <div className="w-[200px] md:w-[240px]">
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat="MMM d, yyyy"
        minDate={minDate}
        maxDate={maxDate}
        customInput={<CustomInput placeholder={placeholder} />}
        placeholderText={placeholder}
        formatWeekDay={(nameOfDay) => nameOfDay.substr(0, 3)} 
      />
    </div>
  );
};