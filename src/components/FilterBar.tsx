import React from 'react';
import { motion } from 'motion/react';

interface FilterBarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Business',
  'Photography',
  'Music',
  'Cooking',
  'Fitness',
  'Other'
];

const FilterBar: React.FC<FilterBarProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelectCategory(null)}
        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
          selectedCategory === null
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
        All Tutorials
      </motion.button>
      {CATEGORIES.map((category) => (
        <motion.button
          key={category}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(category)}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
            selectedCategory === category
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

export default FilterBar;
