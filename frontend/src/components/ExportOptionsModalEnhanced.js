import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Settings, Image, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const DEFAULT_EXPORT_OPTIONS = {
  // Content sections
  executiveSummary: true,
  queryDetails: true,
  issueDistribution: true,
  teamPerformance: true,
  storyPointsAnalysis: true,
  bugAnalysis: true,
  labelAnalysis: true,
  testExecution: true,
  sprintAnalysis: true,
  timeAnalysis: true,
  priorityAnalysis: true,
  advancedAnalytics: true,
  detailedIssues: true,
  
  // Chart/visual configurations
  includeCharts: true,
  chartQuality: 'high', // 'standard', 'high', 'ultra'
  chartScale: 2, // 1-4 for resolution multiplier
  
  // Layout options
  includeCompanyLogo: false,
  includePageNumbers: true,
  includeTableOfContents: false,
  colorTheme: 'professional', // 'professional', 'vibrant', 'minimal'
};

const CHART_QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard (Faster)', scale: 1, description: '72 DPI - Good for screen viewing' },
  { value: 'high', label: 'High Quality', scale: 2, description: '144 DPI - Recommended for printing' },
  { value: 'ultra', label: 'Ultra High', scale: 3, description: '216 DPI - Best quality, larger file size' }
];

const EXPORT_SECTIONS = [
  {key: 'executiveSummary', label: 'Executive Summary', description: 'Key metrics and highlights', category: 'content'},
  { key: 'queryDetails', label: 'Query Details', description: 'JQL query and filter breakdown', category: 'content' },
  { key: 'issueDistribution', label: 'Issue Distribution', description: 'Charts by type, status, and priority', category: 'content', hasCharts: true },
  { key: 'teamPerformance', label: 'Team Performance', description: 'Story points and issues by team member', category: 'content', hasCharts: true },
  { key: 'storyPointsAnalysis', label: 'Story Points Analysis', description: 'Points breakdown and completion trends', category: 'content', hasCharts: true },
  { key: 'bugAnalysis', label: 'Bug Analysis', description: 'Bug metrics by priority and status', category: 'content', hasCharts: true },
  { key: 'priorityAnalysis', label: 'Priority Analysis', description: 'Issue breakdown by priority levels', category: 'content', hasCharts: true },
  { key: 'labelAnalysis', label: 'Label Analysis', description: 'Label usage and distribution', category: 'content', hasCharts: true },
  { key: 'sprintAnalysis', label: 'Sprint Analysis', description: 'Sprint velocity and burndown', category: 'content', hasCharts: true },
  { key: 'timeAnalysis', label: 'Time Analysis', description: 'Resolution times and cycle time', category: 'content', hasCharts: true },
  { key: 'testExecution', label: 'Test Execution', description: 'Test pass/fail metrics', category: 'content' },
  { key: 'advancedAnalytics', label: 'Advanced Analytics', description: 'Correlations and insights', category: 'content', hasCharts: true },
  { key: 'detailedIssues', label: 'Detailed Issues Table', description: 'Full list of issues with all fields', category: 'content' },
];

