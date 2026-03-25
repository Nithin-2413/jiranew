import React, { useState, useEffect } from 'react';
import { Calendar, Filter as FilterIcon, X, Users, Tag, CheckSquare, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { getDatePresets } from '../services/dataProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const COMMON_ISSUE_TYPES = [
  'Epic',
  'Feature',
  'Story',
  'Task',
  'Bug',
  'Test',
  'Sub-task',
  'Improvement'
];

const COMMON_STATUSES = [
  'To Do',
  'Open',
  'In Progress',
  'In Review',
  'In Testing',
  'Done',
  'Closed',
  'Blocked'
];

const COMMON_PRIORITIES = [
  'Blocker',
  'Critical',
  'High',
  'Medium',
  'Low',
  'Trivial'
];

const FilterModalEnhanced = ({ open, onClose, filters, setFilters, onApply, availableAssignees = [], availableLabels = [] }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeTab, setActiveTab] = useState('basic');
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

  const handleCheckboxToggle = (filterType, value, checked) => {
    setLocalFilters(prev => {
      const currentValues = Array.isArray(prev[filterType]) ? prev[filterType] : [];
      if (checked) {
        return { ...prev, [filterType]: [...currentValues, value] };
      } else {
        return { ...prev, [filterType]: currentValues.filter(v => v !== value) };
      }
    });
  };

  const handleSelectAll = (filterType, options) => {
    const currentValues = Array.isArray(localFilters[filterType]) ? localFilters[filterType] : [];
    if (currentValues.length === options.length) {
      setLocalFilters(prev => ({ ...prev, [filterType]: [] }));
    } else {
      setLocalFilters(prev => ({ ...prev, [filterType]: [...options] }));
    }
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
      assignee: [],
      priority: []
    };
    setLocalFilters(clearedFilters);
  };

  const getSelectedCount = () => {
    let count = 0;
    if (localFilters.startDate || localFilters.endDate) count++;
    if (localFilters.issueType?.length > 0) count += localFilters.issueType.length;
    if (localFilters.status?.length > 0) count += localFilters.status.length;
    if (localFilters.priority?.length > 0) count += localFilters.priority.length;
    if (localFilters.assignee?.length > 0) count += localFilters.assignee.length;
    if (localFilters.labels?.length > 0) count += localFilters.labels.length;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="premium-modal-content sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="premium-modal-header">
          <div className="flex items-center justify-between">
            <DialogTitle className="premium-modal-title">
              <FilterIcon className="text-indigo-600" size={24} />
              Advanced Filters
            </DialogTitle>
            <div className="premium-filter-badge">
              {getSelectedCount()} filter{getSelectedCount() !== 1 ? 's' : ''} active
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="premium-tabs-list mx-8 mt-6">
            <TabsTrigger value="basic" className="premium-tab-trigger">Basic</TabsTrigger>
            <TabsTrigger value="status" className="premium-tab-trigger">Status & Type</TabsTrigger>
            <TabsTrigger value="team" className="premium-tab-trigger">Team & Priority</TabsTrigger>
            <TabsTrigger value="labels" className="premium-tab-trigger">Labels</TabsTrigger>
          </TabsList>

          <div className="premium-modal-body">
            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-6 mt-0">
              {/* Date Range */}
              <div className="premium-form-section">
                <Label className="premium-form-label">
                  <Calendar size={18} className="text-indigo-600" />
                  Date Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date" className="text-slate-600 text-xs mb-2 block font-semibold">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={localFilters.startDate}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-slate-600 text-xs mb-2 block font-semibold">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={localFilters.endDate}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="premium-input"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <Label className="text-slate-600 text-xs uppercase tracking-wide mb-3 block font-semibold">Quick Presets</Label>
                <div className="premium-preset-grid">
                  {Object.values(datePresets).map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetSelect(preset)}
                      className="premium-preset-btn"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Status & Type Tab */}
            <TabsContent value="status" className="space-y-6 mt-0">
              {/* Issue Types */}
              <div className="premium-form-section">
                <div className="flex items-center justify-between mb-3">
                  <Label className="premium-form-label mb-0">
                    <CheckSquare size={18} className="text-indigo-600" />
                    Issue Types
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAll('issueType', COMMON_ISSUE_TYPES)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold h-8 px-3"
                  >
                    {localFilters.issueType?.length === COMMON_ISSUE_TYPES.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="premium-checkbox-group">
                  {COMMON_ISSUE_TYPES.map((type) => (
                    <div key={type} className="premium-checkbox-item">
                      <Checkbox
                        id={`type-${type}`}
                        checked={localFilters.issueType?.includes(type) || false}
                        onCheckedChange={(checked) => handleCheckboxToggle('issueType', type, checked)}
                        className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor={`type-${type}`} className="text-sm text-slate-700 cursor-pointer font-medium">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 mt-3 font-semibold">
                  {localFilters.issueType?.length > 0 ? `${localFilters.issueType.length} selected` : 'All types'}
                </p>
              </div>

              {/* Statuses */}
              <div className="premium-form-section">
                <div className="flex items-center justify-between mb-3">
                  <Label className="premium-form-label mb-0">Status</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAll('status', COMMON_STATUSES)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold h-8 px-3"
                  >
                    {localFilters.status?.length === COMMON_STATUSES.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="premium-checkbox-group">
                  {COMMON_STATUSES.map((status) => (
                    <div key={status} className="premium-checkbox-item">
                      <Checkbox
                        id={`status-${status}`}
                        checked={localFilters.status?.includes(status) || false}
                        onCheckedChange={(checked) => handleCheckboxToggle('status', status, checked)}
                        className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm text-slate-700 cursor-pointer font-medium">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 mt-3 font-semibold">
                  {localFilters.status?.length > 0 ? `${localFilters.status.length} selected` : 'All statuses'}
                </p>
              </div>
            </TabsContent>

            {/* Team & Priority Tab */}
            <TabsContent value="team" className="space-y-6 mt-0">
              {/* Priority */}
              <div className="premium-form-section">
                <div className="flex items-center justify-between mb-3">
                  <Label className="premium-form-label mb-0">
                    <AlertCircle size={18} className="text-indigo-600" />
                    Priority
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAll('priority', COMMON_PRIORITIES)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold h-8 px-3"
                  >
                    {localFilters.priority?.length === COMMON_PRIORITIES.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="premium-checkbox-group">
                  {COMMON_PRIORITIES.map((priority) => (
                    <div key={priority} className="premium-checkbox-item">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={localFilters.priority?.includes(priority) || false}
                        onCheckedChange={(checked) => handleCheckboxToggle('priority', priority, checked)}
                        className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor={`priority-${priority}`} className="text-sm text-slate-700 cursor-pointer font-medium">
                        {priority}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 mt-3 font-semibold">
                  {localFilters.priority?.length > 0 ? `${localFilters.priority.length} selected` : 'All priorities'}
                </p>
              </div>

              {/* Assignees */}
              {availableAssignees.length > 0 && (
                <div className="premium-form-section">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="premium-form-label mb-0">
                      <Users size={18} className="text-indigo-600" />
                      Assignees
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll('assignee', availableAssignees)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold h-8 px-3"
                    >
                      {localFilters.assignee?.length === availableAssignees.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="premium-checkbox-group max-h-60 overflow-y-auto">
                    {availableAssignees.map((assignee) => (
                      <div key={assignee} className="premium-checkbox-item">
                        <Checkbox
                          id={`assignee-${assignee}`}
                          checked={localFilters.assignee?.includes(assignee) || false}
                          onCheckedChange={(checked) => handleCheckboxToggle('assignee', assignee, checked)}
                          className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <Label htmlFor={`assignee-${assignee}`} className="text-sm text-slate-700 cursor-pointer font-medium truncate">
                          {assignee}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-indigo-600 mt-3 font-semibold">
                    {localFilters.assignee?.length > 0 ? `${localFilters.assignee.length} selected` : 'All assignees'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Labels Tab */}
            <TabsContent value="labels" className="space-y-6 mt-0">
              <div className="premium-form-section">
                <Label className="premium-form-label mb-3">
                  <Tag size={18} className="text-indigo-600" />
                  Labels
                </Label>
                {availableLabels.length > 0 ? (
                  <>
                    <div className="premium-checkbox-group max-h-80 overflow-y-auto">
                      {availableLabels.map((label) => (
                        <div key={label} className="premium-checkbox-item">
                          <Checkbox
                            id={`label-${label}`}
                            checked={localFilters.labels?.includes(label) || false}
                            onCheckedChange={(checked) => handleCheckboxToggle('labels', label, checked)}
                            className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                          <Label htmlFor={`label-${label}`} className="text-sm text-slate-700 cursor-pointer font-medium truncate">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-indigo-600 mt-3 font-semibold">
                      {localFilters.labels?.length > 0 ? `${localFilters.labels.length} selected` : 'All labels'}
                    </p>
                  </>
                ) : (
                  <div className="premium-card bg-slate-50 p-12 text-center">
                    <Tag size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 font-medium">No labels available. Generate a report first to see available labels.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Action Buttons */}
        <div className="premium-modal-footer">
          <Button
            onClick={handleClearFilters}
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 hover:bg-white font-semibold"
          >
            <X size={16} className="mr-2" />
            Clear All
          </Button>
          <div className="flex-1" />
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-white font-semibold px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="btn-premium px-8"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModalEnhanced;
