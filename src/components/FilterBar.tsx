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
        className={`px-6 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap shadow-sm border ${
          selectedCategory === null
            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
            : 'bg-surface text-text-muted border-gray-100 hover:border-primary/30 hover:text-primary'
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
          className={`px-6 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap shadow-sm border ${
            selectedCategory === category
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-surface text-text-muted border-gray-100 hover:border-primary/30 hover:text-primary'
          }`}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

export default FilterBar;
