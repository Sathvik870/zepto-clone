import React from 'react';
import { HiOutlineCash, HiOutlineCreditCard } from 'react-icons/hi';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selectedMethod, onSelectMethod }) => {
  const paymentOptions = [
    { 
      id: 'COD', 
      name: 'Cash on Delivery', 
      icon: <HiOutlineCash size={24} />, 
      enabled: true 
    },
    { 
      id: 'UPI', 
      name: 'UPI', 
      icon: <HiOutlineCreditCard size={24} />, 
      enabled: false 
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="space-y-3">
        {paymentOptions.map(option => (
          <div key={option.id}>
            <label 
              className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                option.enabled 
                  ? 'cursor-pointer hover:border-[#387c40] hover:bg-green-50' 
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              } ${selectedMethod === option.id && option.enabled ? 'border-[#387c40] ring-2 ring-[#387c40]' : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={selectedMethod === option.id}
                onChange={() => onSelectMethod(option.id)}
                disabled={!option.enabled}
                className="h-4 w-4 text-[#387c40] focus:ring-[#387c40]"
              />
              <div className="flex-grow flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {option.icon}
                    <span className="font-semibold">{option.name}</span>
                </div>
                {!option.enabled && (
                    <span className="text-xs font-bold text-gray-500">Coming Soon</span>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;