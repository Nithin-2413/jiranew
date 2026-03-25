import React from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

const DEFAULT_EXPORT_OPTIONS = {
  executiveSummary: true,
  issueDistribution: true,
  teamPerformance: true,
  storyPointsAnalysis: true,
  bugAnalysis: true,
  labelAnalysis: true,
  testExecution: true,
  advancedAnalytics: true,
  detailedIssues: true
};

const EXPORT_SECTIONS = [
  { key: 'executiveSummary', label: 'Executive Summary', description: 'Overview with key metrics and highlights' },
  { key: 'issueDistribution', label: 'Issue Distribution', description: 'Charts showing issues by type and status' },
  { key: 'teamPerformance', label: 'Team Performance', description: 'Story points and issues by team member' },
  { key: 'storyPointsAnalysis', label: 'Story Points Analysis', description: 'Points breakdown by status and completion rate' },
  { key: 'bugAnalysis', label: 'Bug Analysis', description: 'Bug count by priority and resolution status' },
  { key: 'labelAnalysis', label: 'Label Analysis', description: 'Label usage statistics and distribution' },
  { key: 'testExecution', label: 'Test Execution', description: 'Test metrics (passed/failed/blocked)' },
  { key: 'advancedAnalytics', label: 'Advanced Analytics', description: 'Issue type vs label correlation' },
  { key: 'detailedIssues', label: 'Detailed Issues Table', description: 'Full list of issues with details' },
];

const ExportOptionsModal = ({ 
  open, 
  onClose, 
  exportOptions, 
  setExportOptions, 
  onExportPDF, 
  onExportWord,
  loading 
}) => {
  const handleOptionChange = (key, checked) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(exportOptions).every(v => v);
    const newOptions = {};
    EXPORT_SECTIONS.forEach(section => {
      newOptions[section.key] = !allSelected;
    });
    setExportOptions(newOptions);
  };

  const selectedCount = Object.values(exportOptions).filter(v => v).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white border-slate-200 max-h-[85vh] overflow-y-auto" data-testid="export-options-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-cyan-600" size={22} />
            Export Report Options
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Select which sections to include in your exported report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Select All */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-sm text-slate-600">
              {selectedCount} of {EXPORT_SECTIONS.length} sections selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
            >
              {Object.values(exportOptions).every(v => v) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Section Checkboxes */}
          <div className="space-y-3">
            {EXPORT_SECTIONS.map((section) => (
              <div 
                key={section.key}
                className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Checkbox
                  id={section.key}
                  checked={exportOptions[section.key]}
                  onCheckedChange={(checked) => handleOptionChange(section.key, checked)}
                  className="mt-0.5 border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={section.key}
                    className="text-sm font-medium text-slate-800 cursor-pointer"
                  >
                    {section.label}
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onExportWord}
            disabled={loading || selectedCount === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 font-semibold"
          >
            <FileSpreadsheet size={18} className="mr-2" />
            Export Word
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={loading || selectedCount === 0}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 font-semibold"
          >
            <Download size={18} className="mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ExportOptionsModal, DEFAULT_EXPORT_OPTIONS, EXPORT_SECTIONS };
export default ExportOptionsModal;
