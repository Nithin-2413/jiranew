import React, { useState, useEffect } from 'react';
import { Calendar, Filter as FilterIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { getDatePresets } from '../services/dataProcessor';

const COMMON_ISSUE_TYPES = [
  'Epic',
  'Feature', 
  'Story',
  'Task',
  'Bug',
  'Test',
  'Sub-task'
];

const FilterModal = ({ open, onClose, filters, setFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const datePresets = getDatePresets();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, open]);

  const handlePresetSelect = (preset) => {
    setLocalFilters(prev => ({
      ...prev,
      startDate: preset.start,
      endDate: preset.end
    }));
  };

  const handleIssueTypeToggle = (type, checked) => {
    setLocalFilters(prev => {
      const currentTypes = Array.isArray(prev.issueType) ? prev.issueType : [];
      if (checked) {
        return { ...prev, issueType: [...currentTypes, type] };
      } else {
        return { ...prev, issueType: currentTypes.filter(t => t !== type) };
      }
    });
  };

  const handleApply = () => {
    setFilters(localFilters);
    onApply();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      status: [],
      issueType: [],
      labels: [],
      sprint: ''
    };
    setLocalFilters(clearedFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white max-h-[85vh] overflow-y-auto" data-testid="filter-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FilterIcon className="text-cyan-400" size={22} />
            Configure Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-slate-200 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
              <Calendar size={16} className="text-cyan-400" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-slate-400 text-xs mb-2 block">Start Date</Label>
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
                <Label htmlFor="end-date" className="text-slate-400 text-xs mb-2 block">End Date</Label>
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
            <Label className="text-slate-400 text-xs uppercase tracking-wide mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(datePresets).map((preset) => (
                <Button
                  key={preset.label}
                  data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handlePresetSelect(preset)}
                  size="sm"
                  className="bg-slate-700/50 hover:bg-slate-600 text-slate-300 border border-slate-600 text-xs font-medium"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Issue Type Filter - Checkboxes */}
          <div className="pt-2 border-t border-slate-700">
            <Label className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-3 block">
              Issue Types
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMMON_ISSUE_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={localFilters.issueType?.includes(type) || false}
                    onCheckedChange={(checked) => handleIssueTypeToggle(type, checked)}
                    className="border-slate-500 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <Label 
                    htmlFor={`type-${type}`}
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {localFilters.issueType?.length > 0 ? localFilters.issueType.join(', ') : 'All types'}
            </p>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status-filter" className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-2 block">
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
            <p className="text-xs text-slate-500 mt-1">Comma-separated values</p>
          </div>

          {/* Labels Filter */}
          <div>
            <Label htmlFor="labels-filter" className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-2 block">
              Labels (Optional)
            </Label>
            <Input
              id="labels-filter"
              data-testid="labels-filter-input"
              placeholder="e.g. frontend, backend, urgent"
              value={Array.isArray(localFilters.labels) ? localFilters.labels.join(', ') : ''}
              onChange={(e) => setLocalFilters(prev => ({ 
                ...prev, 
                labels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated values</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <X size={16} className="mr-1" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              data-testid="apply-filters-btn"
              onClick={handleApply}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 font-semibold px-8"
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
