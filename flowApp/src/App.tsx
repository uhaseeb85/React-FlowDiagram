import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronUp, ArrowRight, ArrowDown, Play, StopCircle, Check, XCircle, Download, Upload } from 'lucide-react';
import FlowSimulation from './components/FlowSimulation';

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
    <div className="p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Flow Diagram Builder</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSimulation(true)}
              className="px-6 py-2.5 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Play className="w-5 h-5" />
              Start Simulation
            </button>
            <button
              onClick={exportConfiguration}
              className="px-6 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <label className="px-6 py-2.5 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all duration-200 flex items-center gap-2 font-semibold cursor-pointer">
              <Upload className="w-5 h-5" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importConfiguration}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="flex gap-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <input
            type="text"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Enter step title"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 shadow-sm"
          />
          <button
            onClick={() => addStep('normal')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 font-semibold shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Add Step
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            className={`bg-white shadow-lg rounded-2xl p-8 transition-all duration-200 hover:shadow-xl ${
              currentStepId === step.id ? 'ring-2 ring-blue-500' : ''
            } ${
              isSimulating ? 'cursor-pointer' : ''
            } ${
              step.type === 'success'
                ? 'border-2 border-green-500/50 hover:border-green-500'
                : step.type === 'failure'
                ? 'border-2 border-red-500/50 hover:border-red-500'
                : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(step.id);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  {step.expanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <h3 className="text-2xl font-bold text-gray-800">{step.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                <select
                  onChange={(e) => connectSuccessStep(step.id, e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white shadow-sm hover:border-green-500 transition-colors duration-200"
                  value={step.successStepId || ''}
                >
                  <option value="">Connect Success →</option>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <select
                  onChange={(e) => connectFailureStep(step.id, e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white shadow-sm hover:border-red-500 transition-colors duration-200"
                  value={step.failureStepId || ''}
                >
                  <option value="">Connect Failure →</option>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStep(step.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {step.expanded && (
              <div className="pl-8 space-y-3">
                {step.subSteps.map((subStep) => (
                  <div key={subStep.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={subStep.content}
                        onChange={(e) =>
                          updateSubStep(step.id, subStep.id, e.target.value)
                        }
                        placeholder="Enter sub-step details"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={() => deleteSubStep(step.id, subStep.id)}
                        className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sub-step configuration */}
                    <div className="ml-7 grid grid-cols-2 gap-4">
                      {/* Success configuration */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">On Success:</label>
                        <div className="flex gap-2">
                          <select
                            value={subStep.successAction}
                            onChange={(e) => updateSubStepConfig(step.id, subStep.id, {
                              successAction: e.target.value as 'next' | 'goto'
                            })}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            <option value="next">Go to Next Sub-step</option>
                            <option value="goto">Go to Step</option>
                          </select>
                          {subStep.successAction === 'goto' && (
                            <select
                              value={subStep.successStepId || ''}
                              onChange={(e) => updateSubStepConfig(step.id, subStep.id, {
                                successStepId: e.target.value
                              })}
                              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            >
                              <option value="">Select Step</option>
                              {steps.filter(s => s.id !== step.id).map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Failure configuration */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">On Failure:</label>
                        <div className="flex gap-2">
                          <select
                            value={subStep.failureAction}
                            onChange={(e) => updateSubStepConfig(step.id, subStep.id, {
                              failureAction: e.target.value as 'next' | 'goto'
                            })}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          >
                            <option value="next">Go to Next Sub-step</option>
                            <option value="goto">Go to Step</option>
                          </select>
                          {subStep.failureAction === 'goto' && (
                            <select
                              value={subStep.failureStepId || ''}
                              onChange={(e) => updateSubStepConfig(step.id, subStep.id, {
                                failureStepId: e.target.value
                              })}
                              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            >
                              <option value="">Select Step</option>
                              {steps.filter(s => s.id !== step.id).map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addSubStep(step.id);
                  }}
                  className="mt-4 px-5 py-2.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Sub-step
                </button>
              </div>
            )}

            {(step.successStepId || step.failureStepId) && (
              <div className="mt-8 pl-12 space-y-3 border-t pt-6 border-gray-100">
                {step.successStepId && (
                  <div className="flex items-center gap-3 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-semibold">Success → {steps.find(s => s.id === step.successStepId)?.title}</span>
                  </div>
                )}
                {step.failureStepId && (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-semibold">Failure → {steps.find(s => s.id === step.failureStepId)?.title}</span>
                  </div>
                )}
              </div>
            )}

            {isSimulating && currentStepId === step.id && (
              <div className="mt-6 pl-12 space-y-6">
                {/* Show substeps first */}
                {step.subSteps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">Sub-steps:</h4>
                    {step.subSteps.map((subStep, index) => (
                      <div key={subStep.id} className="flex items-center gap-3 text-gray-600">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        {subStep.content}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show next possible steps */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Next step:</h4>
                  <div className="flex gap-4">
                    {step.successStepId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepResult('success');
                        }}
                        className="px-6 py-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors duration-200 flex items-center gap-2 font-semibold"
                      >
                        <Check className="w-5 h-5" />
                        Success: {steps.find(s => s.id === step.successStepId)?.title}
                      </button>
                    )}
                    {step.failureStepId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepResult('failure');
                        }}
                        className="px-6 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-200 flex items-center gap-2 font-semibold"
                      >
                        <XCircle className="w-5 h-5" />
                        Failure: {steps.find(s => s.id === step.failureStepId)?.title}
                      </button>
                    )}
                    {!step.successStepId && !step.failureStepId && (
                      <div className="text-gray-500 italic">
                        No next steps configured. This is an end point.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {simulationHistory.filter(h => h.stepId === step.id).length > 0 && (
              <div className="mt-4 pl-12">
                {simulationHistory
                  .filter(h => h.stepId === step.id)
                  .map((history, index) => (
                    <div
                      key={index}
                      className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                        history.result === 'success'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {history.result === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {history.result}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
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

export default FlowDiagramBuilder;