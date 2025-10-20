import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from 'lucide-react';

interface TrackListFiltersProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export const TrackListFilters = ({ sortBy, onSortChange }: TrackListFiltersProps) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <ArrowUpDown className="h-4 w-4 text-slate-400" />
      <span className="text-sm text-slate-400">Sort by:</span>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px] bg-slate-700 border-slate-500 text-white">
          <SelectValue placeholder="Select sorting" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-500">
          <SelectGroup>
            <SelectItem value="name-asc" className="text-white hover:bg-slate-600">
              Name (A-Z)
            </SelectItem>
            <SelectItem value="name-desc" className="text-white hover:bg-slate-600">
              Name (Z-A)
            </SelectItem>
            <SelectItem value="key" className="text-white hover:bg-slate-600">
              Key
            </SelectItem>
            <SelectItem value="bpm-asc" className="text-white hover:bg-slate-600">
              BPM (Low to High)
            </SelectItem>
            <SelectItem value="bpm-desc" className="text-white hover:bg-slate-600">
              BPM (High to Low)
            </SelectItem>
            <SelectItem value="size-asc" className="text-white hover:bg-slate-600">
              Size (Ascending)
            </SelectItem>
            <SelectItem value="size-desc" className="text-white hover:bg-slate-600">
              Size (Descending)
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};