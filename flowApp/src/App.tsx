import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronUp, ArrowRight, ArrowDown, Play, StopCircle, Check, XCircle, Download, Upload, Moon, Sun } from 'lucide-react';
import FlowSimulation from './components/FlowSimulation';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';

// Types
type StepType = 'normal' | 'success' | 'failure';

interface SubStep {
  id: string;
  content: string;
}

interface Step {
  id: string;
  title: string;
  type: StepType;
  subSteps: {
    id: string;
    content: string;
    successAction: 'next' | 'goto';
    failureAction: 'next' | 'goto';
    successStepId?: string;
    failureStepId?: string;
  }[];
  expanded: boolean;
  successStepId?: string;
  failureStepId?: string;
}

// Main Component
const FlowDiagramBuilder = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<Array<{
    stepId: string;
    result: 'success' | 'failure';
    timestamp: number;
  }>>([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selectedStep = steps.find(step => step.id === selectedStepId);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addStep = (type: StepType = 'normal') => {
    if (!newStepTitle.trim()) return;

    const newStep: Step = {
      id: generateId(),
      title: newStepTitle,
      type,
      subSteps: [],
      expanded: true
    };

    setSteps([...steps, newStep]);
    setNewStepTitle('');
  };

  const addSubStep = (stepId: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: [
            ...step.subSteps,
            {
              id: generateId(),
              content: '',
              successAction: 'next',
              failureAction: 'next'
            }
          ]
        };
      }
      return step;
    }));
  };

  const updateSubStep = (stepId: string, subStepId: string, content: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: step.subSteps.map(subStep => 
            subStep.id === subStepId ? { ...subStep, content } : subStep
          )
        };
      }
      return step;
    }));
  };

  const updateSubStepConfig = (
    stepId: string,
    subStepId: string,
    config: {
      successAction?: 'next' | 'goto';
      failureAction?: 'next' | 'goto';
      successStepId?: string;
      failureStepId?: string;
    }
  ) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: step.subSteps.map(subStep => {
            if (subStep.id === subStepId) {
              return { ...subStep, ...config };
            }
            return subStep;
          })
        };
      }
      return step;
    }));
  };

  const toggleExpand = (stepId: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, expanded: !step.expanded } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const deleteSubStep = (stepId: string, subStepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: step.subSteps.filter(subStep => subStep.id !== subStepId)
        };
      }
      return step;
    }));
  };

  const connectSuccessStep = (sourceId: string, targetId: string) => {
    setSteps(steps.map(step => 
      step.id === sourceId ? { ...step, successStepId: targetId } : step
    ));
  };

  const connectFailureStep = (sourceId: string, targetId: string) => {
    setSteps(steps.map(step => 
      step.id === sourceId ? { ...step, failureStepId: targetId } : step
    ));
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationHistory([]);
    setCurrentStepId(steps[0]?.id || null);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setCurrentStepId(null);
    setSimulationHistory([]);
  };

  const handleStepResult = (result: 'success' | 'failure') => {
    if (!currentStepId) return;

    const currentStep = steps.find(s => s.id === currentStepId);
    if (!currentStep) return;

    // Add to history
    setSimulationHistory(prev => [...prev, {
      stepId: currentStepId,
      result,
      timestamp: Date.now()
    }]);

    // Find next step
    const nextStepId = result === 'success' 
      ? currentStep.successStepId 
      : currentStep.failureStepId;

    if (nextStepId) {
      setCurrentStepId(nextStepId);
    } else {
      // End of flow
      setCurrentStepId(null);
      setIsSimulating(false); // End simulation when reaching end of flow
    }
  };

  const handleStepClick = (stepId: string) => {
    if (!isSimulating) return;
    
    // Only allow clicking steps that are connected to the current step
    const currentStep = steps.find(s => s.id === currentStepId);
    if (!currentStep) return;

    if (currentStep.successStepId === stepId || currentStep.failureStepId === stepId) {
      setCurrentStepId(stepId);
    }
  };

  const exportConfiguration = () => {
    const configuration = {
      steps,
      version: '1.0' // for future compatibility
    };
    
    const blob = new Blob([JSON.stringify(configuration, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-configuration-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configuration = JSON.parse(e.target?.result as string);
        if (configuration.steps) {
          setSteps(configuration.steps);
        }
      } catch (error) {
        alert('Error importing configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-4 max-w-[1600px] mx-auto flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Flow Diagram Builder
          </h1>
          <div className="flex items-center gap-4">
            {/* Simulation Button */}
            <button
              onClick={() => setShowSimulation(true)}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold ${
                isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              <Play className="w-5 h-5" />
              Start Simulation
            </button>

            {/* Export Button */}
            <button
              onClick={exportConfiguration}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              <Download className="w-5 h-5" />
              Export
            </button>

            {/* Import Button */}
            <label className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold cursor-pointer ${
              isDarkMode 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}>
              <Upload className="w-5 h-5" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importConfiguration}
                className="hidden"
              />
            </label>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors duration-200`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex">
        {/* Left Panel - Steps List */}
        <div className={`w-80 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="mb-4">
            <div className={`flex gap-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-3 rounded-xl shadow-sm`}>
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Enter step title"
                className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
              />
              <button
                onClick={() => {
                  addStep('normal');
                  setNewStepTitle('');
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto h-[calc(100vh-200px)]">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedStepId === step.id
                    ? isDarkMode 
                      ? 'bg-gray-700' 
                      : 'bg-blue-50'
                    : isDarkMode 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-50'
                } ${
                  step.type === 'success'
                    ? 'border-l-4 border-green-500'
                    : step.type === 'failure'
                    ? 'border-l-4 border-red-500'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-sm text-gray-500">
                    {step.subSteps.length} sub-steps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Step Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedStep ? (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-6">
                <input
                  type="text"
                  value={selectedStep.title}
                  onChange={(e) => updateStepTitle(selectedStep.id, e.target.value)}
                  className={`text-xl font-semibold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
                <button
                  onClick={() => {
                    deleteStep(selectedStep.id);
                    setSelectedStepId(null);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Configuration */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Success Step Configuration */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    On Success, go to:
                  </label>
                  <select
                    value={selectedStep.successStepId || ''}
                    onChange={(e) => {
                      const updatedSteps = steps.map(s =>
                        s.id === selectedStep.id ? { ...s, successStepId: e.target.value || undefined } : s
                      );
                      setSteps(updatedSteps);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <option value="">Select Step</option>
                    {steps
                      .filter(s => s.id !== selectedStep.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Failure Step Configuration */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    On Failure, go to:
                  </label>
                  <select
                    value={selectedStep.failureStepId || ''}
                    onChange={(e) => {
                      const updatedSteps = steps.map(s =>
                        s.id === selectedStep.id ? { ...s, failureStepId: e.target.value || undefined } : s
                      );
                      setSteps(updatedSteps);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <option value="">Select Step</option>
                    {steps
                      .filter(s => s.id !== selectedStep.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Sub-steps */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Sub-steps
                </h3>
                {selectedStep.subSteps.map((subStep) => (
                  <div key={subStep.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={subStep.content}
                        onChange={(e) => updateSubStep(selectedStep.id, subStep.id, e.target.value)}
                        placeholder="Enter sub-step details"
                        className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                        }`}
                      />
                      <button
                        onClick={() => deleteSubStep(selectedStep.id, subStep.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sub-step configuration */}
                    <div className="ml-7 grid grid-cols-2 gap-4">
                      {/* Success configuration */}
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          On Success:
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={subStep.successAction}
                            onChange={(e) => updateSubStepConfig(selectedStep.id, subStep.id, {
                              successAction: e.target.value as 'next' | 'goto'
                            })}
                            className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-800'
                            }`}
                          >
                            <option value="next">Go to Next Sub-step</option>
                            <option value="goto">Go to Step</option>
                          </select>
                          {subStep.successAction === 'goto' && (
                            <select
                              value={subStep.successStepId || ''}
                              onChange={(e) => updateSubStepConfig(selectedStep.id, subStep.id, {
                                successStepId: e.target.value
                              })}
                              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-200 text-gray-800'
                              }`}
                            >
                              <option value="">Select Step</option>
                              {steps.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                  {s.subSteps.length > 0 ? ` (${s.subSteps.length} sub-steps)` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Failure configuration */}
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          On Failure:
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={subStep.failureAction}
                            onChange={(e) => updateSubStepConfig(selectedStep.id, subStep.id, {
                              failureAction: e.target.value as 'next' | 'goto'
                            })}
                            className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-800'
                            }`}
                          >
                            <option value="next">Go to Next Sub-step</option>
                            <option value="goto">Go to Step</option>
                          </select>
                          {subStep.failureAction === 'goto' && (
                            <select
                              value={subStep.failureStepId || ''}
                              onChange={(e) => updateSubStepConfig(selectedStep.id, subStep.id, {
                                failureStepId: e.target.value
                              })}
                              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-200 text-gray-800'
                              }`}
                            >
                              <option value="">Select Step</option>
                              {steps.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                  {s.subSteps.length > 0 ? ` (${s.subSteps.length} sub-steps)` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addSubStep(selectedStep.id)}
                  className={`mt-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Sub-step
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-center h-full text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select a step to view and edit its details
            </div>
          )}
        </div>
      </div>

      {showSimulation && (
        <FlowSimulation
          steps={steps}
          onClose={() => setShowSimulation(false)}
        />
      )}
    </div>
  );
};

// Wrap the component with DarkModeProvider
const App = () => {
  return (
    <DarkModeProvider>
      <FlowDiagramBuilder />
    </DarkModeProvider>
  );
};

export default App;