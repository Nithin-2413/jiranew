import React, { useState } from 'react';
import { X, Calendar, Filter as FilterIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { getDatePresets } from '../services/dataProcessor';

const FilterModal = ({ open, onClose, filters, setFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const datePresets = getDatePresets();

  const handlePresetSelect = (preset) => {
    setLocalFilters(prev => ({
      ...prev,
      startDate: preset.start,
      endDate: preset.end
    }));
  };

  const handleApply = () => {
    setFilters(localFilters);
    onApply();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white" data-testid="filter-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <FilterIcon className="text-cyan-400" size={24} />
            Configure Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-white font-semibold text-sm uppercase tracking-wide">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-slate-300 text-sm mb-2 block">Start Date</Label>
                <Input
                  id="start-date"
                  data-testid="start-date-input"
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600 text-white focus:border-cyan-500"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-slate-300 text-sm mb-2 block">End Date</Label>
                <Input
                  id="end-date"
                  data-testid="end-date-input"
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600 text-white focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <Label className="text-white font-semibold text-sm uppercase tracking-wide mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(datePresets).map((preset) => (
                <Button
                  key={preset.label}
                  data-testid={`preset-${preset.label.toLowerCase().replace(/\\s+/g, '-')}`}
                  onClick={() => handlePresetSelect(preset)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 text-xs font-semibold"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status-filter" className="text-white font-semibold text-sm uppercase tracking-wide mb-2 block">
              Status (Optional)
            </Label>
            <Input
              id="status-filter"
              data-testid="status-filter-input"
              placeholder="e.g. Done, In Progress, Open"
              value={Array.isArray(localFilters.status) ? localFilters.status.join(', ') : ''}
              onChange={(e) => setLocalFilters(prev => ({ 
                ...prev, 
                status: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-400 mt-1">Comma-separated values</p>
          </div>

          {/* Issue Type Filter */}
          <div>
            <Label htmlFor="issue-type-filter" className="text-white font-semibold text-sm uppercase tracking-wide mb-2 block">
              Issue Type (Optional)
            </Label>
            <Input
              id="issue-type-filter"
              data-testid="issue-type-filter-input"
              placeholder="e.g. Bug, Story, Task, Test"
              value={Array.isArray(localFilters.issueType) ? localFilters.issueType.join(', ') : ''}
              onChange={(e) => setLocalFilters(prev => ({ 
                ...prev, 
                issueType: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-400 mt-1">Comma-separated values</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-900 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              data-testid="apply-filters-btn"
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 font-semibold"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;