const ExportOptionsModalEnhanced = ({ 
  open, 
  onClose, 
  exportOptions, 
  setExportOptions, 
  onExportPDF, 
  onExportWord,
  loading 
}) => {
  const [activeTab, setActiveTab] = useState('sections');

  const handleOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectAll = () => {
    const allSelected = EXPORT_SECTIONS.every(s => exportOptions[s.key]);
    const newOptions = { ...exportOptions };
    EXPORT_SECTIONS.forEach(section => {
      newOptions[section.key] = !allSelected;
    });
    setExportOptions(newOptions);
  };

  const handleQuickPreset = (preset) => {
    let newOptions = { ...DEFAULT_EXPORT_OPTIONS };
    
    if (preset === 'minimal') {
      EXPORT_SECTIONS.forEach(s => newOptions[s.key] = false);
      newOptions.executiveSummary = true;
      newOptions.issueDistribution = true;
      newOptions.teamPerformance = true;
      newOptions.includeCharts = true;
      newOptions.chartQuality = 'standard';
    } else if (preset === 'full') {
      EXPORT_SECTIONS.forEach(s => newOptions[s.key] = true);
      newOptions.includeCharts = true;
      newOptions.chartQuality = 'high';
      newOptions.includeTableOfContents = true;
    } else if (preset === 'charts') {
      EXPORT_SECTIONS.forEach(s => {
        newOptions[s.key] = s.hasCharts;
      });
      newOptions.executiveSummary = true;
      newOptions.includeCharts = true;
      newOptions.chartQuality = 'ultra';
    }
    
    setExportOptions(newOptions);
  };

  const selectedCount = EXPORT_SECTIONS.filter(s => exportOptions[s.key]).length;
  const chartsCount = EXPORT_SECTIONS.filter(s => s.hasCharts && exportOptions[s.key]).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="premium-modal-content sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="premium-modal-header">
          <DialogTitle className="premium-modal-title">
            <FileText className="text-indigo-600" size={24} />
            Export Report Configuration
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-2 text-sm">
            Customize your report output with high-quality charts and detailed sections
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="flex gap-3 py-4 px-8 border-b-2 border-slate-100 bg-slate-50">
          <Label className="text-xs text-slate-700 font-bold uppercase tracking-wide mr-3 self-center">Quick Presets:</Label>
          <button onClick={() => handleQuickPreset('minimal')} className="premium-preset-btn">
            Minimal
          </button>
          <button onClick={() => handleQuickPreset('full')} className="premium-preset-btn">
            Full Report
          </button>
          <button onClick={() => handleQuickPreset('charts')} className="premium-preset-btn">
            Charts Focus
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="premium-tabs-list mx-8 mt-6">
            <TabsTrigger value="sections" className="premium-tab-trigger">
              Sections ({selectedCount})
            </TabsTrigger>
            <TabsTrigger value="charts" className="premium-tab-trigger">
              Chart Quality
            </TabsTrigger>
            <TabsTrigger value="layout" className="premium-tab-trigger">
              Layout
            </TabsTrigger>
          </TabsList>

          <div className="premium-modal-body">
            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-3 mt-0">
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
                <span className="text-sm text-slate-700 font-semibold">
                  {selectedCount} of {EXPORT_SECTIONS.length} sections selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 text-xs font-bold"
                >
                  {EXPORT_SECTIONS.every(s => exportOptions[s.key]) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {EXPORT_SECTIONS.map((section) => (
                <div 
                  key={section.key}
                  className="premium-checkbox-item"
                >
                  <Checkbox
                    id={section.key}
                    checked={exportOptions[section.key]}
                    onCheckedChange={(checked) => handleOptionChange(section.key, checked)}
                    className="mt-0.5 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={section.key}
                      className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2"
                    >
                      {section.label}
                      {section.hasCharts && (
                        <BarChart3 size={14} className="text-indigo-500" />
                      )}
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">{section.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6 mt-0">
              <div className="premium-card bg-indigo-50 border-2 border-indigo-200 p-5">
                <div className="flex items-start gap-4">
                  <Image size={22} className="text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">High-Quality Chart Rendering</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Charts are captured using advanced rendering at {exportOptions.chartScale || 2}x resolution. 
                      {chartsCount > 0 && ` Approximately ${chartsCount} charts will be included.`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-5">
                  <Checkbox
                    id="include-charts"
                    checked={exportOptions.includeCharts !== false}
                    onCheckedChange={(checked) => handleOptionChange('includeCharts', checked)}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label htmlFor="include-charts" className="text-sm font-bold text-slate-800 cursor-pointer">
                    Include Charts and Visualizations
                  </Label>
                </div>

                {exportOptions.includeCharts !== false && (
                  <>
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Chart Quality Level</Label>
                      {CHART_QUALITY_OPTIONS.map((option) => (
                        <div 
                          key={option.value}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                            exportOptions.chartQuality === option.value 
                              ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            handleOptionChange('chartQuality', option.value);
                            handleOptionChange('chartScale', option.scale);
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                              exportOptions.chartQuality === option.value 
                                ? 'border-indigo-500' 
                                : 'border-slate-300'
                            }`}>
                              {exportOptions.chartQuality === option.value && (
                                <div className="h-4 w-4 rounded-full bg-indigo-500"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-slate-800">{option.label}</div>
                              <div className="text-xs text-slate-600 mt-1">{option.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-800 font-medium">
                        <strong className="font-bold">Note:</strong> Higher quality settings produce better images but increase file size and export time.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="premium-checkbox-item">
                  <Checkbox
                    id="page-numbers"
                    checked={exportOptions.includePageNumbers !== false}
                    onCheckedChange={(checked) => handleOptionChange('includePageNumbers', checked)}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label htmlFor="page-numbers" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Include page numbers
                  </Label>
                </div>

                <div className="premium-checkbox-item">
                  <Checkbox
                    id="table-of-contents"
                    checked={exportOptions.includeTableOfContents === true}
                    onCheckedChange={(checked) => handleOptionChange('includeTableOfContents', checked)}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label htmlFor="table-of-contents" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Include table of contents
                  </Label>
                </div>

                <div className="premium-checkbox-item">
                  <Checkbox
                    id="company-logo"
                    checked={exportOptions.includeCompanyLogo === true}
                    onCheckedChange={(checked) => handleOptionChange('includeCompanyLogo', checked)}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <Label htmlFor="company-logo" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Include company logo (if configured)
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 block">Color Theme</Label>
                <Select value={exportOptions.colorTheme || 'professional'} onValueChange={(value) => handleOptionChange('colorTheme', value)}>
                  <SelectTrigger className="premium-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                    <SelectItem value="professional" className="text-slate-700 font-medium">Professional (Blue & Gray)</SelectItem>
                    <SelectItem value="vibrant" className="text-slate-700 font-medium">Vibrant (Colorful)</SelectItem>
                    <SelectItem value="minimal" className="text-slate-700 font-medium">Minimal (Black & White)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="premium-modal-footer">
          <div className="text-xs text-slate-600 font-semibold mr-auto">
            {chartsCount} chart{chartsCount !== 1 ? 's' : ''} • {selectedCount} section{selectedCount !== 1 ? 's' : ''}
          </div>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-white font-semibold px-6"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onExportWord}
            disabled={loading}
            className="btn-premium-secondary px-6"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Export as Word
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={loading}
            className="btn-premium px-6"
          >
            <Download size={16} className="mr-2" />
            Export as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { DEFAULT_EXPORT_OPTIONS };
export default ExportOptionsModalEnhanced;


