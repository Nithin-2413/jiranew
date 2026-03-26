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

const FilterModal = ({ open, onClose, filters, setFilters, onApply, teams = [] }) => {
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
      sprint: '',
      team: 'all',
      customJql: ''
    };
    setLocalFilters(clearedFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white border-slate-200 max-h-[85vh] overflow-y-auto" data-testid="filter-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FilterIcon className="text-cyan-600" size={22} />
            Configure Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
              <Calendar size={16} className="text-cyan-600" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-slate-500 text-xs mb-2 block">Start Date</Label>
                <Input
                  id="start-date"
                  data-testid="start-date-input"
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-900 focus:border-cyan-500"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-slate-500 text-xs mb-2 block">End Date</Label>
                <Input
                  id="end-date"
                  data-testid="end-date-input"
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-900 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Team Filter */}
          {teams.length > 0 && (
            <div className="space-y-4">
              <Label htmlFor="team-select" className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                Team
              </Label>
              <select
                id="team-select"
                data-testid="team-select"
                value={localFilters.team || 'all'}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, team: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Teams</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <Label className="text-slate-500 text-xs uppercase tracking-wide mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(datePresets).map((preset) => (
                <Button
                  key={preset.label}
                  data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handlePresetSelect(preset)}
                  size="sm"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Issue Type Filter - Checkboxes */}
          <div className="pt-2 border-t border-slate-200">
            <Label className="text-slate-700 font-semibold text-sm uppercase tracking-wide mb-3 block">
              Issue Types
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMMON_ISSUE_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={localFilters.issueType?.includes(type) || false}
                    onCheckedChange={(checked) => handleIssueTypeToggle(type, checked)}
                    className="border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <Label 
                    htmlFor={`type-${type}`}
                    className="text-sm text-slate-700 cursor-pointer"
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
            <Label htmlFor="status-filter" className="text-slate-700 font-semibold text-sm uppercase tracking-wide mb-2 block">
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
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated values</p>
          </div>

          {/* Labels Filter */}
          <div>
            <Label htmlFor="labels-filter" className="text-slate-700 font-semibold text-sm uppercase tracking-wide mb-2 block">
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
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated values</p>
          </div>

          {/* Custom JQL Filter */}
          <div className="pt-2 border-t border-slate-200">
            <Label htmlFor="custom-jql" className="text-slate-700 font-semibold text-sm uppercase tracking-wide mb-2 block">
              Advanced Search (Custom JQL)
            </Label>
            <Input
              id="custom-jql"
              data-testid="custom-jql-input"
              placeholder='e.g. "Team[Team]" in ( "8 LCC UI team" ) AND creator = currentUser()'
              value={localFilters.customJql || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, customJql: e.target.value }))}
              className="bg-white border-slate-300 text-slate-900 font-mono text-xs placeholder:text-slate-400 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">This will be appended to your query natively via the Jira API.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={16} className="mr-1" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
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
