import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronUp, ArrowRight, ArrowDown } from 'lucide-react';

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
  subSteps: SubStep[];
  expanded: boolean;
  successStepId?: string;
  failureStepId?: string;
}

// Main Component
const FlowDiagramBuilder = () => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');

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
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: [...step.subSteps, { id: generateId(), content: '' }]
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-4">Flow Diagram Builder</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Enter step title"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => addStep('normal')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Step
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`border rounded-lg p-4 ${
              step.type === 'success'
                ? 'border-green-500'
                : step.type === 'failure'
                ? 'border-red-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(step.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {step.expanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <h3 className="text-lg font-medium">{step.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => connectSuccessStep(step.id, e.target.value)}
                  className="px-2 py-1 border rounded"
                  value={step.successStepId || ''}
                >
                  <option value="">Success Step →</option>
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
                  className="px-2 py-1 border rounded"
                  value={step.failureStepId || ''}
                >
                  <option value="">Failure Step →</option>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => deleteStep(step.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {step.expanded && (
              <div className="pl-6 space-y-3">
                {step.subSteps.map((subStep) => (
                  <div key={subStep.id} className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={subStep.content}
                      onChange={(e) =>
                        updateSubStep(step.id, subStep.id, e.target.value)
                      }
                      placeholder="Enter sub-step details"
                      className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => deleteSubStep(step.id, subStep.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSubStep(step.id)}
                  className="mt-2 px-3 py-1 text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Sub-step
                </button>
              </div>
            )}

            {(step.successStepId || step.failureStepId) && (
              <div className="mt-4 pl-6 space-y-2">
                {step.successStepId && (
                  <div className="flex items-center gap-2 text-green-600">
                    <ArrowDown className="w-4 h-4" />
                    Success → {steps.find(s => s.id === step.successStepId)?.title}
                  </div>
                )}
                {step.failureStepId && (
                  <div className="flex items-center gap-2 text-red-600">
                    <ArrowDown className="w-4 h-4" />
                    Failure → {steps.find(s => s.id === step.failureStepId)?.title}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowDiagramBuilder;