import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-text-muted/50" />
      </div>
      <input
        type="text"
        placeholder="Search tutorials, tags, or categories..."
        onChange={(e) => onSearch(e.target.value)}
        className="block w-full pl-12 pr-4 py-3.5 bg-bg border border-gray-100 rounded-2xl text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-medium"
      />
    </div>
  );
};

export default SearchBar;
